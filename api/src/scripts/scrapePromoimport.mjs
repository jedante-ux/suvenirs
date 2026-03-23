import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://promoimport.cl';
const PRODUCTS_URL = `${BASE_URL}/productos/`;
const PROVEEDOR = 'promoimport';

async function scrapeOnePage(pageNum) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const url = pageNum === 1 ? PRODUCTS_URL : `${PRODUCTS_URL}page/${pageNum}/`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3000));

    const title = await page.title();
    if (title.includes('momento') || title.includes('challenge')) {
      console.log(` [BLOCKED - retrying]`);
      await browser.close();
      await new Promise((r) => setTimeout(r, 3000));
      return scrapeOnePage(pageNum);
    }

    const products = await page.evaluate((proveedor) => {
      const items = document.querySelectorAll('.product-small.col');
      const results = [];

      items.forEach((el) => {
        const classMatch = el.className.match(/post-(\d+)/);
        const id = classMatch ? classMatch[1] : '';

        const skuEl = el.querySelector('p[style*="color"]');
        const sku = skuEl ? skuEl.textContent.trim() : '';

        const nameEl = el.querySelector('.product-title, .woocommerce-loop-product__title');
        const nombre = nameEl ? nameEl.textContent.trim() : '';

        const catTextEl = el.querySelector('.product-cat');
        const categorias = catTextEl ? catTextEl.textContent.trim() : '';

        const imgEl = el.querySelector('img');
        let imagen_url = '';
        if (imgEl) {
          const srcset = imgEl.getAttribute('srcset');
          if (srcset) {
            imagen_url = srcset.split(',')[0].trim().split(' ')[0];
          } else {
            imagen_url = imgEl.src || '';
          }
        }

        if (nombre) {
          results.push({ id, sku, nombre, categorias, imagen_url, proveedor });
        }
      });

      return results;
    }, PROVEEDOR);

    return products;
  } finally {
    await browser.close();
  }
}

async function getTotalPages() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.goto(PRODUCTS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 4000));

    const lastPage = await page.evaluate(() => {
      const links = document.querySelectorAll('.page-numbers a');
      let max = 1;
      links.forEach((link) => {
        const match = link.href.match(/\/page\/(\d+)\//);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > max) max = num;
        }
      });
      return max;
    });

    return lastPage;
  } finally {
    await browser.close();
  }
}

async function exportToExcel(products, outputPath) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Catálogo PromoImport');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'SKU', key: 'sku', width: 12 },
    { header: 'Nombre', key: 'nombre', width: 50 },
    { header: 'Categorías', key: 'categorias', width: 40 },
    { header: 'Imagen URL', key: 'imagen_url', width: 60 },
    { header: 'Proveedor', key: 'proveedor', width: 15 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E7D32' },
  };

  for (const product of products) {
    sheet.addRow(product);
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: products.length + 1, column: 6 },
  };

  await workbook.xlsx.writeFile(outputPath);
}

async function main() {
  console.log('🚀 Iniciando scraping de PromoImport...\n');

  console.log('📄 Detectando total de páginas...');
  const totalPages = await getTotalPages();
  console.log(`   Total de páginas: ${totalPages}`);
  console.log(`   (Nota: nueva instancia de browser por página para evitar Cloudflare)\n`);

  const allProducts = [];
  const seenIds = new Set();
  let emptyPages = 0;

  for (let i = 1; i <= totalPages; i++) {
    process.stdout.write(`📦 Página ${i}/${totalPages}...`);

    try {
      const products = await scrapeOnePage(i);

      let newCount = 0;
      for (const p of products) {
        const key = p.id || `${p.sku}-${p.nombre}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          allProducts.push(p);
          newCount++;
        }
      }

      console.log(` ${products.length} productos (${newCount} nuevos). Total: ${allProducts.length}`);

      if (products.length === 0) {
        emptyPages++;
        if (emptyPages >= 3) {
          console.log('⚠️  3 páginas vacías consecutivas, puede haber un problema.');
          emptyPages = 0;
        }
      } else {
        emptyPages = 0;
      }
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
    }

    // Delay between requests
    if (i < totalPages) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const outputPath = path.join(__dirname, '..', '..', 'promoimport_catalogo.xlsx');
  console.log(`\n📊 Exportando ${allProducts.length} productos a Excel...`);
  await exportToExcel(allProducts, outputPath);
  console.log(`✅ Archivo guardado en: ${outputPath}`);

  const categories = new Set(allProducts.map((p) => p.categorias));
  console.log(`\n📈 Resumen:`);
  console.log(`   Productos totales: ${allProducts.length}`);
  console.log(`   Categorías únicas: ${categories.size}`);
  console.log(`   Páginas scrapeadas: ${totalPages}`);
}

main();
