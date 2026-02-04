import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

async function checkProducts() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const totalProducts = await Product.countDocuments();
    console.log(`\n📦 Total products in database: ${totalProducts}`);

    const activeProducts = await Product.countDocuments({ isActive: true });
    console.log(`✅ Active products: ${activeProducts}`);

    const productsWithCategory = await Product.countDocuments({ category: { $ne: null } });
    console.log(`🏷️  Products with category: ${productsWithCategory}`);

    console.log('\n📋 Sample products (with populated category):');
    const products = await Product.find()
      .populate('category', 'name slug')
      .limit(5)
      .lean();

    products.forEach(p => {
      console.log(`\n   ${p.productId}: ${p.name}`);
      console.log(`      Raw category value:`, p.category);
      console.log(`      Category name: ${p.category ? (p.category as any).name : 'Sin categoría'}`);
      console.log(`      Active: ${p.isActive}`);
      console.log(`      Stock: ${p.quantity}`);
    });

    console.log('\n📋 Sample products (without populate):');
    const rawProducts = await Product.find()
      .limit(3)
      .lean();

    rawProducts.forEach(p => {
      console.log(`\n   ${p.productId}: ${p.name}`);
      console.log(`      Category ID:`, p.category);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProducts();
