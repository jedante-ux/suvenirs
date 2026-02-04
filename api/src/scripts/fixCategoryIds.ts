import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

function generateCategoryId(index: number): string {
  return `CAT-${String(index).padStart(3, '0')}`;
}

async function fixCategoryIds() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all categories sorted by createdAt
    const categories = await Category.find({}).sort({ createdAt: 1 });
    console.log(`📊 Found ${categories.length} categories`);

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];

      // Check if categoryId is missing or empty
      if (!category.categoryId || category.categoryId.trim() === '') {
        category.categoryId = generateCategoryId(i + 1);
        await category.save();
        console.log(`✅ Updated: ${category.name} -> ${category.categoryId}`);
        updated++;
      } else {
        console.log(`⏭️  Skipped: ${category.name} (already has ${category.categoryId})`);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${categories.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Category IDs fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixCategoryIds();
