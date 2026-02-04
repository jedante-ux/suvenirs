import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

async function checkUsers() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find().select('email role isActive isVerified');

    console.log(`📊 Total users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found in database');
    } else {
      console.log('Users:');
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Verified: ${user.isVerified}\n`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
