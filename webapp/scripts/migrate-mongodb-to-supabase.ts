/**
 * Migration script: MongoDB → Supabase (PostgreSQL via Prisma + Supabase Auth)
 *
 * Usage:
 *   cd /Users/jedante/Documents/suvenirs
 *   npx dotenv-cli -e webapp/.env.local -- npx tsx scripts/migrate-mongodb-to-supabase.ts
 *
 * Requirements:
 *   - MongoDB Docker container running (suvenirscl)
 *   - Supabase local running (supabase start in webapp/)
 *   - Prisma migrations applied (npx prisma migrate dev in webapp/)
 */

import { config } from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

// Load .env.local from webapp directory (must happen before PrismaClient instantiation)
config({ path: resolve(process.cwd(), '.env.local') })

const MONGO_URI = 'mongodb://localhost:27017/suvenirs'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DATABASE_URL = process.env.DATABASE_URL!

const adapter = new PrismaPg({ connectionString: DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Map MongoDB ObjectId string → new Supabase UUID
const categoryIdMap = new Map<string, string>()

async function migrateUsers(db: any) {
  console.log('\n--- Migrating Users ---')
  const users = await db.collection('users').find({}).toArray()
  console.log(`Found ${users.length} users`)

  for (const user of users) {
    // Create user in Supabase Auth (with a temp password - they'll need to reset)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'Suvenirs2026!', // Temporary password
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`  User ${user.email} already exists in Auth, skipping`)
        // Try to find existing auth user
        const { data: listData } = await supabase.auth.admin.listUsers()
        const existingUser = listData?.users?.find(u => u.email === user.email)
        if (existingUser) {
          // Upsert profile
          await prisma.profile.upsert({
            where: { id: existingUser.id },
            update: {
              email: user.email,
              firstName: user.firstName || 'Admin',
              lastName: user.lastName || 'Suvenirs',
              phone: user.phone || null,
              company: user.company || null,
              role: user.role === 'admin' ? 'ADMIN' : 'USER',
              isActive: user.isActive ?? true,
            },
            create: {
              id: existingUser.id,
              email: user.email,
              firstName: user.firstName || 'Admin',
              lastName: user.lastName || 'Suvenirs',
              phone: user.phone || null,
              company: user.company || null,
              role: user.role === 'admin' ? 'ADMIN' : 'USER',
              isActive: user.isActive ?? true,
            }
          })
          console.log(`  ✓ Profile upserted for ${user.email}`)
        }
        continue
      }
      console.error(`  ✗ Auth error for ${user.email}:`, authError.message)
      continue
    }

    const authUserId = authData.user!.id

    // Create profile in Prisma
    await prisma.profile.create({
      data: {
        id: authUserId,
        email: user.email,
        firstName: user.firstName || 'Admin',
        lastName: user.lastName || 'Suvenirs',
        phone: user.phone || null,
        company: user.company || null,
        role: user.role === 'admin' ? 'ADMIN' : 'USER',
        isActive: user.isActive ?? true,
      }
    })

    console.log(`  ✓ Migrated user: ${user.email} (${user.role})`)
  }
}

async function migrateCategories(db: any) {
  console.log('\n--- Migrating Categories ---')

  // First pass: migrate top-level categories (no parent)
  const rootCategories = await db.collection('categories').find({ parent: null }).toArray()
  console.log(`Found ${rootCategories.length} root categories`)

  for (const cat of rootCategories) {
    const created = await prisma.category.create({
      data: {
        categoryId: cat.categoryId || `CAT-${cat._id.toString().slice(-6).toUpperCase()}`,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        image: cat.image || null,
        icon: cat.icon || null,
        order: cat.order ?? 0,
        isActive: cat.isActive ?? true,
        productCount: cat.productCount ?? 0,
      }
    })
    categoryIdMap.set(cat._id.toString(), created.id)
    console.log(`  ✓ Root: ${cat.name}`)
  }

  // Second pass: migrate child categories
  const childCategories = await db.collection('categories').find({ parent: { $ne: null } }).toArray()
  console.log(`Found ${childCategories.length} child categories`)

  for (const cat of childCategories) {
    const parentMongoId = cat.parent instanceof ObjectId ? cat.parent.toString() : cat.parent?.toString()
    const parentUUID = parentMongoId ? categoryIdMap.get(parentMongoId) : null

    const created = await prisma.category.create({
      data: {
        categoryId: cat.categoryId || `CAT-${cat._id.toString().slice(-6).toUpperCase()}`,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        image: cat.image || null,
        icon: cat.icon || null,
        parentId: parentUUID || null,
        order: cat.order ?? 0,
        isActive: cat.isActive ?? true,
        productCount: cat.productCount ?? 0,
      }
    })
    categoryIdMap.set(cat._id.toString(), created.id)
    console.log(`  ✓ Child: ${cat.name} (parent: ${parentUUID ? 'mapped' : 'not found'})`)
  }
}

async function migrateProducts(db: any) {
  console.log('\n--- Migrating Products ---')
  const products = await db.collection('products').find({}).toArray()
  console.log(`Found ${products.length} products`)

  let success = 0
  let errors = 0

  // Batch insert for speed
  const BATCH_SIZE = 50
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)

    for (const product of batch) {
      try {
        const categoryMongoId = product.category instanceof ObjectId
          ? product.category.toString()
          : product.category?.toString()
        const categoryUUID = categoryMongoId ? categoryIdMap.get(categoryMongoId) : null

        await prisma.product.create({
          data: {
            productId: product.productId || `P-${product._id.toString().slice(-8).toUpperCase()}`,
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            categoryId: categoryUUID || null,
            quantity: product.quantity ?? 0,
            price: product.price || null,
            salePrice: product.salePrice || null,
            currency: product.currency || 'CLP',
            image: product.image || '/placeholder-product.jpg',
            featured: product.featured ?? false,
            isActive: product.isActive ?? true,
          }
        })
        success++
      } catch (err: any) {
        // Skip duplicates
        if (err.code === 'P2002') {
          // Slug conflict - append productId
          try {
            await prisma.product.create({
              data: {
                productId: product.productId || `P-${product._id.toString().slice(-8).toUpperCase()}`,
                name: product.name,
                slug: `${product.slug}-${product.productId?.toLowerCase() || product._id.toString().slice(-4)}`,
                description: product.description || '',
                categoryId: null,
                quantity: product.quantity ?? 0,
                price: product.price || null,
                salePrice: product.salePrice || null,
                currency: product.currency || 'CLP',
                image: product.image || '/placeholder-product.jpg',
                featured: product.featured ?? false,
                isActive: product.isActive ?? true,
              }
            })
            success++
          } catch {
            errors++
          }
        } else {
          console.error(`  ✗ Product ${product.productId}: ${err.message}`)
          errors++
        }
      }
    }

    process.stdout.write(`  Progress: ${Math.min(i + BATCH_SIZE, products.length)}/${products.length}\r`)
  }

  console.log(`\n  ✓ Migrated: ${success}, Errors: ${errors}`)
}

async function main() {
  console.log('Starting migration: MongoDB → Supabase')
  console.log(`Supabase URL: ${SUPABASE_URL}`)

  const mongo = new MongoClient(MONGO_URI)

  try {
    await mongo.connect()
    console.log('✓ Connected to MongoDB')

    await prisma.$connect()
    console.log('✓ Connected to Supabase PostgreSQL via Prisma')

    const db = mongo.db('suvenirs')

    // Clear existing data (for re-runs)
    console.log('\nClearing existing data...')
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    // Don't delete auth users on re-run to avoid orphans

    await migrateUsers(db)
    await migrateCategories(db)
    await migrateProducts(db)

    console.log('\n✅ Migration complete!')

    // Summary
    const [categories, products, profiles] = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.profile.count(),
    ])
    console.log(`\nSummary:`)
    console.log(`  Profiles: ${profiles}`)
    console.log(`  Categories: ${categories}`)
    console.log(`  Products: ${products}`)

  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    await mongo.close()
    await prisma.$disconnect()
  }
}

main()
