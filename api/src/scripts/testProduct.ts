import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

async function testProduct() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a category
    const category = await Category.findOne();
    console.log(`📦 Found category: ${category?.name} (${category?._id})`);
    console.log(`   Type of _id: ${typeof category?._id}`);
    console.log(`   Is ObjectId: ${category?._id instanceof mongoose.Types.ObjectId}`);

    if (!category) {
      console.log('❌ No category found');
      process.exit(1);
    }

    // Delete test product if exists
    await Product.deleteOne({ productId: 'PROD-TEST' });

    // Create a test product
    const product = await Product.create({
      productId: 'PROD-TEST',
      name: 'Test Product',
      slug: 'test-product',
      description: 'This is a test product',
      category: category._id,
      quantity: 10,
      image: 'https://example.com/image.jpg',
      featured: false,
      isActive: true,
    });

    console.log(`\n✅ Product created: ${product.productId}`);
    console.log(`   Category: ${product.category}`);
    console.log(`   Category type: ${typeof product.category}`);

    // Fetch it back
    const fetched = await Product.findOne({ productId: 'PROD-TEST' }).lean();
    console.log(`\n📦 Fetched product:`);
    console.log(`   Category: ${fetched?.category}`);
    console.log(`   Category type: ${typeof fetched?.category}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testProduct();
