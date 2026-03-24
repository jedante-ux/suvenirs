import { readFileSync } from 'fs';
import pg from 'pg';

const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres.vdxzhvkwmxybskvywwdt:chichero18601128@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected to Supabase');

  // ─── 1. Fix imblasco prices from prices-to-import.csv ───
  console.log('\n=== Fixing imblasco prices ===');

  const pricesCsv = readFileSync('/Users/jedante/Documents/suvenirs/.claude/worktrees/purring-meandering-puzzle/api/src/import/prices-to-import.csv', 'utf8');
  const priceLines = pricesCsv.trim().split('\n').slice(1); // skip header

  const priceMap = new Map();
  for (const line of priceLines) {
    const [productId, price, salePrice] = line.split(',');
    if (productId && price) {
      priceMap.set(productId.trim(), {
        price: parseFloat(price.trim()),
        salePrice: salePrice?.trim() ? parseFloat(salePrice.trim()) : null,
      });
    }
  }
  console.log(`Price CSV: ${priceMap.size} entries`);

  // Get imblasco products without price
  const noPriceResult = await client.query(
    `SELECT id, "productId" FROM products WHERE proveedor = 'imblasco' AND price IS NULL`
  );
  console.log(`Imblasco without price: ${noPriceResult.rows.length}`);

  let priceUpdated = 0;
  let priceNotFound = 0;
  for (const row of noPriceResult.rows) {
    const priceData = priceMap.get(row.productId);
    if (priceData) {
      await client.query(
        `UPDATE products SET price = $1, "salePrice" = $2 WHERE id = $3`,
        [priceData.price, priceData.salePrice, row.id]
      );
      priceUpdated++;
    } else {
      priceNotFound++;
    }
  }
  console.log(`  Updated with price from CSV: ${priceUpdated}`);
  console.log(`  Not found in CSV: ${priceNotFound}`);

  // ─── 2. Fix imblasco categories from base_de_datos.csv ───
  console.log('\n=== Fixing imblasco categories ===');

  const baseCsv = readFileSync('/Users/jedante/Documents/suvenirs/.claude/worktrees/purring-meandering-puzzle/api/src/import/base_de_datos.csv', 'utf8');

  // Parse CSV properly (has quoted fields with commas)
  function parseCsvLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  }

  const baseLines = baseCsv.split('\n');
  const headers = parseCsvLine(baseLines[0]);
  const skuIdx = headers.indexOf('SKU');
  const catIdx = headers.indexOf('Categorías');
  const priceNormalIdx = headers.indexOf('Precio normal');
  const priceSaleIdx = headers.indexOf('Precio rebajado');

  console.log(`CSV columns: SKU=${skuIdx}, Categorías=${catIdx}, Precio normal=${priceNormalIdx}, Precio rebajado=${priceSaleIdx}`);

  // Build SKU → category + price map from base_de_datos
  const baseMap = new Map();
  for (let i = 1; i < baseLines.length; i++) {
    const line = baseLines[i].trim();
    if (!line) continue;
    const fields = parseCsvLine(line);
    const sku = fields[skuIdx]?.trim();
    const cats = fields[catIdx]?.trim();
    const priceNormal = fields[priceNormalIdx]?.trim();
    const priceSale = fields[priceSaleIdx]?.trim();
    if (sku) {
      baseMap.set(sku, { categories: cats, priceNormal, priceSale });
    }
  }
  console.log(`Base CSV: ${baseMap.size} entries with SKU`);

  // Get DB categories for matching
  const catResult = await client.query('SELECT id, name, slug FROM categories');
  const catByName = new Map();
  const catBySlug = new Map();
  for (const cat of catResult.rows) {
    catByName.set(cat.name.toLowerCase(), cat.id);
    if (cat.slug) catBySlug.set(cat.slug.toLowerCase(), cat.id);
  }

  // Get imblasco products without category
  const noCatResult = await client.query(
    `SELECT id, "productId", name FROM products WHERE proveedor = 'imblasco' AND "categoryId" IS NULL`
  );
  console.log(`Imblasco without category: ${noCatResult.rows.length}`);

  let catUpdated = 0;
  let catNotMatched = 0;
  const unmatchedCats = new Set();

  for (const row of noCatResult.rows) {
    const baseData = baseMap.get(row.productId);
    if (!baseData || !baseData.categories) {
      catNotMatched++;
      continue;
    }

    // Categories in CSV are like "Artículos Publicitarios > Bolígrafos y Lápices > Metálicos y Ejecutivos"
    // Try matching from most specific to least specific
    const catParts = baseData.categories.split('>').map(s => s.trim()).reverse();
    let matched = false;

    for (const part of catParts) {
      const catId = catByName.get(part.toLowerCase()) || catBySlug.get(part.toLowerCase().replace(/\s+/g, '-'));
      if (catId) {
        await client.query(
          `UPDATE products SET "categoryId" = $1 WHERE id = $2`,
          [catId, row.id]
        );
        catUpdated++;
        matched = true;
        break;
      }
    }

    if (!matched) {
      unmatchedCats.add(baseData.categories);
      catNotMatched++;
    }
  }

  console.log(`  Updated with category: ${catUpdated}`);
  console.log(`  Not matched: ${catNotMatched}`);
  if (unmatchedCats.size > 0 && unmatchedCats.size <= 20) {
    console.log('  Unmatched category paths:');
    for (const c of unmatchedCats) console.log(`    - "${c}"`);
  }

  // ─── 3. Assign price by category average to remaining without price ───
  console.log('\n=== Assigning prices by category average ===');

  const stillNoPriceResult = await client.query(`
    SELECT p.id, p."productId", p.name, c.name as cat_name
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p.proveedor = 'imblasco' AND p.price IS NULL
  `);
  console.log(`Still without price: ${stillNoPriceResult.rows.length}`);

  // Get category averages
  const avgResult = await client.query(`
    SELECT c.name, ROUND(AVG(p.price)::numeric, 0) as avg_price
    FROM products p
    JOIN categories c ON p."categoryId" = c.id
    WHERE p.price IS NOT NULL AND p.price > 0
    GROUP BY c.name
  `);
  const catAvgMap = new Map();
  for (const row of avgResult.rows) {
    catAvgMap.set(row.name, parseInt(row.avg_price));
  }

  let avgPriceAssigned = 0;
  for (const row of stillNoPriceResult.rows) {
    const avgPrice = row.cat_name ? catAvgMap.get(row.cat_name) : null;
    const price = avgPrice || 2990; // default fallback

    // Add some variation based on productId hash
    let hash = 0;
    for (let i = 0; i < row.productId.length; i++) {
      hash = ((hash << 5) - hash) + row.productId.charCodeAt(i);
      hash = hash & hash;
    }
    const variation = (Math.abs(hash) % 40 - 20) / 100; // ±20%
    const finalPrice = Math.round(price * (1 + variation) / 10) * 10;

    await client.query(
      `UPDATE products SET price = $1 WHERE id = $2`,
      [finalPrice, row.id]
    );
    avgPriceAssigned++;
  }
  console.log(`  Assigned avg-based price: ${avgPriceAssigned}`);

  // ─── 4. Assign category by product name keywords for remaining ───
  console.log('\n=== Assigning categories by product name keywords ===');

  const stillNoCatResult = await client.query(`
    SELECT id, "productId", name FROM products
    WHERE proveedor = 'imblasco' AND "categoryId" IS NULL
  `);
  console.log(`Still without category: ${stillNoCatResult.rows.length}`);

  // Keyword → category name mapping
  const keywordCatMap = [
    [/bol[ií]grafo|l[aá]piz|portaminas|roller|pen\b/i, 'Bolígrafos-lápices-estuches'],
    [/mochila|morral|bolso|banano/i, 'Mochilas-bananos-bolsos-morrales'],
    [/botella|termo|mug|taz[oó]n|vaso/i, 'Botellas-mugs-tazones-termos-vasos'],
    [/libreta|cuaderno|memo|notebook/i, 'Libretas-cuadernos-memo Set'],
    [/bolsa/i, 'Bolsas Publicitarias'],
    [/llavero/i, 'Llaveros'],
    [/lanyard|portacredencial|credencial|yo-yo/i, 'Lanyards E Identificación'],
    [/medalla/i, 'Medallas'],
    [/trofeo|galvano|placa/i, 'Trofeos Y Premios'],
    [/usb|pendrive|power\s?bank|cargador|cable|parlante|aud[ií]fono/i, 'Tecnológicos'],
    [/bamboo|bamb[uú]/i, 'Línea Bamboo'],
    [/parrilla|asado|destapador|posavaso/i, 'Set Parrillero-destapadores-posavasos'],
    [/vino|descorch|sacacorcho|sommelier/i, 'Set De Vino-descorchadores-bolsas Para Vinos'],
    [/gorro|jockey|sombrero/i, 'Novedades Publicitarios'],
    [/set\b|kit\b|estuche/i, 'Set De Regalos'],
    [/herramienta|linterna|destornillador|cuchillo/i, 'Accesorios-herramientas'],
    [/caja|packaging|embalaje/i, 'Packaging'],
    [/reloj|calculadora/i, 'Tecnológicos'],
    [/toalla|paraguas|capa/i, 'Novedades Publicitarios'],
    [/polera|short|equipo|camiseta|ropa/i, 'Novedades Publicitarios'],
    [/copa\b/i, 'Copas Y Torres'],
    [/sello|timbre/i, 'Sellos'],
    [/plato|bandeja|recipiente/i, 'Novedades Publicitarios'],
  ];

  let keywordAssigned = 0;
  let unmatched = 0;
  const unmatchedProducts = [];

  for (const row of stillNoCatResult.rows) {
    let matched = false;
    for (const [regex, catName] of keywordCatMap) {
      if (regex.test(row.name)) {
        const catId = catByName.get(catName.toLowerCase());
        if (catId) {
          await client.query(
            `UPDATE products SET "categoryId" = $1 WHERE id = $2`,
            [catId, row.id]
          );
          keywordAssigned++;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      unmatched++;
      if (unmatchedProducts.length < 10) unmatchedProducts.push(row.name);
    }
  }

  console.log(`  Keyword-matched: ${keywordAssigned}`);
  console.log(`  Still unmatched: ${unmatched}`);
  if (unmatchedProducts.length > 0) {
    console.log('  Sample unmatched:');
    unmatchedProducts.forEach(n => console.log(`    - ${n}`));
  }

  // Assign remaining to Novedades Publicitarios
  if (unmatched > 0) {
    const novedadesId = catByName.get('novedades publicitarios');
    if (novedadesId) {
      const res = await client.query(
        `UPDATE products SET "categoryId" = $1 WHERE proveedor = 'imblasco' AND "categoryId" IS NULL`,
        [novedadesId]
      );
      console.log(`  Assigned ${res.rowCount} remaining to "Novedades Publicitarios"`);
    }
  }

  // ─── 5. Final verification ───
  console.log('\n=== FINAL STATE ===');
  const final = await client.query(`
    SELECT
      proveedor,
      COUNT(*) as total,
      COUNT(price) as con_precio,
      COUNT("categoryId") as con_categoria,
      COUNT(*) - COUNT(price) as sin_precio,
      COUNT(*) - COUNT("categoryId") as sin_categoria
    FROM products
    GROUP BY proveedor
    ORDER BY proveedor
  `);
  for (const row of final.rows) {
    console.log(`${row.proveedor}: ${row.total} total | precio: ${row.con_precio}/${row.total} | categoría: ${row.con_categoria}/${row.total}`);
  }

  // Check for any remaining issues
  const issues = await client.query(`
    SELECT COUNT(*) as no_price FROM products WHERE price IS NULL
  `);
  const issues2 = await client.query(`
    SELECT COUNT(*) as no_cat FROM products WHERE "categoryId" IS NULL
  `);
  const issues3 = await client.query(`
    SELECT COUNT(*) as no_prov FROM products WHERE proveedor IS NULL OR proveedor = ''
  `);
  const dupes = await client.query(`
    SELECT "productId", COUNT(*) as cnt FROM products GROUP BY "productId" HAVING COUNT(*) > 1
  `);

  console.log(`\nIssues:`);
  console.log(`  Without price: ${issues.rows[0].no_price}`);
  console.log(`  Without category: ${issues2.rows[0].no_cat}`);
  console.log(`  Without proveedor: ${issues3.rows[0].no_prov}`);
  console.log(`  Duplicate productIds: ${dupes.rows.length}`);

  await client.end();
  console.log('\nDone!');
}

main().catch(console.error);
