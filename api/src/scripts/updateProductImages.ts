import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { env } from '../config/env.js';
import { pexelsService } from '../services/pexels.service.js';

// Map Spanish category/product keywords to English for better Pexels search results
const keywordMap: Record<string, string> = {
  'bolsas': 'bags shopping',
  'mochilas': 'backpack',
  'botellas': 'water bottle',
  'termos': 'thermos flask',
  'vasos': 'cups mugs',
  'mug': 'coffee mug',
  'mugs': 'coffee mugs',
  'cuadernos': 'notebook',
  'libretas': 'notebook journal',
  'bolígrafos': 'pens',
  'lápices': 'pencils',
  'gorros': 'caps hats',
  'ropa': 'clothing apparel',
  'vestimenta': 'clothing',
  'deportiva': 'sports athletic',
  'deportes': 'sports',
  'electrónicos': 'electronics gadgets',
  'celulares': 'smartphone',
  'computación': 'computer technology',
  'tecnología': 'technology',
  'llaveros': 'keychain',
  'herramientas': 'tools',
  'trofeos': 'trophy award',
  'medallas': 'medal',
  'premios': 'award trophy',
  'vino': 'wine bottle',
  'gourmet': 'gourmet food',
  'sommelier': 'wine tasting',
  'belleza': 'beauty cosmetics',
  'salud': 'wellness health',
  'hogar': 'home decor',
  'decoración': 'home decoration',
  'ecológicos': 'eco friendly',
  'bamboo': 'bamboo products',
  'bambú': 'bamboo',
  'cobre': 'copper metal',
  'terraza': 'patio outdoor',
  'jardín': 'garden outdoor',
  'parrilla': 'grill bbq',
  'asados': 'barbecue',
  'verano': 'summer beach',
  'invierno': 'winter snow',
  'infantil': 'kids children',
  'niños': 'children',
  'sillas': 'chair furniture',
  'embalaje': 'packaging boxes',
  'cajas': 'boxes packaging',
  'negocios': 'business office',
  'empresas': 'corporate business',
  'timbres': 'stamps office',
  'identificación': 'id badge',
  'lanyards': 'lanyard id',
  'automóvil': 'car automotive',
  'sublimación': 'printing',
  'regalo': 'gift present',
  'regalos': 'gifts presents',
  'premium': 'luxury premium',
  'ofertas': 'sale discount',
  'liquidación': 'clearance sale',
  'novedades': 'new products',
  'publicitarias': 'promotional advertising',
  'publicitarios': 'promotional',
  'tnt': 'fabric textile',
  'tela': 'textile fabric',
  'billeteras': 'wallet leather',
  'documentos': 'documents folder',
  'packaging': 'packaging',
  'covid': 'medical health',
  'protección': 'protection safety',
  'rfid': 'technology security',
  'descanso': 'relaxation',
  'diversión': 'fun entertainment',
  'memo': 'notepad',
  'green': 'eco green',
  'life': 'lifestyle',
  'galvanos': 'plaque award',
};

function extractKeywords(productName: string): string {
  const nameLower = productName.toLowerCase()
    .replace(/producto\s+/gi, '')
    .replace(/–/g, ' ')
    .replace(/\(/g, ' ')
    .replace(/\)/g, ' ');

  // Find matching keywords
  const matchedKeywords: string[] = [];

  for (const [spanish, english] of Object.entries(keywordMap)) {
    if (nameLower.includes(spanish)) {
      matchedKeywords.push(english);
      // Only take first match for cleaner search
      break;
    }
  }

  // If we have a match, use it
  if (matchedKeywords.length > 0) {
    return matchedKeywords[0];
  }

  // Fallback: use corporate gift
  return 'corporate gift';
}

async function updateProductImages() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    if (!env.PEXELS_API_KEY) {
      console.error('❌ PEXELS_API_KEY not configured in environment');
      process.exit(1);
    }

    // Get all products
    const products = await Product.find().sort({ productId: 1 });

    console.log(`\n📦 Found ${products.length} products to update`);
    console.log('\n🔄 Updating product images with Pexels...\n');

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const keywords = extractKeywords(product.name);

      try {
        // Search for photos using Pexels
        const result = await pexelsService.searchPhotos(keywords, 1, 1);

        if (!result || result.photos.length === 0) {
          console.log(`  ⚠️  ${product.productId} - No images found for: ${keywords}`);
          failed++;
          continue;
        }

        const photo = result.photos[0];
        const imageUrl = photo.src.large;

        await Product.findByIdAndUpdate(product._id, {
          image: imageUrl,
        });

        console.log(`  ✅ ${product.productId} - ${product.name}`);
        console.log(`     Search: "${keywords}"`);
        console.log(`     Photo by: ${photo.photographer}`);
        console.log(`     🖼️  ${imageUrl.substring(0, 80)}...\n`);

        updated++;

        // Add delay to respect API rate limits (Pexels allows 200 requests/hour)
        // Wait 20 seconds between requests (180 requests/hour to be safe)
        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 20000));
        }
      } catch (error: any) {
        console.log(`  ❌ ${product.productId} - Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n✅ Successfully updated ${updated} product images`);
    if (failed > 0) {
      console.log(`⚠️  Failed to update ${failed} products`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateProductImages();
