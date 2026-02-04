import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

async function listCategories() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const categories = await Category.find().sort({ productCount: -1 }).select('name productCount');

    console.log(`📊 Categorías con productos (${categories.length} total):\n`);
    categories.forEach((cat, idx) => {
      console.log(`${idx + 1}. ${cat.name}: ${cat.productCount} productos`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listCategories();
