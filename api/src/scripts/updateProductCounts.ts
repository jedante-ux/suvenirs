import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

async function updateProductCounts() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all categories
    const categories = await Category.find();
    console.log(`📁 Found ${categories.length} categories`);

    // Update product count for each category
    console.log('\n🔄 Updating product counts...');
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category._id });
      await Category.findByIdAndUpdate(category._id, { productCount: count });
      
      if (count > 0) {
        console.log(`  ✅ ${category.categoryId} - ${category.name}: ${count} products`);
      }
    }

    // Check products without category
    const productsWithoutCategory = await Product.countDocuments({ category: null });
    console.log(`\n⚠️  Products without category: ${productsWithoutCategory}`);

    if (productsWithoutCategory > 0) {
      console.log('\n🔄 Assigning random categories to products without category...');
      
      // Get parent categories only
      const parentCategories = await Category.find({ parent: null });
      const products = await Product.find({ category: null });

      for (const product of products) {
        // Assign random parent category
        const randomCategory = parentCategories[Math.floor(Math.random() * parentCategories.length)];
        await Product.findByIdAndUpdate(product._id, { category: randomCategory._id });
        console.log(`  ✅ ${product.productId} -> ${randomCategory.name}`);
      }

      // Recalculate counts after assignment
      console.log('\n🔄 Recalculating product counts...');
      for (const category of categories) {
        const count = await Product.countDocuments({ category: category._id });
        await Category.findByIdAndUpdate(category._id, { productCount: count });
      }
    }

    console.log('\n✅ Product counts updated successfully');
    
    // Show final summary
    const categoriesWithProducts = await Category.find({ productCount: { $gt: 0 } }).sort({ productCount: -1 }).limit(10);
    console.log('\n📊 Top 10 categories by product count:');
    categoriesWithProducts.forEach(cat => {
      console.log(`  ${cat.categoryId} - ${cat.name}: ${cat.productCount} products`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateProductCounts();
