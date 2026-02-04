import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CategoryRow {
  nivel: number;
  categoria: string;
  categoria_padre: string;
}

function parseCSV(csvContent: string): CategoryRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      nivel: parseInt(values[0]),
      categoria: values[1]?.trim() || '',
      categoria_padre: values[2]?.trim() || '',
    };
  }).filter(row => row.categoria); // Filter out empty rows
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function capitalizeName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateCategoryId(index: number): string {
  return `CAT-${String(index).padStart(3, '0')}`;
}

async function importCategories() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    // Read CSV file
    const csvPath = path.join(__dirname, '../data/categories.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);

    console.log(`📄 Found ${rows.length} categories in CSV`);

    // Map to store category name -> ObjectId
    const categoryMap = new Map<string, mongoose.Types.ObjectId>();

    // Counter for generating category IDs
    let categoryIdCounter = 1;

    // Process categories by level (0, 1, 2) to ensure parents exist first
    for (let nivel = 0; nivel <= 2; nivel++) {
      const categoriesAtLevel = rows.filter(row => row.nivel === nivel);

      console.log(`\n📊 Processing Level ${nivel} (${categoriesAtLevel.length} categories):`);

      for (const row of categoriesAtLevel) {
        try {
          const capitalizedName = capitalizeName(row.categoria);
          const categoryData: any = {
            categoryId: generateCategoryId(categoryIdCounter++),
            name: capitalizedName,
            slug: generateSlug(row.categoria),
            description: `Categoría de ${capitalizedName}`,
            order: 0,
            isActive: true,
            productCount: 0,
          };

          // If has parent, find parent ObjectId
          if (row.categoria_padre) {
            const parentId = categoryMap.get(row.categoria_padre);
            if (parentId) {
              categoryData.parent = parentId;
            } else {
              console.warn(`   ⚠️  Parent "${row.categoria_padre}" not found for "${row.categoria}"`);
            }
          }

          // Create category
          const category = await Category.create(categoryData);
          categoryMap.set(row.categoria, category._id as mongoose.Types.ObjectId);

          const parentLabel = row.categoria_padre ? ` (parent: ${row.categoria_padre})` : '';
          console.log(`   ✅ [${row.categoria}]${parentLabel}`);
        } catch (error: any) {
          console.error(`   ❌ Error creating "${row.categoria}":`, error.message);
        }
      }
    }

    // Count results
    const totalCategories = await Category.countDocuments();
    const level0Count = await Category.countDocuments({ parent: null });
    const level1Count = await Category.countDocuments({ parent: { $ne: null } });

    console.log(`\n📊 Import Summary:`);
    console.log(`   Total categories: ${totalCategories}`);
    console.log(`   Level 0 (root): ${level0Count}`);
    console.log(`   Level 1+ (children): ${level1Count}`);

    await mongoose.disconnect();
    console.log('\n✅ Categories import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importCategories();
