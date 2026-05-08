import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://promoimport.cl';
const PRODUCTS_URL = `${BASE_URL}/productos/`;
const PROVEEDOR = 'promoimport';
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'promoimport_catalogo_v2.json');
const CHECKPOINT_PATH = path.join(__dirname, '..', '..', 'promoimport_checkpoint.json');

const DELAY_BETWEEN_PAGES = 2500;
const DELAY_BETWEEN_PRODUCTS = 3500;
const BROWSER_RESTART_EVERY = 8;
const CHECKPOINT_EVERY = 25;
const MAX_RETRIES = 3;

// ── Browser helpers ──

function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });
}

async function newPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  return page;
}

function isBlocked(title) {
  return title.includes('momento') || title.includes('challenge') || title.includes('Cloudflare');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Attribute parsing ──

function parseAttributeText(rawHtml) {
  // Replace <br> with newlines for easier parsing
  const text = rawHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();

  const attrs = {
    tamano: null,
    colores: [],
    material: null,
    sugerencia: null,
    accesorios: null,
    presentacion: null,
    capacidad: null,
  };

  const lines = text.split('\n').map((l) => l.replace(/^[•*\-–]\s*/, '').trim()).filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.startsWith('tamano:') || lower.startsWith('tamaño:')) {
      attrs.tamano = line.replace(/^[Tt]ama[nñ]o:\s*/i, '').replace(/\.$/, '').trim();
    } else if (lower.startsWith('colores:') || lower.startsWith('color:')) {
      const colorStr = line.replace(/^[Cc]olou?re?s?:\s*/i, '').replace(/\.$/, '').trim();
      attrs.colores = parseColors(colorStr);
    } else if (lower.startsWith('material:') || lower.startsWith('materiales:')) {
      attrs.material = line.replace(/^[Mm]ateriale?s?:\s*/i, '').replace(/\.$/, '').trim();
    } else if (lower.startsWith('sugerencia:')) {
      attrs.sugerencia = line.replace(/^[Ss]ugerencia:\s*/i, '').replace(/\.$/, '').trim();
    } else if (lower.startsWith('accesorios:') || lower.startsWith('accesorio:')) {
      attrs.accesorios = line.replace(/^[Aa]ccesorios?:\s*/i, '').replace(/\.$/, '').trim();
    } else if (lower.startsWith('presentacion:') || lower.startsWith('presentación:')) {
      attrs.presentacion = line.replace(/^[Pp]resentaci[oó]n:\s*/i, '').replace(/\.$/, '').trim();
    } else if (lower.startsWith('capacidad:')) {
      attrs.capacidad = line.replace(/^[Cc]apacidad:\s*/i, '').replace(/\.$/, '').trim();
    }
  }

  return attrs;
}

function parseColors(colorStr) {
  // Matches patterns like: "Blanco (01), Azul (02), Rojo (03)"
  // or "Blanco, Azul, Rojo"
  // or "Gris/Azul (02), Gris/Rojo (03)"
  const colors = [];
  const parts = colorStr.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const match = part.match(/^(.+?)\s*\((\d+)\)\s*$/);
    if (match) {
      colors.push({ nombre: match[1].trim(), codigo: match[2] });
    } else if (part.length > 0) {
      colors.push({ nombre: part.trim(), codigo: null });
    }
  }

  return colors;
}

function parseDimensions(tamanoStr) {
  if (!tamanoStr) return null;

  // Try to parse "W x H x D cm" pattern
  const match3d = tamanoStr.match(/([\d.,]+)\s*x\s*([\d.,]+)\s*x\s*([\d.,]+)\s*cm/i);
  if (match3d) {
    return {
      raw: tamanoStr,
      width: parseFloat(match3d[1].replace(',', '.')),
      height: parseFloat(match3d[2].replace(',', '.')),
      length: parseFloat(match3d[3].replace(',', '.')),
    };
  }

  // Try to parse "W x H cm" pattern
  const match2d = tamanoStr.match(/([\d.,]+)\s*x\s*([\d.,]+)\s*cm/i);
  if (match2d) {
    return {
      raw: tamanoStr,
      width: parseFloat(match2d[1].replace(',', '.')),
      height: parseFloat(match2d[2].replace(',', '.')),
      length: null,
    };
  }

  return { raw: tamanoStr, width: null, height: null, length: null };
}

// ── Phase A: Collect product URLs from listing pages ──

async function scrapeListingPage(pageNum) {
  const browser = await launchBrowser();
  try {
    const page = await newPage(browser);
    const url = pageNum === 1 ? PRODUCTS_URL : `${PRODUCTS_URL}page/${pageNum}/`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(3000);

    // Wait for Cloudflare if needed
    let title = await page.title();
    if (isBlocked(title)) {
      for (let w = 0; w < 4; w++) {
        await sleep(3000);
        title = await page.title();
        if (!isBlocked(title)) break;
      }
    }
    if (isBlocked(title)) {
      console.log(`  [BLOCKED on page ${pageNum}, retrying...]`);
      await browser.close();
      await sleep(8000);
      return scrapeListingPage(pageNum);
    }

    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('.product-small.col');
      return Array.from(items).map((el) => {
        const classMatch = el.className.match(/post-(\d+)/);
        const id = classMatch ? classMatch[1] : '';

        const skuEl = el.querySelector('p[style*="color"]');
        const sku = skuEl ? skuEl.textContent.trim() : '';

        const nameEl = el.querySelector('.product-title, .woocommerce-loop-product__title');
        const nombre = nameEl ? nameEl.textContent.trim() : '';

        const linkEl = el.querySelector('a.woocommerce-LoopProduct-link, a[href*="/product/"]');
        const url = linkEl ? linkEl.href : '';

        const catEl = el.querySelector('.product-cat');
        const categorias = catEl ? catEl.textContent.trim() : '';

        return { id, sku, nombre, url, categorias };
      }).filter((p) => p.nombre && p.url);
    });

    return products;
  } finally {
    await browser.close();
  }
}

async function getTotalPages() {
  const browser = await launchBrowser();
  try {
    const page = await newPage(browser);
    await page.goto(PRODUCTS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(4000);

    return await page.evaluate(() => {
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
  } finally {
    await browser.close();
  }
}

// ── Phase B: Scrape individual product detail ──

async function scrapeProductDetail(productUrl, browser, retries = 0) {
  try {
    const page = await newPage(browser);
    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(2500);

    // Wait for Cloudflare challenge to resolve (up to 10s)
    let title = await page.title();
    if (isBlocked(title)) {
      for (let w = 0; w < 4; w++) {
        await sleep(3000);
        title = await page.title();
        if (!isBlocked(title)) break;
      }
    }

    if (isBlocked(title)) {
      await page.close();
      if (retries < MAX_RETRIES) {
        console.log(`  [BLOCKED on ${productUrl}, retry ${retries + 1}/${MAX_RETRIES}]`);
        await sleep(8000 * (retries + 1));
        return scrapeProductDetail(productUrl, browser, retries + 1);
      }
      return null;
    }

    const detail = await page.evaluate(() => {
      const productDiv = document.querySelector('div.product[id^="product-"]');
      if (!productDiv) return null;

      // Product ID from class
      const idMatch = productDiv.id.match(/product-(\d+)/);
      const id = idMatch ? idMatch[1] : '';

      // Product type
      const classes = productDiv.className;
      const productType = classes.includes('product-type-variable') ? 'variable' : 'simple';
      const inStock = classes.includes('instock');

      // Title (try multiple selectors)
      const titleEl = productDiv.querySelector('h1.product_title')
        || productDiv.querySelector('h1.product-title')
        || document.querySelector('h1.product_title')
        || productDiv.querySelector('.product-short-description h2');
      const name = titleEl ? titleEl.textContent.trim() : '';

      // SKU from price div
      const priceEl = productDiv.querySelector('.product-info .price.product-page-price');
      const sku = priceEl ? priceEl.textContent.trim() : '';

      // Categories
      const catLinks = productDiv.querySelectorAll('.product_meta .posted_in a[rel="tag"]');
      const categories = Array.from(catLinks).map((a) => a.textContent.trim());

      // Tags
      const tagLinks = productDiv.querySelectorAll('.product_meta .tagged_as a[rel="tag"]');
      const tags = Array.from(tagLinks).map((a) => a.textContent.trim());

      // Description
      const descSection = productDiv.querySelector(
        '.product-page-sections .product-section:first-child .panel.entry-content'
      );
      const description = descSection ? descSection.textContent.trim() : '';

      // Attribute table (raw HTML for parsing)
      const attrCell = productDiv.querySelector(
        'td.woocommerce-product-attributes-item__value'
      );
      const attributeHtml = attrCell ? attrCell.innerHTML : '';

      // Images gallery
      const imageEls = productDiv.querySelectorAll(
        '.woocommerce-product-gallery__image.slide img'
      );
      const images = [];
      for (const img of imageEls) {
        const url =
          img.getAttribute('data-large_image') ||
          img.getAttribute('data-src') ||
          img.src;
        if (url && !url.includes('placeholder') && !images.includes(url)) {
          images.push(url);
        }
      }

      return { id, name, sku, productType, inStock, categories, tags, description, attributeHtml, images };
    });

    await page.close();
    return detail;
  } catch (err) {
    if (retries < MAX_RETRIES) {
      console.log(`  [ERROR on ${productUrl}: ${err.message}, retry ${retries + 1}]`);
      await sleep(3000 * (retries + 1));
      return scrapeProductDetail(productUrl, browser, retries + 1);
    }
    return null;
  }
}

// ── Checkpoint management ──

function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_PATH)) {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8'));
      console.log(`  Checkpoint encontrado: ${data.products.length} productos ya scrapeados`);
      return data;
    }
  } catch {
    // ignore
  }
  return { scrapedUrls: new Set(), products: [] };
}

function saveCheckpoint(data) {
  const toSave = {
    scrapedUrls: Array.from(data.scrapedUrls),
    products: data.products,
  };
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(toSave, null, 2));
}

// ── Main ──

async function main() {
  console.log('🚀 Scraping PromoImport V2 — con detalle de productos\n');

  // Load checkpoint
  const checkpoint = loadCheckpoint();
  const scrapedUrls = new Set(checkpoint.scrapedUrls || []);
  const allProducts = checkpoint.products || [];

  // Phase A: Collect all product URLs
  console.log('📄 Fase A: Recolectando URLs de productos...');
  const totalPages = await getTotalPages();
  console.log(`   Total de páginas: ${totalPages}\n`);

  const productEntries = [];
  const seenUrls = new Set();

  for (let i = 1; i <= totalPages; i++) {
    process.stdout.write(`  Página ${i}/${totalPages}...`);
    try {
      const products = await scrapeListingPage(i);
      let newCount = 0;
      for (const p of products) {
        if (!seenUrls.has(p.url)) {
          seenUrls.add(p.url);
          productEntries.push(p);
          newCount++;
        }
      }
      console.log(` ${products.length} productos (${newCount} nuevos). Total: ${productEntries.length}`);
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
    }
    if (i < totalPages) await sleep(DELAY_BETWEEN_PAGES);
  }

  console.log(`\n📦 Total URLs recolectadas: ${productEntries.length}`);

  // Filter out already scraped
  const pending = productEntries.filter((p) => !scrapedUrls.has(p.url));
  console.log(`   Ya scrapeados: ${productEntries.length - pending.length}`);
  console.log(`   Pendientes: ${pending.length}\n`);

  if (pending.length === 0) {
    console.log('✅ Todos los productos ya fueron scrapeados.');
    saveResults(allProducts);
    return;
  }

  // Phase B: Scrape each product detail
  console.log('🔍 Fase B: Scraping detalle de cada producto...\n');

  let browser = await launchBrowser();
  let browserCount = 0;

  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];

    // Restart browser periodically
    if (browserCount >= BROWSER_RESTART_EVERY) {
      await browser.close();
      await sleep(2000);
      browser = await launchBrowser();
      browserCount = 0;
    }

    const progress = `[${i + 1}/${pending.length}]`;
    process.stdout.write(`  ${progress} ${entry.sku || entry.id} - ${entry.nombre.substring(0, 40)}...`);

    const detail = await scrapeProductDetail(entry.url, browser);

    if (detail) {
      // Parse attributes
      const attrs = parseAttributeText(detail.attributeHtml);
      const dimensions = parseDimensions(attrs.tamano);

      const product = {
        id: detail.id || entry.id,
        productId: `PI-${detail.sku || entry.sku || entry.id}`,
        sku: detail.sku || entry.sku,
        name: detail.name || entry.nombre,
        slug: generateSlug(detail.name || entry.nombre),
        description: detail.description,
        categories: detail.categories.length > 0 ? detail.categories : entry.categorias ? [entry.categorias] : [],
        tags: detail.tags,
        productType: detail.productType,
        inStock: detail.inStock,
        images: detail.images,
        attributes: {
          tamano: attrs.tamano,
          colores: attrs.colores,
          material: attrs.material,
          sugerencia: attrs.sugerencia,
          accesorios: attrs.accesorios,
          presentacion: attrs.presentacion,
          capacidad: attrs.capacidad,
        },
        dimensions,
        proveedor: PROVEEDOR,
        url: entry.url,
      };

      allProducts.push(product);
      scrapedUrls.add(entry.url);

      const colorCount = attrs.colores.length;
      const imgCount = detail.images.length;
      console.log(` OK (${imgCount} imgs, ${colorCount} colores)`);
    } else {
      console.log(` FAILED`);
      scrapedUrls.add(entry.url); // Mark as attempted
    }

    browserCount++;

    // Checkpoint
    if ((i + 1) % CHECKPOINT_EVERY === 0) {
      saveCheckpoint({ scrapedUrls, products: allProducts });
      console.log(`  💾 Checkpoint guardado (${allProducts.length} productos)`);
    }

    if (i < pending.length - 1) await sleep(DELAY_BETWEEN_PRODUCTS);
  }

  await browser.close();

  // Save final results
  saveResults(allProducts);

  // Cleanup checkpoint
  if (fs.existsSync(CHECKPOINT_PATH)) {
    fs.unlinkSync(CHECKPOINT_PATH);
    console.log('  🗑️  Checkpoint eliminado');
  }
}

function saveResults(products) {
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(products, null, 2));
  console.log(`\n✅ Archivo guardado: ${OUTPUT_PATH}`);

  // Stats
  const withColors = products.filter((p) => p.attributes.colores.length > 0).length;
  const withMaterial = products.filter((p) => p.attributes.material).length;
  const withDimensions = products.filter((p) => p.attributes.tamano).length;
  const withImages = products.filter((p) => p.images.length > 0).length;
  const totalImages = products.reduce((sum, p) => sum + p.images.length, 0);
  const categories = new Set(products.flatMap((p) => p.categories));

  console.log(`\n📈 Resumen:`);
  console.log(`   Productos totales: ${products.length}`);
  console.log(`   Con colores: ${withColors}`);
  console.log(`   Con material: ${withMaterial}`);
  console.log(`   Con dimensiones: ${withDimensions}`);
  console.log(`   Con imágenes: ${withImages} (${totalImages} total)`);
  console.log(`   Categorías únicas: ${categories.size}`);
}

main().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
