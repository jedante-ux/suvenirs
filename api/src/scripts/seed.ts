import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Get ALL categories from database (including child categories)
    const categories = await Category.find().sort({ order: 1 });
    console.log(`📦 Found ${categories.length} categories in database`);

    // Product templates based on category names (using Pexels images)
    const productTemplates: Record<string, any> = {
      'ARTÍCULOS PUBLICITARIOS': {
        name: 'Kit Corporativo Ejecutivo',
        description: 'Set completo de artículos corporativos que incluye libreta, bolígrafo y accesorios de escritorio. Ideal para eventos empresariales y regalos institucionales.',
        quantity: 100,
        image: 'https://images.pexels.com/photos/6457579/pexels-photo-6457579.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop',
        featured: true,
      },
      'REGALOS PREMIUM': {
        name: 'Caja de Regalo Premium',
        description: 'Elegante caja de regalo con diseño premium, perfecta para ocasiones especiales. Incluye personalización con logo empresarial y acabados de alta calidad.',
        quantity: 50,
        image: 'https://images.pexels.com/photos/264985/pexels-photo-264985.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop',
        featured: true,
      },
      'TROFEOS Y PREMIOS': {
        name: 'Trofeo Copa Dorada',
        description: 'Trofeo clásico de copa con acabado dorado, incluye placa personalizable. Ideal para premiaciones y reconocimientos corporativos.',
        quantity: 50,
        image: 'https://images.pexels.com/photos/8612961/pexels-photo-8612961.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop',
        featured: false,
      },
      'BOLÍGRAFOS Y LÁPICES': {
        name: 'Bolígrafo Ejecutivo Metálico',
        description: 'Bolígrafo de alta calidad con acabado metálico y grabado láser personalizado. Presentación en estuche de lujo para regalos corporativos.',
        quantity: 300,
        image: 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop',
        featured: false,
      },
      'MUG – VASOS – BOTELLAS – TERMOS': {
        name: 'Botella Térmica Personalizada',
        description: 'Botella térmica de acero inoxidable con capacidad de 500ml. Mantiene bebidas frías por 24 horas y calientes por 12 horas. Disponible para grabado láser.',
        quantity: 200,
        image: 'https://images.pexels.com/photos/4397840/pexels-photo-4397840.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop',
        featured: true,
      },
      'THE GREEN LIFE': {
        name: 'Set Eco-Friendly Bambú',
        description: 'Set de productos ecológicos de bambú: libreta, bolígrafo y lápiz. Material sustentable y diseño moderno. Perfecto para empresas comprometidas con el medio ambiente.',
        quantity: 150,
        image: 'https://images.pexels.com/photos/7262775/pexels-photo-7262775.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop',
        featured: true,
      },
    };

    // Create products using Product.create() to properly handle category ObjectId
    if (categories.length === 0) {
      console.log('⚠️  No categories found in database.');
    } else {
      console.log(`\n📦 Creating ${categories.length} products...\n`);

      const insertedProducts = [];

      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const template = productTemplates[category.name] || {
          name: `Producto ${category.name}`,
          description: `Producto personalizable de la categoría ${category.name}. Ideal para regalos corporativos y eventos especiales.`,
          quantity: 100,
          image: 'https://images.pexels.com/photos/6457579/pexels-photo-6457579.jpeg?auto=compress&cs=tinysrgb&w=800&h=800&fit=crop',
          featured: false,
        };

        const productId = `PROD-${String(i + 1).padStart(3, '0')}`;
        const slug = template.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const product = new Product({
          productId,
          name: template.name,
          slug,
          description: template.description,
          category: category._id,
          quantity: template.quantity,
          image: template.image,
          featured: template.featured,
          isActive: true,
        });

        await product.save();
        insertedProducts.push(product);

        if ((i + 1) % 30 === 0) {
          console.log(`   ✅ Created ${i + 1}/${categories.length} products...`);
        }
      }

      console.log(`\n✅ Created ${insertedProducts.length} products total\n`);

      // Update product counts in categories
      console.log('📊 Updating category product counts...');
      const allCategories = await Category.find();
      for (const category of allCategories) {
        const count = await Product.countDocuments({ category: category._id, isActive: true });
        await Category.findByIdAndUpdate(category._id, { productCount: count });
      }
      console.log('✅ Category product counts updated');
    }

    await mongoose.disconnect();
    console.log('\n✅ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
