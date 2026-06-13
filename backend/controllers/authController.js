const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const generateToken = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const OTP_EXPIRE_MS = 10 * 60 * 1000;

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const logOtpDevMode = (email, otp) => {
  console.log('[OTP DEV MODE]');
  console.log(`Email: ${email}`);
  console.log(`OTP: ${otp}`);
};

const assignOtp = async (user) => {
  const otp = generateOtp();
  user.verificationToken = hashOtp(otp);
  user.verificationTokenExpire = Date.now() + OTP_EXPIRE_MS;
  await user.save({ validateBeforeSave: false });
  try {
    await sendVerificationEmail(user, otp);
  } catch (err) {
    console.error('Verification email failed:', err.message);
    logOtpDevMode(user.email, otp);
  }
  return OTP_EXPIRE_MS;
};

const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  theme: user.theme,
  role: user.role,
  isVerified: user.isVerified,
  notifications: user.notifications,
  dailyCheckIn: user.dailyCheckIn,
  lastCheckIn: user.lastCheckIn,
  englishLevel: user.englishLevel,
  writingStats: user.writingStats,
  lastLogin: user.lastLogin,
});

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const options = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: userPayload(user),
    });
};

exports.register = asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({
    name,
    email,
    password,
    isVerified: false,
  });

  const expiresIn = await assignOtp(user);
  res.status(201).json({
    success: true,
    message: 'Account created. Please verify your email with the OTP sent.',
    email: user.email,
    requiresVerification: true,
    expiresIn,
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before logging in',
      requiresVerification: true,
      email: user.email,
    });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out' });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: userPayload(req.user) });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      requiresVerification: true,
      email: req.user.email,
    });
  }
  sendTokenResponse(req.user, 200, res);
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  const hashedOtp = hashOtp(String(otp).trim());

  const user = await User.findOne({
    email,
    verificationToken: hashedOtp,
    verificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const user = await User.findOne({
    verificationToken: token?.length === 6 ? hashOtp(token) : token,
    verificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({ success: true, message: 'If the account exists, a new OTP has been sent' });
  }

  if (user.isVerified) {
    return res.status(400).json({ success: false, message: 'Email already verified' });
  }

  try {
    const expiresIn = await assignOtp(user);
    res.status(200).json({ success: true, message: 'OTP sent successfully', expiresIn });
  } catch (err) {
    console.error('Resend OTP failed:', err.message);
    res.status(200).json({
      success: true,
      message: 'OTP regenerated. Check your email or server console in dev mode.',
      expiresIn: OTP_EXPIRE_MS,
    });
  }
});

exports.resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.isVerified) {
    return res.status(400).json({ success: false, message: 'Email already verified' });
  }

  try {
    const expiresIn = await assignOtp(user);
    res.status(200).json({ success: true, message: 'OTP sent successfully', expiresIn });
  } catch (err) {
    console.error('Resend OTP failed:', err.message);
    res.status(200).json({
      success: true,
      message: 'OTP regenerated. Check your email or server console in dev mode.',
      expiresIn: OTP_EXPIRE_MS,
    });
  }
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = email ? await User.findOne({ email }) : null;
  if (!user) {
    return res.status(200).json({ success: true, message: 'If email exists, reset OTP sent' });
  }

  const otp = generateOtp();
  user.resetPasswordToken = hashOtp(otp);
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user, otp);
  } catch (err) {
    console.error('Password reset email failed:', err.message);
  }
  res.status(200).json({ success: true, message: 'If email exists, reset OTP sent' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.token).trim();
  const resetPasswordToken = hashOtp(otp);

  const user = await User.findOne({
    email,
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset OTP code' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const fields = ['name', 'bio', 'avatar', 'timezone', 'theme', 'notifications', 'dailyCheckIn'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  res.status(200).json({ success: true, user: userPayload(req.user) });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required to delete your account' });
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Incorrect password' });
  }

  if (user.role === 'admin' || user.email === 'vslgayathri156@gmail.com') {
    return res.status(403).json({ success: false, message: 'Administrator accounts cannot be deleted' });
  }

  const userId = req.user._id;

  // Import related models
  const Task = require('../models/Task');
  const Habit = require('../models/Habit');
  const HabitEntry = require('../models/HabitEntry');
  const Diary = require('../models/Diary');
  const Note = require('../models/Note');
  const FocusSession = require('../models/FocusSession');
  const Memory = require('../models/Memory');
  const Skill = require('../models/Skill');
  const SkillEntry = require('../models/SkillEntry');
  const Mood = require('../models/Mood');
  const WritingProgress = require('../models/WritingProgress');
  const Notification = require('../models/Notification');
  const Feedback = require('../models/Feedback');
  const VoiceConversation = require('../models/VoiceConversation');
  const AIReport = require('../models/AIReport');
  const Planner = require('../models/Planner');

  // Cascade delete all associated user data
  await Promise.all([
    Task.deleteMany({ user: userId }),
    Habit.deleteMany({ user: userId }),
    HabitEntry.deleteMany({ user: userId }),
    Diary.deleteMany({ user: userId }),
    Note.deleteMany({ user: userId }),
    FocusSession.deleteMany({ user: userId }),
    Memory.deleteMany({ user: userId }),
    Skill.deleteMany({ user: userId }),
    SkillEntry.deleteMany({ user: userId }),
    Mood.deleteMany({ user: userId }),
    WritingProgress.deleteMany({ user: userId }),
    Notification.deleteMany({ user: userId }),
    Feedback.deleteMany({ user: userId }),
    VoiceConversation.deleteMany({ user: userId }),
    AIReport.deleteMany({ user: userId }),
    Planner.deleteMany({ user: userId }),
  ]);

  // Delete the user record
  await User.findByIdAndDelete(userId);

  res.cookie('token', 'none', { expires: new Date(Date.now() + 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Account deleted' });
});
