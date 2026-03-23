// Disable SSL cert validation for Supabase pooler
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/suvenirs';
const SUPABASE_URL =
  process.env.SUPABASE_DATABASE_URL ||
  'postgresql://postgres.vdxzhvkwmxybskvywwdt:chichero18601128@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require';

const PROVEEDOR = 'promoimport';

// ─── Helpers ───

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function readExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];

  const products = [];
  const headers = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => headers.push(cell.value));
      return;
    }

    const values = {};
    row.eachCell((cell, colNumber) => {
      values[headers[colNumber - 1]] = cell.value;
    });

    products.push({
      id: String(values['ID'] || ''),
      sku: String(values['SKU'] || ''),
      nombre: String(values['Nombre'] || ''),
      categorias: String(values['Categorías'] || ''),
      imagen_url: String(values['Imagen URL'] || ''),
      proveedor: String(values['Proveedor'] || PROVEEDOR),
    });
  });

  return products;
}

// ─── MongoDB Import ───

async function importToMongoDB(products) {
  console.log('\n═══ MONGODB (Local) ═══');
  console.log(`🔗 Conectando a ${MONGODB_URI}...`);

  await mongoose.connect(MONGODB_URI);
  console.log('   Conectado.\n');

  const db = mongoose.connection.db;
  const productsCol = db.collection('products');
  const categoriesCol = db.collection('categories');

  // Get existing category map (name -> _id)
  const existingCategories = await categoriesCol.find({}).toArray();
  const categoryMap = new Map();
  for (const cat of existingCategories) {
    categoryMap.set(cat.name.toLowerCase(), cat._id);
    if (cat.slug) categoryMap.set(cat.slug.toLowerCase(), cat._id);
  }

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of products) {
    const slug = generateSlug(p.nombre);
    const productId = `PI-${p.sku || p.id}`;

    // Check if already exists
    const exists = await productsCol.findOne({
      $or: [{ productId }, { slug }],
    });

    if (exists) {
      skipped++;
      continue;
    }

    // Try to match category
    let categoryId = null;
    if (p.categorias) {
      const catKey = p.categorias.toLowerCase();
      categoryId = categoryMap.get(catKey) || null;
    }

    try {
      await productsCol.insertOne({
        productId,
        name: p.nombre,
        slug,
        description: `${p.nombre} - Producto de ${PROVEEDOR}`,
        category: categoryId,
        quantity: 0,
        price: null,
        salePrice: null,
        currency: 'CLP',
        image: p.imagen_url || '/placeholder-product.jpg',
        proveedor: PROVEEDOR,
        featured: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      imported++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`   Error con "${p.nombre}": ${err.message}`);
    }
  }

  // Update existing products without proveedor to "imblasco"
  const resultImblasco = await productsCol.updateMany(
    { $or: [{ proveedor: { $exists: false } }, { proveedor: '' }] },
    { $set: { proveedor: 'imblasco' } }
  );

  console.log(`✅ Importados: ${imported}`);
  console.log(`⏭️  Duplicados (omitidos): ${skipped}`);
  if (errors > 0) console.log(`❌ Errores: ${errors}`);
  console.log(`🏷️  ${resultImblasco.modifiedCount} productos existentes marcados como "imblasco"`);

  // Summary
  const byProveedor = await productsCol
    .aggregate([{ $group: { _id: '$proveedor', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    .toArray();
  console.log('\n📈 Resumen MongoDB por proveedor:');
  for (const p of byProveedor) {
    console.log(`   ${p._id || '(vacío)'}: ${p.count}`);
  }

  await mongoose.disconnect();
}

// ─── Supabase PostgreSQL Import ───

async function importToSupabase(products) {
  console.log('\n═══ SUPABASE (PostgreSQL) ═══');
  console.log('🔗 Conectando a Supabase...');

  const client = new pg.Client({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('   Conectado.\n');

  // Get existing categories
  const catResult = await client.query('SELECT id, name, slug FROM categories');
  const categoryMap = new Map();
  for (const cat of catResult.rows) {
    categoryMap.set(cat.name.toLowerCase(), cat.id);
    if (cat.slug) categoryMap.set(cat.slug.toLowerCase(), cat.id);
  }

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of products) {
    const slug = generateSlug(p.nombre);
    const productId = `PI-${p.sku || p.id}`;

    // Check if exists
    const existing = await client.query('SELECT id FROM products WHERE "productId" = $1 OR slug = $2', [
      productId,
      slug,
    ]);

    if (existing.rows.length > 0) {
      skipped++;
      continue;
    }

    // Match category
    let categoryId = null;
    if (p.categorias) {
      const catKey = p.categorias.toLowerCase();
      categoryId = categoryMap.get(catKey) || null;
    }

    try {
      await client.query(
        `INSERT INTO products ("id", "productId", "name", "slug", "description", "categoryId", "quantity", "price", "salePrice", "currency", "image", "proveedor", "featured", "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [
          productId,
          p.nombre,
          slug,
          `${p.nombre} - Producto de ${PROVEEDOR}`,
          categoryId,
          0,
          null,
          null,
          'CLP',
          p.imagen_url || '/placeholder-product.jpg',
          PROVEEDOR,
          false,
          true,
        ]
      );
      imported++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`   Error con "${p.nombre}": ${err.message}`);
    }
  }

  // Update existing products without proveedor to "imblasco"
  const resultImblasco = await client.query(
    `UPDATE products SET proveedor = 'imblasco' WHERE proveedor IS NULL OR proveedor = ''`
  );

  console.log(`✅ Importados: ${imported}`);
  console.log(`⏭️  Duplicados (omitidos): ${skipped}`);
  if (errors > 0) console.log(`❌ Errores: ${errors}`);
  console.log(`🏷️  ${resultImblasco.rowCount} productos existentes marcados como "imblasco"`);

  // Summary
  const summary = await client.query(
    `SELECT proveedor, COUNT(*) as count FROM products GROUP BY proveedor ORDER BY count DESC`
  );
  console.log('\n📈 Resumen Supabase por proveedor:');
  for (const row of summary.rows) {
    console.log(`   ${row.proveedor || '(vacío)'}: ${row.count}`);
  }

  await client.end();
}

// ─── Main ───

async function main() {
  const excelPath = path.join(__dirname, '..', '..', 'promoimport_catalogo.xlsx');
  console.log('📂 Leyendo Excel:', excelPath);

  const products = await readExcel(excelPath);
  console.log(`📦 ${products.length} productos leídos del Excel\n`);

  if (products.length === 0) {
    console.log('❌ No hay productos para importar.');
    return;
  }

  // Show sample
  console.log('Muestra:');
  console.log(`   ${products[0].sku} - ${products[0].nombre} (${products[0].categorias})`);
  console.log(`   ${products[1].sku} - ${products[1].nombre} (${products[1].categorias})`);

  // Import to both databases
  try {
    await importToMongoDB(products);
  } catch (err) {
    console.error('❌ Error MongoDB:', err.message);
    console.log('   (¿Está Docker corriendo? docker start suvenirscl)\n');
  }

  try {
    await importToSupabase(products);
  } catch (err) {
    console.error('❌ Error Supabase:', err.message);
  }

  console.log('\n🎉 Importación completada.');
}

main().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
