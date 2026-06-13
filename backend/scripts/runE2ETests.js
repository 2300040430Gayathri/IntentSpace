require('dotenv').config();
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const Diary = require('../models/Diary');
const crypto = require('crypto');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const TEST_EMAIL = 'testuser@example.com';
const TEST_PASSWORD = 'password123';
const NEW_PASSWORD = 'newpassword123';

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function run() {
  console.log('=== STARTING INTENTSPACE E2E INTEGRATION TESTS ===');

  // 1. Connect to MongoDB to manage test records
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Database connected successfully.');

  // Clean up any existing test user and their tasks/diaries
  const existingUser = await User.findOne({ email: TEST_EMAIL });
  if (existingUser) {
    console.log('Cleaning up existing test data...');
    await Task.deleteMany({ user: existingUser._id });
    await Diary.deleteMany({ user: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
  }

  // 2. Start the Express server as a child process
  console.log('Starting Express server...');
  const serverProcess = spawn('node', ['server.js'], {
    cwd: 'c:/Users/ADMIN/Desktop/IntentSpace/backend',
    env: { ...process.env, PORT: String(PORT) },
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString().trim()}`);
  });

  // Wait for server to boot by polling the health endpoint
  let serverReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch (err) {
      // Ignore connection error during startup
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (!serverReady) {
    console.error('Server failed to start in time.');
    serverProcess.kill();
    process.exit(1);
  }
  console.log('Server is running and healthy.');

  let authToken = null;
  let testUserId = null;

  try {
    // 3. Signup Test
    console.log('\n--- Test Step 1: User Signup ---');
    const signupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const signupData = await signupRes.json();
    console.log('Signup Response:', signupData);
    if (!signupData.success || !signupData.requiresVerification) {
      throw new Error('Signup failed or did not request verification');
    }
    console.log('✔ Signup succeeded and returned requiresVerification: true');

    // 4. Verify user exists in database and fetch verification token
    const unverifiedUser = await User.findOne({ email: TEST_EMAIL });
    if (!unverifiedUser || unverifiedUser.isVerified) {
      throw new Error('User was not created in database or is already verified');
    }
    console.log('✔ User created in database as unverified.');

    // Since we cannot read the actual email in the test script, we retrieve the OTP
    // by finding the OTP code from the database. Let's find the OTP:
    // The OTP in database is stored as a SHA-256 hash. Let's find what actual 6-digit OTP
    // matches the verificationToken in the database.
    let otp = null;
    for (let code = 100000; code <= 999999; code++) {
      if (hashOtp(String(code)) === unverifiedUser.verificationToken) {
        otp = String(code);
        break;
      }
    }

    if (!otp) {
      throw new Error('Could not crack/retrieve OTP from database hash');
    }
    console.log(`✔ Retrieved OTP from database (dev shortcut): ${otp}`);

    // 5. Verification Test
    console.log('\n--- Test Step 2: Email Verification OTP ---');
    const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        otp,
      }),
    });
    const verifyData = await verifyRes.json();
    console.log('Verification Response:', verifyData);
    if (!verifyData.success || !verifyData.token) {
      throw new Error('OTP verification failed');
    }
    console.log('✔ OTP verified successfully. Received authentication token.');
    authToken = verifyData.token;
    testUserId = verifyData.user._id;

    // Verify user is verified in DB
    const verifiedUser = await User.findOne({ email: TEST_EMAIL });
    if (!verifiedUser.isVerified) {
      throw new Error('User is still marked as unverified in DB after successful verification API call');
    }
    console.log('✔ Database user model successfully updated to isVerified: true.');

    // 6. Login Test
    console.log('\n--- Test Step 3: Login ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    if (!loginData.success || !loginData.token) {
      throw new Error('Login failed with correct credentials');
    }
    console.log('✔ Login succeeded.');

    // 7. Protected Route Test (/me)
    console.log('\n--- Test Step 4: Protected Routes & Session Persistence ---');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });
    const meData = await meRes.json();
    console.log('/me Response:', meData);
    if (!meData.success || meData.user.email !== TEST_EMAIL) {
      throw new Error('Failed to retrieve user profile using JWT token');
    }
    console.log('✔ Protected route accessed successfully using JWT token.');

    // 8. Streak calculation test (Verify dailyStreak starts at 1 on first journal entry)
    console.log('\n--- Test Step 5: Streak calculation (First Entry) ---');
    const diaryRes = await fetch(`${BASE_URL}/diary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: 'My First Journal Entry',
        content: 'I am writing my very first journal entry in IntentSpace. This is exciting!',
        mood: 'good',
        date: new Date().toISOString(),
      }),
    });
    const diaryData = await diaryRes.json();
    console.log('Create Diary Response:', diaryData ? { success: diaryData.success } : null);

    // Query user stats in database
    const userWithStats = await User.findById(testUserId);
    console.log('Writing Stats after first entry:', userWithStats.writingStats);
    if (userWithStats.writingStats.dailyStreak !== 1) {
      throw new Error(`Daily streak was not initialized to 1. Got: ${userWithStats.writingStats.dailyStreak}`);
    }
    console.log('✔ Streak calculation logic correctly initialized dailyStreak to 1.');

    // 9. Task ownership security test (reorder tasks)
    console.log('\n--- Test Step 6: Task Reordering Security ---');
    const task1 = await Task.create({ title: 'Task 1', user: testUserId, order: 1 });
    const task2 = await Task.create({ title: 'Task 2', user: testUserId, order: 2 });
    
    const reorderRes = await fetch(`${BASE_URL}/tasks/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        tasks: [
          { id: task1._id.toString(), order: 2 },
          { id: task2._id.toString(), order: 1 },
        ],
      }),
    });
    const reorderData = await reorderRes.json();
    console.log('Reorder Tasks Response:', reorderData);
    if (!reorderData.success) {
      throw new Error('Failed to reorder tasks');
    }

    const updatedTask1 = await Task.findById(task1._id);
    if (updatedTask1.order !== 2) {
      throw new Error('Task reordering did not update values');
    }
    console.log('✔ Task reordering succeeded.');

    // 10. Forgot Password Flow Test (OTP)
    console.log('\n--- Test Step 7: Forgot Password OTP ---');
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });
    const forgotData = await forgotRes.json();
    console.log('Forgot Password Response:', forgotData);
    if (!forgotData.success) {
      throw new Error('Forgot password request failed');
    }
    console.log('✔ Forgot password requested successfully.');

    // Find the forgot password OTP code from database
    const userForReset = await User.findOne({ email: TEST_EMAIL });
    let resetOtp = null;
    for (let code = 100000; code <= 999999; code++) {
      if (hashOtp(String(code)) === userForReset.resetPasswordToken) {
        resetOtp = String(code);
        break;
      }
    }

    if (!resetOtp) {
      throw new Error('Could not retrieve reset password OTP from database');
    }
    console.log(`✔ Retrieved Reset OTP from database: ${resetOtp}`);

    // 11. Reset Password Test
    console.log('\n--- Test Step 8: Reset Password ---');
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        token: resetOtp,
        password: NEW_PASSWORD,
      }),
    });
    const resetData = await resetRes.json();
    console.log('Reset Password Response:', resetData);
    if (!resetData.success) {
      throw new Error('Reset password API call failed');
    }
    console.log('✔ Password reset succeeded.');

    // 12. Verify login with old password fails, new password succeeds
    console.log('\n--- Test Step 9: Login with New Password ---');
    const failLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    console.log('Login with OLD password status:', failLoginRes.status);
    if (failLoginRes.ok) {
      throw new Error('Login with old password succeeded after reset');
    }
    console.log('✔ Login with old password rejected.');

    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: NEW_PASSWORD,
      }),
    });
    const newLoginData = await newLoginRes.json();
    console.log('Login with NEW password Response:', newLoginData);
    if (!newLoginRes.ok || !newLoginData.success) {
      throw new Error('Login with new password failed');
    }
    console.log('✔ Login with new password succeeded.');

    console.log('\n==================================================');
    console.log('✔✔ ALL END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY! ✔✔');
    console.log('==================================================');
  } finally {
    // Cleanup database and shutdown server
    console.log('\nCleaning up database records...');
    const testUser = await User.findOne({ email: TEST_EMAIL });
    if (testUser) {
      await Task.deleteMany({ user: testUser._id });
      await Diary.deleteMany({ user: testUser._id });
      await User.deleteOne({ _id: testUser._id });
    }
    await mongoose.disconnect();
    console.log('Database connection closed.');

    console.log('Shutting down Express server...');
    serverProcess.kill();
    console.log('Express server closed.');
  }
}

run().catch((err) => {
  console.error('\n❌ E2E INTEGRATION TEST SUITE FAILED:', err);
  process.exit(1);
});
