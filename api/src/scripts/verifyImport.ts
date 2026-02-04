import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

async function verify() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count products and categories
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const productsWithCategory = await Product.countDocuments({ category: { $ne: null } });
    const totalCategories = await Category.countDocuments();

    console.log('📊 Database Summary:');
    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Active products: ${activeProducts}`);
    console.log(`   Products with category: ${productsWithCategory} (${((productsWithCategory/totalProducts)*100).toFixed(1)}%)`);
    console.log(`   Total categories: ${totalCategories}\n`);

    // Show top 5 categories by product count
    const topCategories = await Category.find()
      .sort({ productCount: -1 })
      .limit(5)
      .select('name productCount');

    console.log('🏆 Top 5 Categories by Product Count:');
    topCategories.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat.name}: ${cat.productCount} products`);
    });

    // Show 5 sample products
    const sampleProducts = await Product.find()
      .populate('category', 'name')
      .limit(5)
      .select('productId name category quantity isActive');

    console.log('\n📦 Sample Products:');
    sampleProducts.forEach((prod, idx) => {
      const categoryName = (prod.category as any)?.name || 'Sin categoría';
      console.log(`   ${idx + 1}. [${prod.productId}] ${prod.name}`);
      console.log(`      Category: ${categoryName} | Stock: ${prod.quantity} | Active: ${prod.isActive}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Verification completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verify();
