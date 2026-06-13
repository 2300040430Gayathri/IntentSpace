#!/usr/bin/env node
/**
 * Promote a user to admin role.
 * Usage: node scripts/makeAdmin.js user@example.com
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/makeAdmin.js <email>');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  if (!user) {
    console.error('User not found:', email);
    process.exit(1);
  }
  console.log(`Promoted ${user.email} to admin`);
  process.exit(0);
});
