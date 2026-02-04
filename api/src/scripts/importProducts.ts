import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProductRow {
  ID: string;
  Tipo: string;
  SKU: string;
  GTIN: string;
  Nombre: string;
  Publicado: string;
  Destacado: string;
  Visibilidad: string;
  DescripcionCorta: string;
  Descripcion: string;
  Inventario: string;
  PrecioRebajado: string;
  PrecioNormal: string;
  Peso: string;
  Longitud: string;
  Anchura: string;
  Altura: string;
  Categorias: string;
  Imagenes: string;
  Color: string;
}

// Parse CSV with proper handling of quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

function parseCSV(csvContent: string): ProductRow[] {
  // Remove BOM if present
  csvContent = csvContent.replace(/^\uFEFF/, '');

  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);

  console.log(`📋 CSV Headers (${headers.length} columns):`, headers.slice(0, 10).join(', '), '...');

  const products: ProductRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length < 5 || !values[4]?.trim()) {
      continue; // Skip invalid rows
    }

    const row: ProductRow = {
      ID: values[0]?.trim() || '',
      Tipo: values[1]?.trim() || '',
      SKU: values[2]?.trim() || '',
      GTIN: values[3]?.trim() || '',
      Nombre: values[4]?.trim() || '',
      Publicado: values[5]?.trim() || '',
      Destacado: values[6]?.trim() || '',
      Visibilidad: values[7]?.trim() || '',
      DescripcionCorta: values[8]?.trim() || '',
      Descripcion: values[9]?.trim() || '',
      Inventario: values[15]?.trim() || '0',
      PrecioRebajado: values[25]?.trim() || '',
      PrecioNormal: values[26]?.trim() || '',
      Peso: values[19]?.trim() || '',
      Longitud: values[20]?.trim() || '',
      Anchura: values[21]?.trim() || '',
      Altura: values[22]?.trim() || '',
      Categorias: values[27]?.trim() || '',
      Imagenes: values[30]?.trim() || '',
      Color: values[43]?.trim() || '',
    };

    // Only add simple products or main variable products (not variations)
    if (row.Tipo === 'simple' || (row.Tipo === 'variable' && row.Nombre)) {
      products.push(row);
    }
  }

  return products;
}

function cleanHTML(html: string): string {
  if (!html) return '';

  // Remove HTML tags but keep the text content
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove style tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractMainCategory(categorias: string): string {
  if (!categorias) return '';

  // Categories are in format "Parent > Child > Subchild"
  // We want to use the most specific (last) category
  const parts = categorias.split('>').map(p => p.trim());
  return parts[parts.length - 1] || parts[0] || '';
}

function getFirstImage(imagenes: string): string {
  if (!imagenes) return '/placeholder-product.jpg';

  // Images are comma-separated URLs
  const urls = imagenes.split(',').map(u => u.trim());
  return urls[0] || '/placeholder-product.jpg';
}

async function importProducts() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read CSV file
    const csvPath = path.join(__dirname, '../import/base_de_datos.csv');
    console.log(`📂 Reading CSV from: ${csvPath}`);

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);

    console.log(`📄 Found ${rows.length} products in CSV\n`);

    // Get all categories from database
    const categories = await Category.find();
    const categoryMap = new Map<string, mongoose.Types.ObjectId>();

    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat._id as mongoose.Types.ObjectId);
    });

    console.log(`📦 Found ${categories.length} categories in database`);

    // Clear existing products
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`🗑️  Clearing ${existingCount} existing products...`);
      await Product.deleteMany({});
    }

    // Import products
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    console.log(`\n📦 Importing products...\n`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Skip if no name or SKU
        if (!row.Nombre || !row.SKU) {
          skipped++;
          continue;
        }

        // Find category
        const categoryName = extractMainCategory(row.Categorias);
        let categoryId: mongoose.Types.ObjectId | undefined;

        if (categoryName) {
          // Try exact match first
          categoryId = categoryMap.get(categoryName.toLowerCase());

          // If not found, try partial match
          if (!categoryId) {
            for (const [name, id] of categoryMap.entries()) {
              if (name.includes(categoryName.toLowerCase()) || categoryName.toLowerCase().includes(name)) {
                categoryId = id;
                break;
              }
            }
          }
        }

        // Parse prices (remove commas and convert to number)
        const parsePrice = (priceStr: string): number | undefined => {
          if (!priceStr) return undefined;
          const cleaned = priceStr.replace(/,/g, '').trim();
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
        };

        const price = parsePrice(row.PrecioNormal);
        const salePrice = parsePrice(row.PrecioRebajado);

        // Prepare product data
        const productData: any = {
          productId: row.SKU || `PROD-${String(i + 1).padStart(4, '0')}`,
          name: row.Nombre,
          slug: generateSlug(row.Nombre),
          description: cleanHTML(row.DescripcionCorta || row.Descripcion),
          category: categoryId,
          quantity: parseInt(row.Inventario) || 0,
          image: getFirstImage(row.Imagenes),
          featured: row.Destacado === '1',
          isActive: row.Publicado === '1',
          currency: 'CLP',
        };

        // Add prices if they exist
        if (price) productData.price = price;
        if (salePrice) productData.salePrice = salePrice;

        // Create product
        await Product.create(productData);
        imported++;

        // Progress indicator
        if ((imported) % 100 === 0) {
          console.log(`   ✅ Imported ${imported}/${rows.length} products...`);
        }
      } catch (error: any) {
        errors++;
        if (errors <= 5) {
          console.error(`   ❌ Error importing "${row.Nombre}":`, error.message);
        }
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successfully imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    // Update product counts in categories
    console.log('\n📊 Updating category product counts...');
    for (const category of categories) {
      const count = await Product.countDocuments({
        category: category._id,
        isActive: true
      });
      await Category.findByIdAndUpdate(category._id, { productCount: count });
    }
    console.log('✅ Category product counts updated');

    // Show some statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const featuredProducts = await Product.countDocuments({ featured: true });
    const productsWithCategory = await Product.countDocuments({ category: { $ne: null } });

    console.log(`\n📈 Database Statistics:`);
    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Active products: ${activeProducts}`);
    console.log(`   Featured products: ${featuredProducts}`);
    console.log(`   Products with category: ${productsWithCategory}`);
    console.log(`   Products without category: ${totalProducts - productsWithCategory}`);

    await mongoose.disconnect();
    console.log('\n✅ Products import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importProducts();
