import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

async function cleanEmptyCategories() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count all categories
    const totalCategories = await Category.countDocuments();
    console.log(`📊 Total categories: ${totalCategories}`);

    // Find categories with 0 products
    const emptyCategories = await Category.find({ productCount: 0 }).sort({ name: 1 });

    console.log(`🔍 Categories with 0 products: ${emptyCategories.length}\n`);

    if (emptyCategories.length === 0) {
      console.log('✅ No empty categories found. All categories have products!');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Show empty categories
    console.log('📋 Categories to delete:');
    emptyCategories.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat.name} (ID: ${cat.categoryId})`);
    });

    // Delete empty categories
    console.log('\n🗑️  Deleting empty categories...');
    const deleteResult = await Category.deleteMany({ productCount: 0 });

    console.log(`\n✅ Deleted ${deleteResult.deletedCount} empty categories`);

    // Show final statistics
    const remainingCategories = await Category.countDocuments();
    const categoriesWithProducts = await Category.countDocuments({ productCount: { $gt: 0 } });

    console.log('\n📊 Final Statistics:');
    console.log(`   Total categories remaining: ${remainingCategories}`);
    console.log(`   Categories with products: ${categoriesWithProducts}`);
    console.log(`   Categories deleted: ${totalCategories - remainingCategories}`);

    await mongoose.disconnect();
    console.log('\n✅ Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanEmptyCategories();
