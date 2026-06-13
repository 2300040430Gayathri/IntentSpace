require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import all models
const User = require('../models/User');
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

const ADMIN_EMAIL = 'vslgayathri156@gmail.com';

async function run() {
  console.log('=== STARTING DATABASE BACKUP & SAFE CLEANUP ===');

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Database connected successfully.');

  const db = mongoose.connection.db;

  // 1. Create a complete backup of all collections
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Backup directory created: ${backupDir}`);

  const collections = await db.collections();
  console.log(`Found ${collections.length} collections. Starting backup...`);

  for (const col of collections) {
    const name = col.collectionName;
    const documents = await col.find({}).toArray();
    const backupFilePath = path.join(backupDir, `${name}.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(documents, null, 2));
    console.log(`- Backed up ${documents.length} documents from collection: "${name}"`);
  }
  console.log('✔ Full database backup completed successfully.');

  // 2. Identify the primary admin user
  const adminUser = await User.findOne({ email: ADMIN_EMAIL });
  if (!adminUser) {
    console.error(`ERROR: Primary admin account "${ADMIN_EMAIL}" not found. Deletion aborted.`);
    process.exit(1);
  }
  console.log(`✔ Found primary admin user: ${adminUser.name} (${adminUser.email}) with ID: ${adminUser._id}`);

  // 3. Find other users to be deleted
  const usersToDelete = await User.find({ email: { $ne: ADMIN_EMAIL } });
  const userIdsToDelete = usersToDelete.map(u => u._id);
  console.log(`Found ${usersToDelete.length} non-admin user account(s) marked for cleanup.`);

  if (usersToDelete.length === 0) {
    console.log('No other user accounts to delete. Database is already clean.');
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }

  console.log('Deleting associated user data...');

  const modelMap = [
    { model: Task, name: 'Tasks' },
    { model: Habit, name: 'Habits' },
    { model: HabitEntry, name: 'HabitEntries' },
    { model: Diary, name: 'Diaries' },
    { model: Note, name: 'Notes' },
    { model: FocusSession, name: 'FocusSessions' },
    { model: Memory, name: 'Memories' },
    { model: Skill, name: 'Skills' },
    { model: SkillEntry, name: 'SkillEntries' },
    { model: Mood, name: 'Moods' },
    { model: WritingProgress, name: 'WritingProgress' },
    { model: Notification, name: 'Notifications' },
    { model: Feedback, name: 'Feedbacks' },
    { model: VoiceConversation, name: 'VoiceConversations' },
    { model: AIReport, name: 'AIReports' },
    { model: Planner, name: 'Planners' },
  ];

  const deleteStats = {};

  for (const item of modelMap) {
    const result = await item.model.deleteMany({ user: { $in: userIdsToDelete } });
    deleteStats[item.name] = result.deletedCount;
    console.log(`- Deleted ${result.deletedCount} documents from: "${item.name}"`);
  }

  // 4. Delete the user accounts themselves
  const userDeleteResult = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
  console.log(`- Deleted ${userDeleteResult.deletedCount} user accounts from "Users" collection.`);

  console.log('\n=== CLEANUP SUMMARY ===');
  console.log(`Users Deleted: ${userDeleteResult.deletedCount}`);
  for (const [key, count] of Object.entries(deleteStats)) {
    console.log(`- Related ${key} Deleted: ${count}`);
  }

  // Double check that only the primary admin remains
  const remainingUsers = await User.find({});
  console.log(`\nRemaining users in database: ${remainingUsers.length}`);
  remainingUsers.forEach(u => {
    console.log(`- ${u.name} | ${u.email} | Role: ${u.role} | Verified: ${u.isVerified}`);
  });

  if (remainingUsers.length !== 1 || remainingUsers[0].email !== ADMIN_EMAIL) {
    console.error('WARNING: Database user count is not exactly 1 or primary admin email mismatch.');
  } else {
    console.log('✔ Verified: Only the primary admin account remains in the database.');
  }

  await mongoose.disconnect();
  console.log('Database connection closed.');
  console.log('=== DATABASE CLEANUP COMPLETED ===');
}

run().catch((err) => {
  console.error('❌ Deletion process failed:', err);
  process.exit(1);
});
