import { MongoClient } from 'mongodb';

async function check() {
  const client = new MongoClient('mongodb://mongo:27017');

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('suvenirs');
    const products = await db.collection('products').find().limit(3).toArray();

    console.log('\n📦 Products in database:\n');
    products.forEach((p: any) => {
      console.log(`   ${p.productId}: ${p.name}`);
      console.log(`      category field: ${p.category}`);
      console.log(`      category type: ${typeof p.category}`);
      console.log(`      All keys: ${Object.keys(p).join(', ')}`);
      console.log('');
    });

    await client.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

check();
