/**
 * Import script: reads imblasco.csv and populates products, variants, attributes
 * Run: node scripts/import-imblasco.mjs
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const require = createRequire(import.meta.url);

// Load env from file specified by ENV_FILE or default to .env.local
const envFile = process.env.ENV_FILE || '.env.local';
const envContent = readFileSync(envFile, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && !process.env[match[1].trim()]) process.env[match[1].trim()] = match[2].trim();
}

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

let connectionString = process.env.DATABASE_URL;
const needsSsl = connectionString.includes('supabase.com') || connectionString.includes('sslmode=require');
// Remove sslmode from connection string to avoid pg driver conflict, we handle SSL manually
if (needsSsl) {
  connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?$/, '');
}
const adapter = new PrismaPg({
  connectionString,
  max: 5,
  ...(needsSsl && { ssl: { rejectUnauthorized: false } }),
});
const prisma = new PrismaClient({ adapter });

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|tr|td|th|li|ul|ol|table|tbody|thead|em|strong|span|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseImages(imagesStr) {
  if (!imagesStr) return [];
  return imagesStr.split(',').map(u => u.trim()).filter(Boolean);
}

function parseFloat2(val) {
  if (!val) return null;
  const n = parseFloat(String(val).replace(',', '.'));
  return isNaN(n) ? null : n;
}

// Extract the deepest category (last segment of "Parent > Child > Leaf")
function extractCategory(catStr) {
  if (!catStr) return null;
  // Take the first category path listed (comma-separated are multiple categories)
  const paths = catStr.split(',').map(s => s.trim()).filter(Boolean);
  // Prefer the most specific (deepest) path
  let best = paths[0];
  for (const p of paths) {
    if (p.split('>').length > best.split('>').length) best = p;
  }
  // Return leaf name
  const parts = best.split('>');
  return parts[parts.length - 1].trim();
}

async function main() {
  console.log('Reading CSV...');
  const csvContent = readFileSync('src/proveedores/imblasco.csv', 'utf-8');
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  });

  console.log(`Parsed ${rows.length} rows`);

  // Group rows: variable parents with their variation children, and simple products
  const parents = new Map(); // SKU -> row
  const variations = new Map(); // parent SKU -> [variation rows]
  const simples = [];

  for (const row of rows) {
    const tipo = (row['Tipo'] || '').trim();
    const sku = (row['SKU'] || '').trim();
    if (!sku && tipo !== 'variation') continue;

    if (tipo === 'variable') {
      parents.set(sku, row);
      if (!variations.has(sku)) variations.set(sku, []);
    } else if (tipo === 'variation') {
      const parentSku = (row['Superior'] || '').trim();
      if (!parentSku) continue;
      if (!variations.has(parentSku)) variations.set(parentSku, []);
      variations.get(parentSku).push(row);
    } else if (tipo === 'simple') {
      simples.push(row);
    }
  }

  console.log(`Variable products: ${parents.size}`);
  console.log(`Simple products: ${simples.length}`);
  console.log(`Total variations: ${[...variations.values()].reduce((s, v) => s + v.length, 0)}`);

  // Collect all unique leaf categories
  const allCatNames = new Set();
  for (const row of [...parents.values(), ...simples]) {
    const cat = extractCategory(row['Categorías']);
    if (cat) allCatNames.add(cat);
  }

  // Get existing categories from DB
  const existingCats = await prisma.category.findMany();
  const catByName = new Map(existingCats.map(c => [c.name.toLowerCase(), c]));

  // Create missing categories
  for (const name of allCatNames) {
    if (!catByName.has(name.toLowerCase())) {
      const cat = await prisma.category.create({
        data: {
          categoryId: slugify(name),
          name,
          slug: slugify(name),
          isActive: true,
        },
      });
      catByName.set(name.toLowerCase(), cat);
      console.log(`  Created category: ${name}`);
    }
  }

  // Clear existing products (cascade deletes variants, attributes, kit_items)
  console.log('Clearing existing products...');
  await prisma.kitItem.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  let created = 0;
  let variantsCreated = 0;
  const usedSlugs = new Set();

  function uniqueSlug(base) {
    let slug = slugify(base);
    if (!usedSlugs.has(slug)) { usedSlugs.add(slug); return slug; }
    let i = 2;
    while (usedSlugs.has(`${slug}-${i}`)) i++;
    slug = `${slug}-${i}`;
    usedSlugs.add(slug);
    return slug;
  }

  // Import variable products
  console.log('Importing variable products...');
  for (const [sku, row] of parents) {
    const name = (row['Nombre'] || '').trim();
    if (!name) continue;

    const description = stripHtml(row['Descripción corta'] || row['Descripción'] || '');
    const images = parseImages(row['Imágenes']);
    const catName = extractCategory(row['Categorías']);
    const cat = catName ? catByName.get(catName.toLowerCase()) : null;
    const price = parseFloat2(row['Precio normal']);
    const salePrice = parseFloat2(row['Precio rebajado']);
    const weight = parseFloat2(row['Peso (kg)']);
    const length = parseFloat2(row['Longitud (cm)']);
    const width = parseFloat2(row['Anchura (cm)']);
    const height = parseFloat2(row['Altura (cm)']);

    // Parse attributes from parent row
    const attr1Name = (row['Nombre del atributo 1'] || '').trim();
    const attr1Vals = (row['Valor(es) del atributo 1'] || '').split(',').map(s => s.trim()).filter(Boolean);
    const attr2Name = (row['Nombre del atributo 2'] || '').trim();
    const attr2Vals = (row['Valor(es) del atributo 2'] || '').split(',').map(s => s.trim()).filter(Boolean);

    const slug = uniqueSlug(name);

    const product = await prisma.product.create({
      data: {
        productId: sku,
        name,
        slug,
        description,
        categoryId: cat?.id || null,
        price,
        salePrice,
        currency: 'CLP',
        images: images.length > 0 ? images : ['/placeholder-product.jpg'],
        proveedor: 'imblasco',
        featured: row['¿Está destacado?'] === '1',
        isActive: row['Publicado'] === '1',
        weight,
        length,
        width,
        height,
      },
    });

    // Create attributes
    const attrsToCreate = [];
    if (attr1Name && attr1Vals.length > 0) {
      attrsToCreate.push({ productId: product.id, name: attr1Name, values: attr1Vals, sortOrder: 0 });
    }
    if (attr2Name && attr2Vals.length > 0) {
      attrsToCreate.push({ productId: product.id, name: attr2Name, values: attr2Vals, sortOrder: 1 });
    }
    if (attrsToCreate.length > 0) {
      await prisma.productAttribute.createMany({ data: attrsToCreate });
    }

    // Create variants from variation rows
    const varRows = variations.get(sku) || [];
    for (let i = 0; i < varRows.length; i++) {
      const vRow = varRows[i];
      const vSku = (vRow['SKU'] || '').trim();
      if (!vSku) continue;

      const vAttr = {};
      const va1Name = (vRow['Nombre del atributo 1'] || '').trim();
      const va1Val = (vRow['Valor(es) del atributo 1'] || '').trim();
      const va2Name = (vRow['Nombre del atributo 2'] || '').trim();
      const va2Val = (vRow['Valor(es) del atributo 2'] || '').trim();
      if (va1Name && va1Val) vAttr[va1Name] = va1Val;
      if (va2Name && va2Val) vAttr[va2Name] = va2Val;

      const vImages = parseImages(vRow['Imágenes']);
      const vPrice = parseFloat2(vRow['Precio normal']);
      const vSalePrice = parseFloat2(vRow['Precio rebajado']);

      try {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: vSku,
            attributes: vAttr,
            image: vImages[0] || null,
            price: vPrice,
            salePrice: vSalePrice,
            isActive: true,
            sortOrder: i,
          },
        });
        variantsCreated++;
      } catch (e) {
        // Skip duplicate SKU
        if (e.code === 'P2002') {
          console.log(`  Skipping duplicate variant SKU: ${vSku}`);
        } else {
          throw e;
        }
      }
    }

    created++;
  }

  // Import simple products
  console.log('Importing simple products...');
  for (const row of simples) {
    const sku = (row['SKU'] || '').trim();
    const name = (row['Nombre'] || '').trim();
    if (!name || !sku) continue;

    const description = stripHtml(row['Descripción corta'] || row['Descripción'] || '');
    const images = parseImages(row['Imágenes']);
    const catName = extractCategory(row['Categorías']);
    const cat = catName ? catByName.get(catName.toLowerCase()) : null;
    const price = parseFloat2(row['Precio normal']);
    const salePrice = parseFloat2(row['Precio rebajado']);
    const weight = parseFloat2(row['Peso (kg)']);
    const length = parseFloat2(row['Longitud (cm)']);
    const width = parseFloat2(row['Anchura (cm)']);
    const height = parseFloat2(row['Altura (cm)']);

    const slug = uniqueSlug(name);

    try {
      await prisma.product.create({
        data: {
          productId: sku,
          name,
          slug,
          description,
          categoryId: cat?.id || null,
          price,
          salePrice,
          currency: 'CLP',
          images: images.length > 0 ? images : ['/placeholder-product.jpg'],
          proveedor: 'imblasco',
          featured: row['¿Está destacado?'] === '1',
          isActive: row['Publicado'] === '1',
          weight,
          length,
          width,
          height,
        },
      });
      created++;
    } catch (e) {
      if (e.code === 'P2002') {
        console.log(`  Skipping duplicate product: ${sku} - ${name}`);
      } else {
        throw e;
      }
    }
  }

  // Update category product counts
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    const count = await prisma.product.count({ where: { categoryId: cat.id, isActive: true } });
    await prisma.category.update({ where: { id: cat.id }, data: { productCount: count } });
  }

  console.log(`\nDone!`);
  console.log(`  Products created: ${created}`);
  console.log(`  Variants created: ${variantsCreated}`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
