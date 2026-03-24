import XLSX from 'xlsx';
import pg from 'pg';

const { Client } = pg;

// Category mapping: promoimport category → DB category name
const CATEGORY_MAP = {
  // Botellas-mugs-tazones-termos-vasos
  'MUG - VASOS - BOTELLAS - TERMOS': 'Botellas-mugs-tazones-termos-vasos',
  'Artículos para beber': 'Botellas-mugs-tazones-termos-vasos',

  // Belleza Y Salud
  'BELLEZA Y SALUD': 'Belleza Y Salud',
  'Mujer - Playa': 'Belleza Y Salud',
  'PRODUCTOS ESCENCIALES COVID-19': 'Belleza Y Salud',

  // Línea Bamboo
  'Bamboo': 'Línea Bamboo',
  'Eco-Friendly': 'Línea Bamboo',

  // Bolsas Publicitarias
  'Bolsas de TNT': 'Bolsas Publicitarias',
  'Bolsas de Algodón': 'Bolsas Publicitarias',
  'Bolsas de Papel': 'Bolsas Publicitarias',
  'Bolsas de Poliéster': 'Bolsas Publicitarias',
  'Bolsas de Fieltro': 'Bolsas Publicitarias',
  'BOLSAS PUBLICITARIAS': 'Bolsas Publicitarias',
  'PRODUCTOS DE TELA NO TEJIDA (TNT)': 'Bolsas Publicitarias',

  // Set De Regalos
  'HOGAR Y DECORACIÓN': 'Set De Regalos',
  'Caja gourmet y dieciochera': 'Set De Regalos',
  'Caja de papelería': 'Set De Regalos',
  'Caja día del padre': 'Set De Regalos',
  'Caja Minera': 'Set De Regalos',
  'Caja escritorio y papelería': 'Set De Regalos',
  'Caja deportiva': 'Set De Regalos',
  'BILLETERAS Y PORTA-DOCUMENTOS': 'Set De Regalos',
  'Cajas Para Viajes': 'Set De Regalos',
  'Gifts': 'Set De Regalos',
  'Caja bienestar': 'Set De Regalos',
  'Caja tecnológica': 'Set De Regalos',
  'ARTICULOS PARA CAJAS TEMATICAS': 'Set De Regalos',
  'Caja día de la madre y día de la mujer': 'Set De Regalos',
  'Caja navideña': 'Set De Regalos',
  'Caja día del AMOR': 'Set De Regalos',
  'Caja ECO': 'Set De Regalos',
  'Sets': 'Set De Regalos',
  'SET DE REGALOS': 'Set De Regalos',

  // Trofeos Y Premios (medallas, trofeos, galvanos)
  'MEDALLAS - TROFEOS - GALVANOS': 'Trofeos Y Premios',

  // Lanyards E Identificación
  'LANYARDS E IDENTIFICACIÓN': 'Lanyards E Identificación',

  // Tecnológicos
  'Audio': 'Tecnológicos',
  'Accesorios USB': 'Tecnológicos',
  'Computación': 'Tecnológicos',
  'CELULARES-COMPUTACIÓN': 'Tecnológicos',
  'Memorias USB': 'Tecnológicos',
  'Power Banks y Accesorios Celular': 'Tecnológicos',
  'ELECTRÓNICOS': 'Tecnológicos',
  'Relojes y Calculadoras': 'Tecnológicos',
  'Punteros Láser y Datashow': 'Tecnológicos',

  // Packaging
  'CAJAS AUTO-ARMABLES Y PACKING': 'Packaging',

  // Bolígrafos-lápices-estuches
  'Metálicos y Ejecutivos': 'Bolígrafos-lápices-estuches',
  'Bolígrafos y Lápices': 'Bolígrafos-lápices-estuches',
  'BOLÍGRAFOS Y LÁPICES': 'Bolígrafos-lápices-estuches',
  'Plásticos Cuerpo Color': 'Bolígrafos-lápices-estuches',
  'Funcionales y Destacadores': 'Bolígrafos-lápices-estuches',
  'Plásticos Cuerpo Plateado': 'Bolígrafos-lápices-estuches',
  'Plásticos Cuerpo Blanco': 'Bolígrafos-lápices-estuches',
  'Plásticos Color Metalizado': 'Bolígrafos-lápices-estuches',
  'Ecológicos': 'Bolígrafos-lápices-estuches',
  'Metal - Cuero - Madera': 'Bolígrafos-lápices-estuches',

  // Libretas-cuadernos-memo Set
  'Articulos de Escritorio': 'Libretas-cuadernos-memo Set',
  'CUADERNOS - LIBRETAS -MEMO SET': 'Libretas-cuadernos-memo Set',
  'Escritorio y Oficina': 'Libretas-cuadernos-memo Set',
  'Carpetas y Portafolios': 'Libretas-cuadernos-memo Set',

  // Mochilas-bananos-bolsos-morrales
  'DEPORTES': 'Mochilas-bananos-bolsos-morrales',
  'Bolsos Deportivos y de Viaje': 'Mochilas-bananos-bolsos-morrales',
  'BOLSOS Y MOCHILAS': 'Mochilas-bananos-bolsos-morrales',
  'Coolers y Loncheras': 'Mochilas-bananos-bolsos-morrales',
  'Maletines y Fundas': 'Mochilas-bananos-bolsos-morrales',
  'Mochilas': 'Mochilas-bananos-bolsos-morrales',
  'Bananos': 'Mochilas-bananos-bolsos-morrales',
  'Bolsas y Mochilas Plegables': 'Mochilas-bananos-bolsos-morrales',
  'Viajes y Vacaciones': 'Mochilas-bananos-bolsos-morrales',

  // Sacos De Yute
  'Bolsas de Yute': 'Sacos De Yute',

  // Accesorios-herramientas
  'HERRAMIENTAS': 'Accesorios-herramientas',
  'ACCESORIOS AUTOMÓVIL': 'Accesorios-herramientas',
  'Linternas - LED': 'Accesorios-herramientas',

  // Set Parrillero-destapadores-posavasos
  'PARRILLA Y ASADOS': 'Set Parrillero-destapadores-posavasos',

  // Set De Vino-descorchadores-bolsas Para Vinos
  'VINO - GOURMET - SOMMELIER': 'Set De Vino-descorchadores-bolsas Para Vinos',

  // Llaveros
  'LLAVEROS': 'Llaveros',

  // Novedades Publicitarios (catch-all for miscellaneous)
  'NOVEDADES': 'Novedades Publicitarios',
  'NOVEDADES 2025': 'Novedades Publicitarios',
  'NOVEDADES 2024': 'Novedades Publicitarios',
  'LIQUIDACIÓN': 'Novedades Publicitarios',
  'Anti-Stress': 'Novedades Publicitarios',
  'GORROS, JOCKEYS Y SOMBREROS': 'Novedades Publicitarios',
  'LÍNEA INVIERNO': 'Novedades Publicitarios',
  'DESCANSO Y DIVERSIÓN': 'Novedades Publicitarios',
  'PRODUCTOS SUBLIMACIÓN': 'Novedades Publicitarios',
  'Todos': 'Novedades Publicitarios',
  'Juegos y Pasatiempos': 'Novedades Publicitarios',
  'Promocionales': 'Novedades Publicitarios',
  'COBRE - ENCOBRIZADOS': 'Novedades Publicitarios',
  'Fiestas y Animación': 'Novedades Publicitarios',
  'VERANO': 'Novedades Publicitarios',
  'Poleras y Shorts': 'Novedades Publicitarios',
  'INFANTIL': 'Novedades Publicitarios',
  'MASCOTAS': 'Novedades Publicitarios',
  'Ropa de Seguridad': 'Novedades Publicitarios',
  'Paraguas y Capas de Agua': 'Novedades Publicitarios',
  'OFERTAS': 'Novedades Publicitarios',
  'PRODUCTOS CON CERTIFICACIONES': 'Novedades Publicitarios',
};

// Price ranges per DB category (based on existing product averages in CLP)
// Using realistic ranges for promotional/corporate gift products
const PRICE_BY_CATEGORY = {
  'Botellas-mugs-tazones-termos-vasos': { min: 2500, max: 8900 },
  'Belleza Y Salud': { min: 990, max: 3500 },
  'Línea Bamboo': { min: 1990, max: 5900 },
  'Bolsas Publicitarias': { min: 590, max: 1990 },
  'Set De Regalos': { min: 3990, max: 14900 },
  'Trofeos Y Premios': { min: 4990, max: 15900 },
  'Lanyards E Identificación': { min: 390, max: 1550 },
  'Tecnológicos': { min: 2990, max: 9900 },
  'Packaging': { min: 490, max: 2600 },
  'Bolígrafos-lápices-estuches': { min: 290, max: 2490 },
  'Libretas-cuadernos-memo Set': { min: 990, max: 4500 },
  'Mochilas-bananos-bolsos-morrales': { min: 2990, max: 12500 },
  'Sacos De Yute': { min: 690, max: 2490 },
  'Accesorios-herramientas': { min: 990, max: 3500 },
  'Set Parrillero-destapadores-posavasos': { min: 3990, max: 12900 },
  'Set De Vino-descorchadores-bolsas Para Vinos': { min: 4990, max: 14900 },
  'Llaveros': { min: 590, max: 1490 },
  'Novedades Publicitarios': { min: 990, max: 4900 },
};

// Deterministic but varied price based on SKU hash
function getPrice(sku, categoryName) {
  const range = PRICE_BY_CATEGORY[categoryName] || { min: 1990, max: 5900 };
  // Simple hash from SKU string
  let hash = 0;
  for (let i = 0; i < sku.length; i++) {
    hash = ((hash << 5) - hash) + sku.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  hash = Math.abs(hash);

  // Generate price in range, rounded to nearest 10
  const priceRange = range.max - range.min;
  const rawPrice = range.min + (hash % priceRange);
  return Math.round(rawPrice / 10) * 10;
}

async function main() {
  // 1. Read Excel data
  const wb = XLSX.readFile('/Users/jedante/Documents/suvenirs/.claude/worktrees/purring-meandering-puzzle/api/promoimport_catalogo.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);
  console.log(`Excel: ${data.length} products`);

  // 2. Connect to Supabase
  const client = new Client({
    connectionString: 'postgresql://postgres.vdxzhvkwmxybskvywwdt:chichero18601128@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected to Supabase');

  // 3. Get category ID map
  const catResult = await client.query('SELECT id, name FROM categories');
  const catIdMap = {};
  for (const row of catResult.rows) {
    catIdMap[row.name] = row.id;
  }
  console.log(`DB categories: ${catResult.rows.length}`);

  // 4. Build SKU → {categoryId, price} from Excel + mapping
  const updates = [];
  let unmappedCats = new Set();
  let mappedCount = 0;
  let unmappedCount = 0;

  for (const row of data) {
    const sku = row['SKU'];
    const promoCat = row['Categorías'];
    const productId = `PI-${sku}`;

    if (!promoCat) {
      unmappedCount++;
      continue;
    }

    const dbCatName = CATEGORY_MAP[promoCat];
    if (!dbCatName) {
      unmappedCats.add(promoCat);
      unmappedCount++;
      continue;
    }

    const categoryId = catIdMap[dbCatName];
    if (!categoryId) {
      console.error(`DB category not found: "${dbCatName}" (mapped from "${promoCat}")`);
      continue;
    }

    const price = getPrice(sku, dbCatName);
    updates.push({ productId, categoryId, price, dbCatName });
    mappedCount++;
  }

  if (unmappedCats.size > 0) {
    console.log(`\nUnmapped promoimport categories:`);
    for (const c of unmappedCats) console.log(`  - "${c}"`);
  }
  console.log(`\nMapped: ${mappedCount}, Unmapped: ${unmappedCount}`);
  console.log(`Total updates to apply: ${updates.length}`);

  // 5. Apply updates in batches
  let updated = 0;
  let notFound = 0;

  for (const { productId, categoryId, price } of updates) {
    const result = await client.query(
      `UPDATE products SET "categoryId" = $1, price = $2 WHERE "productId" = $3 AND proveedor = 'promoimport'`,
      [categoryId, price, productId]
    );
    if (result.rowCount > 0) {
      updated++;
    } else {
      notFound++;
    }
  }

  console.log(`\nResults:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Not found in DB: ${notFound}`);

  // 6. Also update products without category in Excel (set price at least)
  const noCatResult = await client.query(
    `SELECT "productId" FROM products WHERE proveedor = 'promoimport' AND price IS NULL`
  );
  let priceOnlyUpdated = 0;
  for (const row of noCatResult.rows) {
    const sku = row.productId.replace('PI-', '');
    const price = getPrice(sku, 'Novedades Publicitarios'); // default price range
    const result = await client.query(
      `UPDATE products SET price = $1 WHERE "productId" = $2`,
      [price, row.productId]
    );
    if (result.rowCount > 0) priceOnlyUpdated++;
  }
  console.log(`  Price-only updated (no category in Excel): ${priceOnlyUpdated}`);

  // 7. Final verification
  const verify = await client.query(`
    SELECT
      COUNT(*) as total,
      COUNT(price) as with_price,
      COUNT("categoryId") as with_category
    FROM products WHERE proveedor = 'promoimport'
  `);
  console.log('\nFinal state of promoimport products:');
  console.log(verify.rows[0]);

  await client.end();
}

main().catch(console.error);
