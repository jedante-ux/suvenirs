// Disable SSL cert validation for Supabase pooler
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const SUPABASE_URL =
  process.env.SUPABASE_DATABASE_URL ||
  'postgresql://postgres.vdxzhvkwmxybskvywwdt:chichero18601128@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require';

const INPUT_PATH = path.join(__dirname, '..', '..', 'promoimport_catalogo_v2.json');
const PROVEEDOR = 'promoimport';

// ── Category mapping: PromoImport → DB category ──

const CATEGORY_MAP = {
  'MUG - VASOS - BOTELLAS - TERMOS': 'Botellas-mugs-tazones-termos-vasos',
  'Artículos para beber': 'Botellas-mugs-tazones-termos-vasos',
  'BELLEZA Y SALUD': 'Belleza Y Salud',
  'Mujer - Playa': 'Belleza Y Salud',
  'PRODUCTOS ESCENCIALES COVID-19': 'Belleza Y Salud',
  'Bamboo': 'Línea Bamboo',
  'Eco-Friendly': 'Línea Bamboo',
  'Bolsas de TNT': 'Bolsas Publicitarias',
  'Bolsas de Algodón': 'Bolsas Publicitarias',
  'Bolsas de Papel': 'Bolsas Publicitarias',
  'Bolsas de Poliéster': 'Bolsas Publicitarias',
  'Bolsas de Fieltro': 'Bolsas Publicitarias',
  'BOLSAS PUBLICITARIAS': 'Bolsas Publicitarias',
  'PRODUCTOS DE TELA NO TEJIDA (TNT)': 'Bolsas Publicitarias',
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
  'MEDALLAS - TROFEOS - GALVANOS': 'Trofeos Y Premios',
  'LANYARDS E IDENTIFICACIÓN': 'Lanyards E Identificación',
  'Audio': 'Tecnológicos',
  'Accesorios USB': 'Tecnológicos',
  'Computación': 'Tecnológicos',
  'CELULARES-COMPUTACIÓN': 'Tecnológicos',
  'Memorias USB': 'Tecnológicos',
  'Power Banks y Accesorios Celular': 'Tecnológicos',
  'ELECTRÓNICOS': 'Tecnológicos',
  'Relojes y Calculadoras': 'Tecnológicos',
  'Punteros Láser y Datashow': 'Tecnológicos',
  'CAJAS AUTO-ARMABLES Y PACKING': 'Packaging',
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
  'Articulos de Escritorio': 'Libretas-cuadernos-memo Set',
  'CUADERNOS - LIBRETAS -MEMO SET': 'Libretas-cuadernos-memo Set',
  'Escritorio y Oficina': 'Libretas-cuadernos-memo Set',
  'Carpetas y Portafolios': 'Libretas-cuadernos-memo Set',
  'DEPORTES': 'Mochilas-bananos-bolsos-morrales',
  'Bolsos Deportivos y de Viaje': 'Mochilas-bananos-bolsos-morrales',
  'BOLSOS Y MOCHILAS': 'Mochilas-bananos-bolsos-morrales',
  'Coolers y Loncheras': 'Mochilas-bananos-bolsos-morrales',
  'Maletines y Fundas': 'Mochilas-bananos-bolsos-morrales',
  'Mochilas': 'Mochilas-bananos-bolsos-morrales',
  'Bananos': 'Mochilas-bananos-bolsos-morrales',
  'Bolsas y Mochilas Plegables': 'Mochilas-bananos-bolsos-morrales',
  'Viajes y Vacaciones': 'Mochilas-bananos-bolsos-morrales',
  'Bolsas de Yute': 'Sacos De Yute',
  'HERRAMIENTAS': 'Accesorios-herramientas',
  'ACCESORIOS AUTOMÓVIL': 'Accesorios-herramientas',
  'Linternas - LED': 'Accesorios-herramientas',
  'PARRILLA Y ASADOS': 'Set Parrillero-destapadores-posavasos',
  'VINO - GOURMET - SOMMELIER': 'Set De Vino-descorchadores-bolsas Para Vinos',
  'LLAVEROS': 'Llaveros',
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
  'ROPA PUBLICITARIA': 'Novedades Publicitarios',
  'VESTIMENTA DEPORTIVA': 'Novedades Publicitarios',
  'VAMOS CHILE': 'Novedades Publicitarios',
  'TERRAZA Y JARDÍN': 'Novedades Publicitarios',
};

// ── Helpers ──

function findCategoryId(categories, categoryMap) {
  for (const cat of categories) {
    const dbCatName = CATEGORY_MAP[cat];
    if (dbCatName && categoryMap.has(dbCatName.toLowerCase())) {
      return categoryMap.get(dbCatName.toLowerCase());
    }
    // Try direct match
    if (categoryMap.has(cat.toLowerCase())) {
      return categoryMap.get(cat.toLowerCase());
    }
  }
  return null;
}

// ── Main ──

async function main() {
  console.log('🚀 Importando PromoImport V2 a Supabase...\n');

  // Read JSON
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌ Archivo no encontrado: ${INPUT_PATH}`);
    console.error('   Ejecuta primero: node src/scripts/scrapePromoimportV2.mjs');
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  console.log(`📦 ${products.length} productos leídos del JSON\n`);

  // Connect to Supabase
  const client = new pg.Client({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('🔗 Conectado a Supabase\n');

  // Load categories
  const catResult = await client.query('SELECT id, name, slug FROM categories');
  const categoryMap = new Map();
  for (const cat of catResult.rows) {
    categoryMap.set(cat.name.toLowerCase(), cat.id);
    if (cat.slug) categoryMap.set(cat.slug.toLowerCase(), cat.id);
  }
  console.log(`📁 ${catResult.rows.length} categorías cargadas\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let attributesCreated = 0;
  let variantsCreated = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const progress = `[${i + 1}/${products.length}]`;

    try {
      const categoryId = findCategoryId(p.categories || [], categoryMap);

      // Check if product exists
      const existing = await client.query(
        'SELECT id FROM products WHERE "productId" = $1',
        [p.productId]
      );

      let productDbId;

      if (existing.rows.length > 0) {
        // Update existing product
        productDbId = existing.rows[0].id;

        await client.query(
          `UPDATE products SET
            name = $1, slug = $2, description = $3, "categoryId" = $4,
            images = $5, proveedor = $6, "isActive" = $7,
            width = $8, height = $9, length = $10,
            "updatedAt" = NOW()
          WHERE id = $11`,
          [
            p.name,
            p.slug,
            p.description || `${p.name} - Producto de ${PROVEEDOR}`,
            categoryId,
            p.images || [],
            PROVEEDOR,
            p.inStock !== false,
            p.dimensions?.width || null,
            p.dimensions?.height || null,
            p.dimensions?.length || null,
            productDbId,
          ]
        );
        updated++;

        // Delete existing attributes and variants for refresh
        await client.query('DELETE FROM product_attributes WHERE "productId" = $1', [productDbId]);
        await client.query('DELETE FROM product_variants WHERE "productId" = $1', [productDbId]);
      } else {
        // Create new product
        const insertResult = await client.query(
          `INSERT INTO products (
            id, "productId", name, slug, description, "categoryId", quantity,
            price, "salePrice", currency, images, proveedor, featured, "isActive",
            width, height, length, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, 0,
            NULL, NULL, 'CLP', $6, $7, false, $8,
            $9, $10, $11, NOW(), NOW()
          ) RETURNING id`,
          [
            p.productId,
            p.name,
            p.slug,
            p.description || `${p.name} - Producto de ${PROVEEDOR}`,
            categoryId,
            p.images || [],
            PROVEEDOR,
            p.inStock !== false,
            p.dimensions?.width || null,
            p.dimensions?.height || null,
            p.dimensions?.length || null,
          ]
        );
        productDbId = insertResult.rows[0].id;
        created++;
      }

      // ── Create ProductAttributes ──
      const attrs = p.attributes || {};
      let sortOrder = 0;

      // Color attribute
      if (attrs.colores && attrs.colores.length > 0) {
        const colorValues = attrs.colores.map((c) => c.nombre);
        await client.query(
          `INSERT INTO product_attributes (id, "productId", name, values, "sortOrder")
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [productDbId, 'Color', colorValues, sortOrder++]
        );
        attributesCreated++;
      }

      // Material attribute
      if (attrs.material) {
        await client.query(
          `INSERT INTO product_attributes (id, "productId", name, values, "sortOrder")
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [productDbId, 'Material', [attrs.material], sortOrder++]
        );
        attributesCreated++;
      }

      // Print method (Sugerencia)
      if (attrs.sugerencia) {
        const printValues = attrs.sugerencia.split(',').map((s) => s.trim()).filter(Boolean);
        await client.query(
          `INSERT INTO product_attributes (id, "productId", name, values, "sortOrder")
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [productDbId, 'Impresión', printValues, sortOrder++]
        );
        attributesCreated++;
      }

      // Capacity
      if (attrs.capacidad) {
        await client.query(
          `INSERT INTO product_attributes (id, "productId", name, values, "sortOrder")
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [productDbId, 'Capacidad', [attrs.capacidad], sortOrder++]
        );
        attributesCreated++;
      }

      // Accessories
      if (attrs.accesorios) {
        await client.query(
          `INSERT INTO product_attributes (id, "productId", name, values, "sortOrder")
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [productDbId, 'Accesorios', [attrs.accesorios], sortOrder++]
        );
        attributesCreated++;
      }

      // Presentation/packaging
      if (attrs.presentacion) {
        await client.query(
          `INSERT INTO product_attributes (id, "productId", name, values, "sortOrder")
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [productDbId, 'Presentación', [attrs.presentacion], sortOrder++]
        );
        attributesCreated++;
      }

      // Dimensions as attribute
      if (attrs.tamano) {
        await client.query(
          `INSERT INTO product_attributes (id, "productId", name, values, "sortOrder")
           VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [productDbId, 'Tamaño', [attrs.tamano], sortOrder++]
        );
        attributesCreated++;
      }

      // ── Create ProductVariants (one per color) ──
      if (attrs.colores && attrs.colores.length > 0) {
        for (let ci = 0; ci < attrs.colores.length; ci++) {
          const color = attrs.colores[ci];
          const variantSku = `PI-${p.sku}-${color.codigo || String(ci + 1).padStart(2, '0')}`;
          const variantAttrs = JSON.stringify({ Color: color.nombre });

          // Assign image from gallery by index (if available)
          const variantImage = p.images && p.images[ci] ? p.images[ci] : null;

          await client.query(
            `INSERT INTO product_variants (id, "productId", sku, attributes, image, "isActive", "sortOrder")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, true, $5)
             ON CONFLICT (sku) DO UPDATE SET
               attributes = EXCLUDED.attributes,
               image = EXCLUDED.image`,
            [productDbId, variantSku, variantAttrs, variantImage, ci]
          );
          variantsCreated++;
        }
      }

      if ((i + 1) % 50 === 0) {
        console.log(`  ${progress} Procesados ${i + 1}/${products.length} (${created} nuevos, ${updated} actualizados)`);
      }
    } catch (err) {
      errors++;
      if (errors <= 10) {
        console.error(`  ${progress} ERROR "${p.name}": ${err.message}`);
      }
    }
  }

  // Update category product counts
  console.log('\n📊 Actualizando conteo de productos por categoría...');
  await client.query(`
    UPDATE categories SET "productCount" = sub.cnt
    FROM (
      SELECT "categoryId", COUNT(*) as cnt
      FROM products
      WHERE "isActive" = true AND "categoryId" IS NOT NULL
      GROUP BY "categoryId"
    ) sub
    WHERE categories.id = sub."categoryId"
  `);

  // Summary
  const summary = await client.query(
    `SELECT proveedor, COUNT(*) as count FROM products GROUP BY proveedor ORDER BY count DESC`
  );

  console.log(`\n✅ Importación completada:`);
  console.log(`   Nuevos: ${created}`);
  console.log(`   Actualizados: ${updated}`);
  console.log(`   Atributos creados: ${attributesCreated}`);
  console.log(`   Variantes creadas: ${variantsCreated}`);
  if (errors > 0) console.log(`   Errores: ${errors}`);

  console.log(`\n📈 Productos por proveedor:`);
  for (const row of summary.rows) {
    console.log(`   ${row.proveedor || '(vacío)'}: ${row.count}`);
  }

  await client.end();
  console.log('\n🎉 Listo.');
}

main().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
