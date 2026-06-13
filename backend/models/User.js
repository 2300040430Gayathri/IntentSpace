const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    timezone: { type: String, default: 'UTC' },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    notifications: {
      habits: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true },
      focus: { type: Boolean, default: true },
      planner: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
    },
    dailyCheckIn: { type: Boolean, default: true },
    lastCheckIn: Date,
    focusStreak: { type: Number, default: 0 },
    lastFocusDate: Date,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    lastLogin: Date,
    englishLevel: { type: String, default: 'Beginner' },
    writingStats: {
      totalEntries: { type: Number, default: 0 },
      totalWords: { type: Number, default: 0 },
      dailyStreak: { type: Number, default: 0 },
      weeklyStreak: { type: Number, default: 0 },
      monthlyStreak: { type: Number, default: 0 },
      lastJournalDate: Date,
      improvementPct: { type: Number, default: 0 },
      baselineScore: { type: Number, default: 0 },
      currentScore: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
