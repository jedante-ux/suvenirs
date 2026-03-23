import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/suvenirs';

async function main() {
  console.log('🔗 Conectando a MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('   Conectado.\n');

  const db = mongoose.connection.db;
  const products = db.collection('products');

  // Contar productos actuales
  const total = await products.countDocuments();
  console.log(`📦 Productos totales en la DB: ${total}`);

  // Actualizar todos los productos existentes (sin proveedor o proveedor vacío) a "imblasco"
  const resultImblasco = await products.updateMany(
    { $or: [{ proveedor: { $exists: false } }, { proveedor: '' }] },
    { $set: { proveedor: 'imblasco' } }
  );
  console.log(`✅ ${resultImblasco.modifiedCount} productos actualizados a proveedor "imblasco"`);

  // Resumen
  const byProveedor = await products.aggregate([
    { $group: { _id: '$proveedor', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();

  console.log('\n📈 Resumen por proveedor:');
  for (const p of byProveedor) {
    console.log(`   ${p._id || '(vacío)'}: ${p.count} productos`);
  }

  await mongoose.disconnect();
  console.log('\n🔌 Desconectado.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
