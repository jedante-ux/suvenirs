import { readFileSync } from 'fs';
import pg from 'pg';

const { Client } = pg;

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

async function main() {
  // Parse base_de_datos.csv to get SKU → price mapping
  const csv = readFileSync('/Users/jedante/Documents/suvenirs/.claude/worktrees/purring-meandering-puzzle/api/src/import/base_de_datos.csv', 'utf8');
  const lines = csv.split('\n');
  const headers = parseCsvLine(lines[0]);

  const skuIdx = headers.indexOf('SKU');
  const priceNormalIdx = headers.indexOf('Precio normal');
  const priceSaleIdx = headers.indexOf('Precio rebajado');
  const tipoIdx = headers.indexOf('Tipo');

  console.log(`Columns: SKU=${skuIdx}, Precio normal=${priceNormalIdx}, Precio rebajado=${priceSaleIdx}, Tipo=${tipoIdx}`);

  // Build SKU → price map (only simple products have prices directly)
  const skuPriceMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCsvLine(line);
    const sku = fields[skuIdx]?.trim();
    const priceNormal = fields[priceNormalIdx]?.trim();
    const priceSale = fields[priceSaleIdx]?.trim();

    if (sku && priceNormal) {
      const price = parseFloat(priceNormal);
      const sale = priceSale ? parseFloat(priceSale) : null;
      if (!isNaN(price) && price > 0) {
        skuPriceMap.set(sku, { price, salePrice: (sale && !isNaN(sale)) ? sale : null });
      }
    }
  }
  console.log(`SKU → Price entries: ${skuPriceMap.size}`);

  // Show some samples
  const samples = ['N50', 'C10', 'K21', 'L41', 'E8', 'B10'];
  for (const s of samples) {
    const p = skuPriceMap.get(s);
    console.log(`  ${s}: ${p ? `${p.price} (sale: ${p.salePrice})` : 'NOT FOUND'}`);
  }

  // Connect to Supabase
  const client = new Client({
    connectionString: 'postgresql://postgres.vdxzhvkwmxybskvywwdt:chichero18601128@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('\nConnected to Supabase');

  // Get ALL imblasco products and update prices where we have CSV data
  const result = await client.query(
    `SELECT id, "productId" FROM products WHERE proveedor = 'imblasco'`
  );
  console.log(`Total imblasco products: ${result.rows.length}`);

  let updated = 0;
  let notInCsv = 0;
  for (const row of result.rows) {
    const priceData = skuPriceMap.get(row.productId);
    if (priceData) {
      await client.query(
        `UPDATE products SET price = $1, "salePrice" = $2 WHERE id = $3`,
        [priceData.price, priceData.salePrice, row.id]
      );
      updated++;
    } else {
      notInCsv++;
    }
  }

  console.log(`Updated with real price: ${updated}`);
  console.log(`Not in CSV (keeping avg-assigned price): ${notInCsv}`);

  // Final check
  const final = await client.query(`
    SELECT
      proveedor,
      COUNT(*) as total,
      COUNT(price) as con_precio,
      COUNT("salePrice") as con_sale_price,
      COUNT("categoryId") as con_categoria,
      ROUND(AVG(price)::numeric, 0) as avg_price
    FROM products
    GROUP BY proveedor
    ORDER BY proveedor
  `);
  console.log('\nFinal state:');
  for (const row of final.rows) {
    console.log(`  ${row.proveedor}: ${row.total} total | precio: ${row.con_precio}/${row.total} (avg: $${row.avg_price}) | salePrice: ${row.con_sale_price} | categoría: ${row.con_categoria}/${row.total}`);
  }

  await client.end();
}

main().catch(console.error);
