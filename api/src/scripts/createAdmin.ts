import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

const adminData = {
  email: 'admin@suvenirs.cl',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'Suvenirs',
  role: 'admin' as const,
  isActive: true,
  isVerified: true,
};

async function createAdmin() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(adminData);
    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n⚠️  Please change the password after first login!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
