# Vercel + Supabase Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidar frontend + backend en un solo proyecto Next.js en Vercel, reemplazando MongoDB+Express+Railway con Supabase (PostgreSQL + Auth).

**Architecture:** Next.js Route Handlers reemplazan Express. Prisma como ORM sobre Supabase PostgreSQL. Supabase Auth reemplaza JWT propio. Un solo proyecto Vercel, eliminando Railway completamente.

**Tech Stack:** Next.js 16, Prisma, `@supabase/ssr`, `@supabase/supabase-js`, Supabase CLI (local dev)

---

## Pre-requisitos

```bash
# Verificar que Supabase CLI esté instalado
supabase --version
# Si no: brew install supabase/tap/supabase

# Verificar que Docker esté corriendo (necesario para Supabase local)
docker ps
```

---

## Task 1: Instalar dependencias en webapp

**Files:**
- Modify: `webapp/package.json`

**Step 1: Instalar paquetes de Supabase y Prisma**

```bash
cd webapp
npm install @supabase/supabase-js @supabase/ssr prisma @prisma/client
```

**Step 2: Verificar instalación**

```bash
npx prisma --version
# Expected: prisma : x.x.x
```

**Step 3: Commit**

```bash
cd ..
git add webapp/package.json webapp/package-lock.json
git commit -m "feat: add Prisma and Supabase dependencies"
```

---

## Task 2: Inicializar Supabase local

**Step 1: Inicializar Supabase en el repo**

```bash
# Desde la raíz del proyecto
supabase init
```

Esto crea la carpeta `supabase/` con configuración local.

**Step 2: Iniciar Supabase local**

```bash
supabase start
```

Esperar ~2 minutos. Al terminar verás algo como:

```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Step 3: Guardar las claves** — las necesitarás en el siguiente task.

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: initialize Supabase local config"
```

---

## Task 3: Crear archivo .env.local en webapp

**Files:**
- Create: `webapp/.env.local`

**Step 1: Crear .env.local** con los valores del output de `supabase start`:

```env
# Supabase local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del output de supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key del output de supabase start>

# Prisma - PostgreSQL local de Supabase
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Pexels API (copiar del api/.env actual)
PEXELS_API_KEY=<tu pexels api key>
```

**Step 2: Verificar que .gitignore incluye .env.local**

```bash
grep ".env.local" webapp/.gitignore || echo ".env.local" >> webapp/.gitignore
```

---

## Task 4: Crear schema de Prisma

**Files:**
- Create: `webapp/prisma/schema.prisma`

**Step 1: Inicializar Prisma apuntando a Supabase**

```bash
cd webapp
npx prisma init --datasource-provider postgresql
```

**Step 2: Reemplazar contenido de `webapp/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Profile {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  firstName String
  lastName  String
  phone     String?
  company   String?
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  blogPosts BlogPost[]

  @@map("profiles")
}

enum Role {
  ADMIN
  USER
}

model Category {
  id           String     @id @default(uuid()) @db.Uuid
  categoryId   String     @unique
  name         String
  slug         String     @unique
  description  String?
  image        String?
  icon         String?
  parentId     String?    @db.Uuid
  parent       Category?  @relation("CategoryChildren", fields: [parentId], references: [id])
  children     Category[] @relation("CategoryChildren")
  order        Int        @default(0)
  isActive     Boolean    @default(true)
  productCount Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  products Product[]

  @@map("categories")
}

model Product {
  id          String    @id @default(uuid()) @db.Uuid
  productId   String    @unique
  name        String
  slug        String    @unique
  description String
  categoryId  String?   @db.Uuid
  category    Category? @relation(fields: [categoryId], references: [id])
  quantity    Int       @default(0)
  price       Float?
  salePrice   Float?
  currency    String    @default("CLP")
  image       String    @default("/placeholder-product.jpg")
  featured    Boolean   @default(false)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("products")
}

model Quote {
  id              String      @id @default(uuid()) @db.Uuid
  quoteNumber     String      @unique
  totalItems      Int
  totalUnits      Int
  quotedAmount    Float       @default(0)
  finalAmount     Float       @default(0)
  customerName    String?
  customerEmail   String?
  customerPhone   String?
  customerCompany String?
  notes           String?
  status          QuoteStatus @default(PENDING)
  source          QuoteSource @default(WEB)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  items QuoteItem[]

  @@map("quotes")
}

model QuoteItem {
  id          String @id @default(uuid()) @db.Uuid
  quoteId     String @db.Uuid
  quote       Quote  @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  productId   String
  productName String
  quantity    Int
  description String @default("")

  @@map("quote_items")
}

enum QuoteStatus {
  PENDING
  CONTACTED
  QUOTED
  APPROVED
  REJECTED
  COMPLETED
}

enum QuoteSource {
  WHATSAPP
  WEB
  MANUAL
}

model BlogPost {
  id          String    @id @default(uuid()) @db.Uuid
  title       String
  slug        String    @unique
  excerpt     String
  content     String
  coverImage  String?
  authorId    String    @db.Uuid
  author      Profile   @relation(fields: [authorId], references: [id])
  tags        String[]
  isPublished Boolean   @default(false)
  publishedAt DateTime?
  views       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("blog_posts")
}
```

**Step 3: Ejecutar migración inicial**

```bash
cd webapp
npx prisma migrate dev --name init
```

Expected: "Your database is now in sync with your schema."

**Step 4: Generar cliente**

```bash
npx prisma generate
```

**Step 5: Commit**

```bash
cd ..
git add webapp/prisma/
git commit -m "feat: add Prisma schema with all models"
```

---

## Task 5: Crear clientes Prisma y Supabase

**Files:**
- Create: `webapp/src/lib/prisma.ts`
- Create: `webapp/src/lib/supabase/server.ts`
- Create: `webapp/src/lib/supabase/client.ts`

**Step 1: Crear `webapp/src/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

**Step 2: Crear directorio y cliente Supabase para Server Components**

```bash
mkdir -p webapp/src/lib/supabase
```

Crear `webapp/src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**Step 3: Crear `webapp/src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 4: Commit**

```bash
git add webapp/src/lib/
git commit -m "feat: add Prisma singleton and Supabase clients"
```

---

## Task 6: Crear Next.js middleware para proteger rutas admin

**Files:**
- Create: `webapp/src/middleware.ts`

**Step 1: Crear `webapp/src/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /gestion routes (except login)
  if (request.nextUrl.pathname.startsWith('/gestion') &&
      !request.nextUrl.pathname.startsWith('/gestion/login')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/gestion/login'
      return NextResponse.redirect(url)
    }

    // Check admin role via profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/gestion/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in admin away from login page
  if (request.nextUrl.pathname === '/gestion/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/gestion'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/gestion/:path*'],
}
```

**Step 2: Commit**

```bash
git add webapp/src/middleware.ts
git commit -m "feat: add Next.js middleware for admin route protection"
```

---

## Task 7: Route Handler - Auth

**Files:**
- Create: `webapp/src/app/api/auth/login/route.ts`
- Create: `webapp/src/app/api/auth/logout/route.ts`
- Create: `webapp/src/app/api/auth/me/route.ts`

**Step 1: Crear `webapp/src/app/api/auth/login/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const profile = await prisma.profile.findUnique({
      where: { id: data.user.id },
    })

    if (!profile || !profile.isActive) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role.toLowerCase(),
        },
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
```

**Step 2: Crear `webapp/src/app/api/auth/logout/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
```

**Step 3: Crear `webapp/src/app/api/auth/me/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } })

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        company: profile.company,
        role: profile.role.toLowerCase(),
        isActive: profile.isActive,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, phone, company } = await req.json()

    const profile = await prisma.profile.update({
      where: { id: user.id },
      data: { firstName, lastName, phone, company },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
```

**Step 4: Commit**

```bash
git add webapp/src/app/api/auth/
git commit -m "feat: add auth route handlers (login, logout, me)"
```

---

## Task 8: Route Handler - Products

**Files:**
- Create: `webapp/src/app/api/products/route.ts`
- Create: `webapp/src/app/api/products/[id]/route.ts`
- Create: `webapp/src/app/api/products/slug/[slug]/route.ts`

**Step 1: Helper para verificar admin** — crear `webapp/src/lib/auth-helpers.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })

  if (!profile || profile.role !== 'ADMIN') return null

  return profile
}

export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return prisma.profile.findUnique({ where: { id: user.id } })
}
```

**Step 2: Crear `webapp/src/app/api/products/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 12)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured')
    const random = searchParams.get('random')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.ProductWhereInput = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (featured === 'true') where.featured = true

    if (category) {
      const slugs = category.split(',').map(s => s.trim())
      const cats = await prisma.category.findMany({
        where: { slug: { in: slugs } },
        select: { id: true },
      })
      where.categoryId = { in: cats.map(c => c.id) }
    }

    if (random === 'true') {
      const count = await prisma.product.count({ where })
      const skip = Math.max(0, Math.floor(Math.random() * (count - limit)))
      const products = await prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true, description: true, icon: true } } },
        take: limit,
        skip,
      })
      return NextResponse.json({
        success: true,
        data: products,
        pagination: { page: 1, limit, total: products.length, totalPages: 1 },
      })
    }

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order } as Prisma.ProductOrderByWithRelationInput

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true, description: true, icon: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const product = await prisma.product.create({ data: { ...body, slug } })
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
```

**Step 3: Crear `webapp/src/app/api/products/[id]/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { name: true, slug: true, description: true, icon: true } } },
    })
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: product })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching product' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    const product = await prisma.product.update({ where: { id }, data: body })
    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting product' }, { status: 500 })
  }
}
```

**Step 4: Crear `webapp/src/app/api/products/slug/[slug]/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { category: { select: { name: true, slug: true, description: true, icon: true } } },
    })
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: product })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching product' }, { status: 500 })
  }
}
```

**Step 5: Commit**

```bash
git add webapp/src/app/api/products/ webapp/src/lib/auth-helpers.ts
git commit -m "feat: add product route handlers"
```

---

## Task 9: Route Handler - Categories

**Files:**
- Create: `webapp/src/app/api/categories/route.ts`
- Create: `webapp/src/app/api/categories/[id]/route.ts`
- Create: `webapp/src/app/api/categories/slug/[slug]/route.ts`

**Step 1: Crear `webapp/src/app/api/categories/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    // Add sample product image if category has no image
    const result = await Promise.all(
      categories.map(async (cat) => {
        if (cat.image) return cat
        const product = await prisma.product.findFirst({
          where: { categoryId: cat.id, isActive: true },
          select: { image: true },
          orderBy: { createdAt: 'desc' },
        })
        return { ...cat, image: product?.image || null }
      })
    )

    return NextResponse.json({ success: true, data: result })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Auto-generate categoryId
    const last = await prisma.category.findFirst({ orderBy: { categoryId: 'desc' } })
    const lastNum = last ? parseInt(last.categoryId.replace('CAT-', '')) : 0
    const categoryId = `CAT-${String(lastNum + 1).padStart(3, '0')}`

    const category = await prisma.category.create({
      data: { ...body, slug, categoryId, parentId: body.parentId || null },
    })
    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
```

**Step 2: Crear `webapp/src/app/api/categories/[id]/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: category })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching category' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    const category = await prisma.category.update({
      where: { id },
      data: { ...body, parentId: body.parentId || null },
    })
    return NextResponse.json({ success: true, data: category })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const productsCount = await prisma.product.count({ where: { categoryId: id } })
    if (productsCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category with ${productsCount} products` },
        { status: 400 }
      )
    }

    const childCount = await prisma.category.count({ where: { parentId: id } })
    if (childCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category with ${childCount} sub-categories` },
        { status: 400 }
      )
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting category' }, { status: 500 })
  }
}
```

**Step 3: Crear `webapp/src/app/api/categories/slug/[slug]/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const category = await prisma.category.findFirst({ where: { slug, isActive: true } })
    if (!category) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: category })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching category' }, { status: 500 })
  }
}
```

**Step 4: Commit**

```bash
git add webapp/src/app/api/categories/
git commit -m "feat: add category route handlers"
```

---

## Task 10: Route Handler - Quotes

**Files:**
- Create: `webapp/src/app/api/quotes/route.ts`
- Create: `webapp/src/app/api/quotes/stats/route.ts`
- Create: `webapp/src/app/api/quotes/[id]/route.ts`
- Create: `webapp/src/app/api/quotes/[id]/status/route.ts`

**Step 1: Crear `webapp/src/app/api/quotes/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma, QuoteStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const { items, customerName, customerEmail, customerPhone, customerCompany, notes, source } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one item is required' }, { status: 400 })
    }

    const totalItems = items.length
    const totalUnits = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)

    // Generate quote number
    const count = await prisma.quote.count()
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const quoteNumber = `COT-${year}${month}-${(count + 1).toString().padStart(4, '0')}`

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        totalItems,
        totalUnits,
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        notes,
        source: (source?.toUpperCase() || 'WEB') as any,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            description: item.description || '',
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: quote }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 20)
    const status = searchParams.get('status')
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.QuoteWhereInput = {}
    if (status) where.status = status.toUpperCase() as QuoteStatus

    const skip = (page - 1) * limit

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: order },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: quotes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching quotes' }, { status: 500 })
  }
}
```

**Step 2: Crear `webapp/src/app/api/quotes/stats/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const [total, pending, contacted, quoted, approved, completed, rejected] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { status: 'PENDING' } }),
      prisma.quote.count({ where: { status: 'CONTACTED' } }),
      prisma.quote.count({ where: { status: 'QUOTED' } }),
      prisma.quote.count({ where: { status: 'APPROVED' } }),
      prisma.quote.count({ where: { status: 'COMPLETED' } }),
      prisma.quote.count({ where: { status: 'REJECTED' } }),
    ])

    return NextResponse.json({ success: true, data: { total, pending, contacted, quoted, approved, completed, rejected } })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching stats' }, { status: 500 })
  }
}
```

**Step 3: Crear `webapp/src/app/api/quotes/[id]/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const quote = await prisma.quote.findUnique({ where: { id }, include: { items: true } })
    if (!quote) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: quote })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching quote' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const quote = await prisma.quote.update({ where: { id }, data: body, include: { items: true } })
    return NextResponse.json({ success: true, data: quote })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.quote.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Quote deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting quote' }, { status: 500 })
  }
}
```

**Step 4: Crear `webapp/src/app/api/quotes/[id]/status/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { QuoteStatus } from '@prisma/client'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['PENDING', 'CONTACTED', 'QUOTED', 'APPROVED', 'REJECTED', 'COMPLETED']
    const upperStatus = status?.toUpperCase()

    if (!upperStatus || !validStatuses.includes(upperStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: { status: upperStatus as QuoteStatus },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: quote })
  } catch {
    return NextResponse.json({ success: false, error: 'Error updating status' }, { status: 500 })
  }
}
```

**Step 5: Commit**

```bash
git add webapp/src/app/api/quotes/
git commit -m "feat: add quote route handlers"
```

---

## Task 11: Route Handler - Blog

**Files:**
- Create: `webapp/src/app/api/blog/route.ts`
- Create: `webapp/src/app/api/blog/tags/route.ts`
- Create: `webapp/src/app/api/blog/slug/[slug]/route.ts`
- Create: `webapp/src/app/api/blog/[id]/route.ts`
- Create: `webapp/src/app/api/blog/[id]/publish/route.ts`
- Create: `webapp/src/app/api/blog/admin/all/route.ts`
- Create: `webapp/src/app/api/blog/admin/[id]/route.ts`

**Step 1: Crear `webapp/src/app/api/blog/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin, getAuthUser } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 10)
    const search = searchParams.get('search') || ''
    const tag = searchParams.get('tag') || ''
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.BlogPostWhereInput = { isPublished: true }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (tag) where.tags = { has: tag }

    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: { author: { select: { firstName: true, lastName: true } } },
        orderBy: { publishedAt: order },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching blog posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const slug = body.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const post = await prisma.blogPost.create({
      data: {
        ...body,
        slug,
        authorId: admin.id,
        publishedAt: body.isPublished ? new Date() : null,
      },
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    })

    return NextResponse.json({ success: true, data: post }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
```

**Step 2: Crear `webapp/src/app/api/blog/tags/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { tags: true },
    })
    const tags = [...new Set(posts.flatMap(p => p.tags))]
    return NextResponse.json({ success: true, data: tags })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching tags' }, { status: 500 })
  }
}
```

**Step 3: Crear `webapp/src/app/api/blog/slug/[slug]/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const post = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
      include: { author: { select: { firstName: true, lastName: true } } },
    })
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })

    await prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } })

    return NextResponse.json({ success: true, data: post })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching post' }, { status: 500 })
  }
}
```

**Step 4: Crear `webapp/src/app/api/blog/[id]/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await prisma.blogPost.findFirst({
      where: { id, isPublished: true },
      include: { author: { select: { firstName: true, lastName: true } } },
    })
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: post })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching post' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (body.title) {
      body.slug = body.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    const post = await prisma.blogPost.update({
      where: { id },
      data: body,
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    })
    return NextResponse.json({ success: true, data: post })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.blogPost.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Post deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting post' }, { status: 500 })
  }
}
```

**Step 5: Crear `webapp/src/app/api/blog/[id]/publish/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'server/server'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const post = await prisma.blogPost.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        isPublished: !post.isPublished,
        publishedAt: !post.isPublished && !post.publishedAt ? new Date() : post.publishedAt,
      },
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json({ success: false, error: 'Error updating post' }, { status: 500 })
  }
}
```

**Step 6: Crear `webapp/src/app/api/blog/admin/all/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 10)
    const search = searchParams.get('search') || ''
    const isPublished = searchParams.get('isPublished')
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.BlogPostWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isPublished !== null && isPublished !== undefined) {
      where.isPublished = isPublished === 'true'
    }

    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: { author: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: order },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching posts' }, { status: 500 })
  }
}
```

**Step 7: Crear `webapp/src/app/api/blog/admin/[id]/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    })
    if (!post) return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: post })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching post' }, { status: 500 })
  }
}
```

**Step 8: Commit**

```bash
git add webapp/src/app/api/blog/
git commit -m "feat: add blog route handlers"
```

---

## Task 12: Route Handler - Admin Dashboard & Users

**Files:**
- Create: `webapp/src/app/api/admin/dashboard/route.ts`
- Create: `webapp/src/app/api/admin/sales/monthly/route.ts`
- Create: `webapp/src/app/api/admin/users/route.ts`
- Create: `webapp/src/app/api/admin/users/[id]/route.ts`
- Create: `webapp/src/app/api/admin/products/route.ts`
- Create: `webapp/src/app/api/admin/products/import/route.ts`
- Create: `webapp/src/app/api/admin/products/import-prices/route.ts`
- Create: `webapp/src/app/api/admin/categories/route.ts`
- Create: `webapp/src/app/api/admin/categories/[id]/route.ts`

**Step 1: Crear `webapp/src/app/api/admin/dashboard/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const [totalProducts, activeProducts, featuredProducts, outOfStockProducts,
           totalUsers, totalQuotes, pendingQuotes, recentQuotes] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { featured: true } }),
      prisma.product.count({ where: { quantity: 0 } }),
      prisma.profile.count(),
      prisma.quote.count(),
      prisma.quote.count({ where: { status: 'PENDING' } }),
      prisma.quote.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { items: true } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        products: { total: totalProducts, active: activeProducts, featured: featuredProducts, outOfStock: outOfStockProducts },
        users: { total: totalUsers },
        quotes: { total: totalQuotes, pending: pendingQuotes, recent: recentQuotes },
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching dashboard' }, { status: 500 })
  }
}
```

**Step 2: Crear `webapp/src/app/api/admin/sales/monthly/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const now = new Date()
    const targetYear = Number(searchParams.get('year') || now.getFullYear())
    const targetMonth = Number(searchParams.get('month') || now.getMonth() + 1)

    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

    const [completedQuotes, allQuotesInMonth] = await Promise.all([
      prisma.quote.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.quote.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    ])

    const totalSales = completedQuotes.length
    const totalUnits = completedQuotes.reduce((sum, q) => sum + q.totalUnits, 0)
    const totalAmount = completedQuotes.reduce((sum, q) => sum + (q.finalAmount || q.quotedAmount || 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        year: targetYear, month: targetMonth,
        monthName: startDate.toLocaleDateString('es-CL', { month: 'long' }),
        sales: {
          count: totalSales, totalUnits, totalAmount,
          totalQuotes: allQuotesInMonth,
          conversionRate: allQuotesInMonth > 0 ? ((totalSales / allQuotesInMonth) * 100).toFixed(1) : '0',
        },
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching sales' }, { status: 500 })
  }
}
```

**Step 3: Crear `webapp/src/app/api/admin/users/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma, Role } from '@prisma/client'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 20)
    const role = searchParams.get('role')
    const search = searchParams.get('search') || ''
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.ProfileWhereInput = {}

    if (role) where.role = role.toUpperCase() as Role
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      prisma.profile.findMany({ where, orderBy: { createdAt: order }, skip, take: limit }),
      prisma.profile.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { email, password, firstName, lastName, phone, company, role } = await req.json()
    const supabaseAdmin = await createAdminClient()

    // Create user in Supabase Auth
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        id: authData.user.id,
        email,
        firstName,
        lastName,
        phone,
        company,
        role: (role?.toUpperCase() || 'USER') as Role,
      },
    })

    return NextResponse.json({ success: true, data: profile }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
```

**Step 4: Crear `webapp/src/app/api/admin/users/[id]/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Role } from '@prisma/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const user = await prisma.profile.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: user })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching user' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { firstName, lastName, phone, company, role, isActive } = await req.json()

    const user = await prisma.profile.update({
      where: { id },
      data: {
        firstName, lastName, phone, company, isActive,
        role: role ? role.toUpperCase() as Role : undefined,
      },
    })
    return NextResponse.json({ success: true, data: user })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const supabaseAdmin = await createAdminClient()

    await prisma.profile.delete({ where: { id } })
    await supabaseAdmin.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch {
    return NextResponse.json({ success: false, error: 'Error deleting user' }, { status: 500 })
  }
}
```

**Step 5: Crear `webapp/src/app/api/admin/products/route.ts`** (admin view incluyendo inactivos)

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 20)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured')
    const isActive = searchParams.get('isActive')
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const where: Prisma.ProductWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      const slugs = category.split(',').map(s => s.trim())
      const cats = await prisma.category.findMany({ where: { slug: { in: slugs } }, select: { id: true } })
      where.categoryId = { in: cats.map(c => c.id) }
    }

    if (featured !== null && featured !== undefined) where.featured = featured === 'true'
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { createdAt: order },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching products' }, { status: 500 })
  }
}
```

**Step 6: Crear `webapp/src/app/api/admin/products/import/route.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    const fileContent = await file.text()
    const lines = fileContent.split('\n').filter(l => l.trim())

    if (lines.length < 2) {
      return NextResponse.json({ success: false, error: 'File is empty or has no data rows' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const required = ['productId', 'name', 'description', 'quantity', 'image']
    const missing = required.filter(h => !headers.includes(h))

    if (missing.length > 0) {
      return NextResponse.json({ success: false, error: `Missing columns: ${missing.join(', ')}` }, { status: 400 })
    }

    let imported = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim())
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })

        let categoryId: string | null = null
        if (row.category) {
          const cat = await prisma.category.findFirst({ where: { categoryId: row.category } })
          if (cat) categoryId = cat.id
        }

        const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const existing = await prisma.product.findFirst({ where: { productId: row.productId } })

        const data = {
          name: row.name,
          description: row.description,
          quantity: parseInt(row.quantity) || 0,
          image: row.image,
          categoryId,
          featured: row.featured === 'true',
          isActive: row.isActive !== 'false',
          ...(row.price ? { price: parseFloat(row.price.replace(/[$.\s]/g, '').replace(',', '.')) } : {}),
        }

        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data })
        } else {
          await prisma.product.create({ data: { ...data, productId: row.productId, slug } })
        }

        imported++
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `${imported} products imported${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

**Step 7: Crear `webapp/src/app/api/admin/products/import-prices/route.ts`** — misma lógica que Express, adaptar con prisma. Estructura similar al import pero solo actualiza price/salePrice.

```typescript
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })

    const fileContent = await file.text()
    const lines = fileContent.split('\n').filter(l => l.trim())
    if (lines.length < 2) return NextResponse.json({ success: false, error: 'Empty file' }, { status: 400 })

    const sep = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase())

    const idIdx = headers.findIndex(h => ['productid', 'codigo', 'id', 'product_id', 'sku'].includes(h))
    const priceIdx = headers.findIndex(h => ['price', 'precio', 'valor', 'monto', 'price_clp'].includes(h))
    const saleIdx = headers.findIndex(h => ['saleprice', 'sale_price', 'precio_oferta', 'descuento'].includes(h))

    if (idIdx === -1) return NextResponse.json({ success: false, error: 'Missing productId column' }, { status: 400 })
    if (priceIdx === -1) return NextResponse.json({ success: false, error: 'Missing price column' }, { status: 400 })

    let updated = 0, notFound = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(sep).map(v => v.trim())
        const productId = values[idIdx]
        const priceStr = values[priceIdx]
        if (!productId || !priceStr) continue

        const price = parseFloat(priceStr.replace(/[$.\s]/g, '').replace(',', '.'))
        if (isNaN(price) || price < 0) { errors.push(`Row ${i + 1}: Invalid price`); continue }

        const saleStr = saleIdx !== -1 ? values[saleIdx] : null
        let salePrice: number | undefined
        if (saleStr) {
          salePrice = parseFloat(saleStr.replace(/[$.\s]/g, '').replace(',', '.'))
          if (isNaN(salePrice) || salePrice >= price) salePrice = undefined
        }

        const product = await prisma.product.findFirst({ where: { productId } })
        if (product) {
          await prisma.product.update({
            where: { id: product.id },
            data: { price, ...(salePrice !== undefined ? { salePrice } : {}) },
          })
          updated++
        } else {
          notFound++
          errors.push(`Row ${i + 1}: Product "${productId}" not found`)
        }
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true, updated, notFound,
      errors: errors.slice(0, 20),
      message: `${updated} prices updated, ${notFound} not found`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
```

**Step 8: Crear `webapp/src/app/api/admin/categories/route.ts`** — apunta a los mismos handlers de `/api/categories` (re-export o duplicar lógica de create/list)

Para admin/categories usamos los mismos endpoints de `/api/categories`, no duplicar. Los admin pages deben llamar a `/api/categories` directamente.

**Step 9: Crear `webapp/src/app/api/images/route.ts`** (Pexels search)

```typescript
import { requireAdmin } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('perPage') || '15'
    const type = searchParams.get('type') || 'search' // 'search' or 'curated'

    const PEXELS_API_KEY = process.env.PEXELS_API_KEY
    if (!PEXELS_API_KEY) {
      return NextResponse.json({ success: false, error: 'Pexels API not configured' }, { status: 503 })
    }

    let url: string
    if (type === 'curated') {
      url = `https://api.pexels.com/v1/curated?page=${page}&per_page=${perPage}`
    } else {
      if (!query) return NextResponse.json({ success: false, error: 'Query required' }, { status: 400 })
      url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
    }

    const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } })
    const data = await res.json()

    return NextResponse.json({
      success: true,
      data: {
        photos: data.photos.map((p: any) => ({
          id: p.id,
          url: p.src.medium,
          urls: { original: p.src.original, large: p.src.large, medium: p.src.medium, small: p.src.small },
          alt: p.alt,
          photographer: p.photographer,
          photographerUrl: p.photographer_url,
        })),
        page: data.page,
        perPage: data.per_page,
        totalResults: data.total_results,
        hasMore: !!data.next_page,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Error fetching images' }, { status: 500 })
  }
}
```

**Step 10: Commit**

```bash
git add webapp/src/app/api/admin/ webapp/src/app/api/images/
git commit -m "feat: add admin and images route handlers"
```

---

## Task 13: Actualizar AuthContext para usar Supabase

**Files:**
- Modify: `webapp/src/context/AuthContext.tsx`

**Step 1: Reescribir `webapp/src/context/AuthContext.tsx`**

```typescript
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, AuthState } from '@/types'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (authUser) {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.success) setUser(data.data)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.success) setUser(data.data)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (data.success) {
        setUser(data.data.user)
        return { success: true }
      }
      return { success: false, error: data.error || 'Error de autenticación' }
    } catch {
      return { success: false, error: 'Error de conexión' }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token: null,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

**Step 2: Commit**

```bash
git add webapp/src/context/AuthContext.tsx
git commit -m "feat: replace JWT auth context with Supabase auth"
```

---

## Task 14: Actualizar lib/api.ts para usar rutas relativas

**Files:**
- Modify: `webapp/src/lib/api.ts`

**Step 1: Cambiar todas las URLs a `/api/*` relativas**

Reemplazar el contenido de `webapp/src/lib/api.ts`:

```typescript
import { Product, Category, PaginatedResponse, ApiResponse } from '@/types'

// En Next.js, las API routes son relativas - no necesita URL externa
function getApiUrl() {
  if (typeof window === 'undefined') {
    // Server-side: usar URL absoluta
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
  // Client-side: relativa
  return ''
}

export interface GetProductsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  featured?: boolean
  random?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export async function getProducts(params?: GetProductsParams): Promise<PaginatedResponse<Product>> {
  const queryParams = new URLSearchParams()

  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.category) queryParams.append('category', params.category)
  if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString())
  if (params?.random !== undefined) queryParams.append('random', params.random.toString())
  if (params?.sort) queryParams.append('sort', params.sort)
  if (params?.order) queryParams.append('order', params.order)

  const url = `${getApiUrl()}/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) throw new Error('Failed to fetch products')

  return res.json()
}

export async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${getApiUrl()}/api/products/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  const data: ApiResponse<Product> = await res.json()
  return data.data
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const res = await fetch(`${getApiUrl()}/api/products/slug/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  const data: ApiResponse<Product> = await res.json()
  return data.data
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${getApiUrl()}/api/categories`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch categories')
  const data: ApiResponse<Category[]> = await res.json()
  return data.data
}
```

**Step 2: Agregar `NEXT_PUBLIC_APP_URL` al `.env.local`**

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 3: Commit**

```bash
git add webapp/src/lib/api.ts webapp/.env.local
git commit -m "feat: update API client to use relative Next.js routes"
```

---

## Task 15: Script de migración de datos MongoDB → Supabase

**Files:**
- Create: `webapp/scripts/migrate-from-mongo.ts`

**Step 1: Instalar dependencia para leer MongoDB dump**

```bash
cd webapp
npm install --save-dev mongodb
```

**Step 2: Crear `webapp/scripts/migrate-from-mongo.ts`**

```typescript
/**
 * Migration script: MongoDB → Supabase
 *
 * Run AFTER supabase start and prisma migrate dev
 *
 * Usage:
 *   1. Export from MongoDB:
 *      docker exec suvenirscl mongosh suvenirs --eval "JSON.stringify(db.categories.find().toArray())" > /tmp/categories.json
 *      docker exec suvenirscl mongosh suvenirs --eval "JSON.stringify(db.products.find().toArray())" > /tmp/products.json
 *      docker exec suvenirscl mongosh suvenirs --eval "JSON.stringify(db.quotes.find().toArray())" > /tmp/quotes.json
 *      docker exec suvenirscl mongosh suvenirs --eval "JSON.stringify(db.blogposts.find().toArray())" > /tmp/blogposts.json
 *      docker exec suvenirscl mongosh suvenirs --eval "JSON.stringify(db.users.find().toArray())" > /tmp/users.json
 *
 *   2. Copy files out of Docker:
 *      docker cp suvenirscl:/tmp/categories.json ./migration-data/
 *      docker cp suvenirscl:/tmp/products.json ./migration-data/
 *      docker cp suvenirscl:/tmp/quotes.json ./migration-data/
 *      docker cp suvenirscl:/tmp/blogposts.json ./migration-data/
 *      docker cp suvenirscl:/tmp/users.json ./migration-data/
 *
 *   3. Run this script:
 *      npx ts-node --esm scripts/migrate-from-mongo.ts
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DATA_DIR = path.join(process.cwd(), 'migration-data')

function readJson(filename: string) {
  const filepath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️  ${filename} not found, skipping`)
    return []
  }
  const content = fs.readFileSync(filepath, 'utf-8')
  return JSON.parse(content)
}

// Map MongoDB ObjectId strings to UUIDs (deterministic via crypto)
const idMap = new Map<string, string>()

function mongoIdToUuid(mongoId: string): string {
  if (idMap.has(mongoId)) return idMap.get(mongoId)!
  // Generate a UUID-like string from the mongoId
  const crypto = require('crypto')
  const hash = crypto.createHash('md5').update(mongoId).digest('hex')
  const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`
  idMap.set(mongoId, uuid)
  return uuid
}

async function migrateCategories() {
  console.log('\n📁 Migrating categories...')
  const categories = readJson('categories.json')

  // Sort by parent (root categories first)
  const roots = categories.filter((c: any) => !c.parent)
  const children = categories.filter((c: any) => c.parent)

  for (const cat of [...roots, ...children]) {
    const mongoId = cat._id?.$oid || cat._id
    const uuid = mongoIdToUuid(mongoId)

    try {
      await prisma.category.upsert({
        where: { id: uuid },
        create: {
          id: uuid,
          categoryId: cat.categoryId || `CAT-${mongoId.slice(-6)}`,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          image: cat.image || null,
          icon: cat.icon || null,
          parentId: cat.parent ? mongoIdToUuid(cat.parent?.$oid || cat.parent) : null,
          order: cat.order || 0,
          isActive: cat.isActive !== false,
          productCount: cat.productCount || 0,
          createdAt: cat.createdAt?.$date ? new Date(cat.createdAt.$date) : new Date(),
          updatedAt: cat.updatedAt?.$date ? new Date(cat.updatedAt.$date) : new Date(),
        },
        update: {},
      })
      console.log(`  ✅ ${cat.name}`)
    } catch (err: any) {
      console.error(`  ❌ ${cat.name}: ${err.message}`)
    }
  }
}

async function migrateProducts() {
  console.log('\n📦 Migrating products...')
  const products = readJson('products.json')

  for (const prod of products) {
    const mongoId = prod._id?.$oid || prod._id
    const uuid = mongoIdToUuid(mongoId)

    const categoryId = prod.category
      ? mongoIdToUuid(prod.category?.$oid || prod.category)
      : null

    try {
      await prisma.product.upsert({
        where: { id: uuid },
        create: {
          id: uuid,
          productId: prod.productId,
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          categoryId,
          quantity: prod.quantity || 0,
          price: prod.price || null,
          salePrice: prod.salePrice || null,
          currency: prod.currency || 'CLP',
          image: prod.image || '/placeholder-product.jpg',
          featured: prod.featured || false,
          isActive: prod.isActive !== false,
          createdAt: prod.createdAt?.$date ? new Date(prod.createdAt.$date) : new Date(),
          updatedAt: prod.updatedAt?.$date ? new Date(prod.updatedAt.$date) : new Date(),
        },
        update: {},
      })
      console.log(`  ✅ ${prod.name}`)
    } catch (err: any) {
      console.error(`  ❌ ${prod.name}: ${err.message}`)
    }
  }
}

async function migrateUsers() {
  console.log('\n👤 Migrating users...')
  const users = readJson('users.json')

  for (const user of users) {
    const mongoId = user._id?.$oid || user._id
    const uuid = mongoIdToUuid(mongoId)

    try {
      // Create in Supabase Auth with a temporary password (user will need to reset)
      const { data: authData, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'TempPassword123!', // User needs to reset password
        email_confirm: true,
        user_metadata: { migratedFromMongo: true },
      })

      if (error && !error.message.includes('already been registered')) {
        console.error(`  ❌ Auth ${user.email}: ${error.message}`)
        continue
      }

      const authId = authData?.user?.id || uuid

      // Create profile
      await prisma.profile.upsert({
        where: { id: authId },
        create: {
          id: authId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || null,
          company: user.company || null,
          role: user.role === 'admin' ? 'ADMIN' : 'USER',
          isActive: user.isActive !== false,
          createdAt: user.createdAt?.$date ? new Date(user.createdAt.$date) : new Date(),
        },
        update: {},
      })

      console.log(`  ✅ ${user.email} (role: ${user.role})`)
    } catch (err: any) {
      console.error(`  ❌ ${user.email}: ${err.message}`)
    }
  }
}

async function migrateQuotes() {
  console.log('\n📋 Migrating quotes...')
  const quotes = readJson('quotes.json')

  const statusMap: Record<string, string> = {
    pending: 'PENDING', contacted: 'CONTACTED', quoted: 'QUOTED',
    approved: 'APPROVED', rejected: 'REJECTED', completed: 'COMPLETED',
  }
  const sourceMap: Record<string, string> = {
    whatsapp: 'WHATSAPP', web: 'WEB', manual: 'MANUAL',
  }

  for (const quote of quotes) {
    const mongoId = quote._id?.$oid || quote._id
    const uuid = mongoIdToUuid(mongoId)

    try {
      await prisma.quote.upsert({
        where: { id: uuid },
        create: {
          id: uuid,
          quoteNumber: quote.quoteNumber,
          totalItems: quote.totalItems,
          totalUnits: quote.totalUnits,
          quotedAmount: quote.quotedAmount || 0,
          finalAmount: quote.finalAmount || 0,
          customerName: quote.customerName || null,
          customerEmail: quote.customerEmail || null,
          customerPhone: quote.customerPhone || null,
          customerCompany: quote.customerCompany || null,
          notes: quote.notes || null,
          status: (statusMap[quote.status] || 'PENDING') as any,
          source: (sourceMap[quote.source] || 'WEB') as any,
          createdAt: quote.createdAt?.$date ? new Date(quote.createdAt.$date) : new Date(),
          updatedAt: quote.updatedAt?.$date ? new Date(quote.updatedAt.$date) : new Date(),
          items: {
            create: (quote.items || []).map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              description: item.description || '',
            })),
          },
        },
        update: {},
      })
      console.log(`  ✅ ${quote.quoteNumber}`)
    } catch (err: any) {
      console.error(`  ❌ ${quote.quoteNumber}: ${err.message}`)
    }
  }
}

async function migrateBlogPosts() {
  console.log('\n📝 Migrating blog posts...')
  const posts = readJson('blogposts.json')

  // Need admin profile to assign as author
  const adminProfile = await prisma.profile.findFirst({ where: { role: 'ADMIN' } })
  if (!adminProfile) {
    console.warn('  ⚠️  No admin profile found, skipping blog posts')
    return
  }

  for (const post of posts) {
    const mongoId = post._id?.$oid || post._id
    const uuid = mongoIdToUuid(mongoId)

    try {
      await prisma.blogPost.upsert({
        where: { id: uuid },
        create: {
          id: uuid,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage || null,
          authorId: adminProfile.id,
          tags: post.tags || [],
          isPublished: post.isPublished || false,
          publishedAt: post.publishedAt?.$date ? new Date(post.publishedAt.$date) : null,
          views: post.views || 0,
          createdAt: post.createdAt?.$date ? new Date(post.createdAt.$date) : new Date(),
          updatedAt: post.updatedAt?.$date ? new Date(post.updatedAt.$date) : new Date(),
        },
        update: {},
      })
      console.log(`  ✅ ${post.title}`)
    } catch (err: any) {
      console.error(`  ❌ ${post.title}: ${err.message}`)
    }
  }
}

async function main() {
  console.log('🚀 Starting migration from MongoDB to Supabase...')
  console.log(`📂 Looking for data in: ${DATA_DIR}`)

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    console.log(`\n⚠️  Created migration-data/ directory.`)
    console.log('Run the export commands from the script header first, then re-run.')
    process.exit(1)
  }

  await migrateCategories()
  await migrateProducts()
  await migrateUsers()
  await migrateQuotes()
  await migrateBlogPosts()

  console.log('\n✅ Migration complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Step 3: Agregar script a package.json de webapp**

En `webapp/package.json`, agregar en `scripts`:
```json
"migrate": "dotenv -e .env.local -- tsx scripts/migrate-from-mongo.ts"
```

Instalar tsx:
```bash
cd webapp
npm install --save-dev tsx dotenv-cli
```

**Step 4: Commit**

```bash
git add webapp/scripts/ webapp/package.json webapp/package-lock.json
git commit -m "feat: add MongoDB to Supabase migration script"
```

---

## Task 16: Exportar datos de MongoDB y ejecutar migración

**Step 1: Iniciar MongoDB local**

```bash
docker start suvenirscl
```

**Step 2: Crear directorio de datos**

```bash
mkdir -p webapp/migration-data
```

**Step 3: Exportar colecciones de MongoDB**

```bash
docker exec suvenirscl mongosh suvenirs --quiet --eval "JSON.stringify(db.categories.find().toArray())" > webapp/migration-data/categories.json
docker exec suvenirscl mongosh suvenirs --quiet --eval "JSON.stringify(db.products.find().toArray())" > webapp/migration-data/products.json
docker exec suvenirscl mongosh suvenirs --quiet --eval "JSON.stringify(db.quotes.find().toArray())" > webapp/migration-data/quotes.json
docker exec suvenirscl mongosh suvenirs --quiet --eval "JSON.stringify(db.blogposts.find().toArray())" > webapp/migration-data/blogposts.json
docker exec suvenirscl mongosh suvenirs --quiet --eval "JSON.stringify(db.users.find().toArray())" > webapp/migration-data/users.json
```

**Step 4: Verificar que los archivos no están vacíos**

```bash
wc -c webapp/migration-data/*.json
# Todos deben tener más de 2 bytes (no solo "[]")
```

**Step 5: Ejecutar migración**

```bash
cd webapp
npm run migrate
```

Expected output: ✅ para cada categoría, producto, usuario, cotización, post.

**Step 6: Verificar en Prisma Studio**

```bash
cd webapp
npx prisma studio
# Abre http://localhost:5555 - verificar que los datos están ahí
```

**Step 7: Agregar migration-data/ a .gitignore**

```bash
echo "migration-data/" >> .gitignore
echo "webapp/migration-data/" >> .gitignore
```

---

## Task 17: Verificar que la app funciona en local

**Step 1: Asegurar que Supabase local está corriendo**

```bash
supabase status
# Debe mostrar: API URL: http://localhost:54321
```

**Step 2: Iniciar Next.js dev**

```bash
cd webapp
npm run dev
```

**Step 3: Verificar endpoints**

```bash
# Productos
curl http://localhost:3000/api/products | jq '.data | length'

# Categorías
curl http://localhost:3000/api/categories | jq '.data | length'

# Health check
curl http://localhost:3000/api/products?limit=1 | jq '.success'
```

Expected: `true` en todos

**Step 4: Probar login en el navegador**

1. Ir a `http://localhost:3000/gestion/login`
2. Hacer login con las credenciales del admin migrado
   - Password temporal: `TempPassword123!` (si fue migrado)
3. Verificar que redirige a `/gestion`

**Step 5: Probar panel de gestión**

- Verificar que `/gestion` carga el dashboard
- Verificar productos, categorías, cotizaciones

---

## Task 18: Limpiar api/ folder y actualizar configuración

**Step 1: Confirmar que todo funciona antes de borrar**

Hacer un último test completo de la app en local.

**Step 2: Eliminar carpeta api/**

```bash
cd /Users/jedante/Documents/suvenirs
rm -rf api/
```

**Step 3: Eliminar Dockerfiles del repo (ya no necesarios)**

```bash
rm -f webapp/Dockerfile webapp/Dockerfile.dev webapp/.dockerignore
```

**Step 4: Actualizar MEMORY.md**

Ver task siguiente (Task 19).

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: remove api/ folder - fully migrated to Next.js route handlers"
```

---

## Task 19: Actualizar MEMORY.md

Actualizar `/Users/jedante/.claude/projects/-Users-jedante-Documents-suvenirs/memory/MEMORY.md` con la nueva arquitectura:

```markdown
# Suvenirs Project Memory

## Arquitectura Post-Migración (2026-03-09)

**Stack:** Next.js 16 + Prisma + Supabase (PostgreSQL + Auth) — todo en un solo proyecto Vercel

### Estructura
- `webapp/` — único proyecto (frontend + API routes)
- `webapp/prisma/schema.prisma` — modelos de BD
- `webapp/src/app/api/` — Route Handlers (reemplazan Express)
- `webapp/src/lib/prisma.ts` — cliente Prisma singleton
- `webapp/src/lib/supabase/server.ts` — cliente Supabase SSR (server)
- `webapp/src/lib/supabase/client.ts` — cliente Supabase (browser)
- `webapp/src/middleware.ts` — protege rutas /gestion/*

### Comandos para correr en local
```bash
# 1. Iniciar Supabase local (necesita Docker)
supabase start

# 2. Iniciar Next.js
cd webapp && npm run dev
```

### Configuración Local
```env
# webapp/.env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<del output de supabase start>
SUPABASE_SERVICE_ROLE_KEY=<del output de supabase start>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
PEXELS_API_KEY=<tu key>
```

### URLs de Producción
- **Frontend + API:** https://suvenirs.vercel.app
- **Base de datos:** Supabase proyecto (configurar en Vercel env vars)

### Variables de entorno para Vercel (producción)
```
DATABASE_URL=<supabase pooler URL>
DIRECT_URL=<supabase direct URL>
NEXT_PUBLIC_SUPABASE_URL=<supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_APP_URL=https://suvenirs.vercel.app
PEXELS_API_KEY=<key>
```

### Prisma comandos
```bash
cd webapp
npx prisma migrate dev    # crear migración en local
npx prisma generate       # regenerar cliente
npx prisma studio         # explorar BD en browser
```
```

---

## Task 20: Configurar proyecto Supabase en producción y hacer deploy

**Step 1: Crear proyecto en Supabase** (si no existe)

1. Ir a https://supabase.com
2. Crear nuevo proyecto
3. Obtener: Project URL, anon key, service_role key, database URL

**Step 2: Ejecutar migraciones en producción**

```bash
cd webapp

# Apuntar a Supabase producción temporalmente
DATABASE_URL="<supabase-prod-pooler-url>" DIRECT_URL="<supabase-prod-direct-url>" npx prisma migrate deploy
```

**Step 3: Migrar datos a producción** (desde local)

Ejecutar script de migración apuntando a Supabase producción:
```bash
NEXT_PUBLIC_SUPABASE_URL=<prod-url> SUPABASE_SERVICE_ROLE_KEY=<prod-key> DATABASE_URL=<prod-db-url> DIRECT_URL=<prod-db-url> npm run migrate
```

**Step 4: Configurar variables en Vercel**

En Vercel dashboard → Settings → Environment Variables:
- `DATABASE_URL` = pooler URL de Supabase producción
- `DIRECT_URL` = direct URL de Supabase producción
- `NEXT_PUBLIC_SUPABASE_URL` = https://<project>.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
- `SUPABASE_SERVICE_ROLE_KEY` = service role key
- `NEXT_PUBLIC_APP_URL` = https://suvenirs.vercel.app
- `PEXELS_API_KEY` = tu key

**Step 5: Push a GitHub (Vercel auto-deploys)**

```bash
git push origin main
```

**Step 6: Verificar deploy**

```bash
curl https://suvenirs.vercel.app/api/products | jq '.success'
```

Expected: `true`

---

## Resumen de archivos nuevos

```
webapp/
├── prisma/
│   ├── schema.prisma              ← NEW
│   └── migrations/                ← NEW (auto-generated)
├── scripts/
│   └── migrate-from-mongo.ts      ← NEW
├── src/
│   ├── app/api/
│   │   ├── auth/login/route.ts    ← NEW
│   │   ├── auth/logout/route.ts   ← NEW
│   │   ├── auth/me/route.ts       ← NEW
│   │   ├── products/route.ts      ← NEW
│   │   ├── products/[id]/route.ts ← NEW
│   │   ├── products/slug/[slug]/route.ts ← NEW
│   │   ├── categories/route.ts    ← NEW
│   │   ├── categories/[id]/route.ts ← NEW
│   │   ├── categories/slug/[slug]/route.ts ← NEW
│   │   ├── quotes/route.ts        ← NEW
│   │   ├── quotes/stats/route.ts  ← NEW
│   │   ├── quotes/[id]/route.ts   ← NEW
│   │   ├── quotes/[id]/status/route.ts ← NEW
│   │   ├── blog/route.ts          ← NEW
│   │   ├── blog/[id]/route.ts     ← NEW
│   │   ├── blog/[id]/publish/route.ts ← NEW
│   │   ├── blog/slug/[slug]/route.ts ← NEW
│   │   ├── blog/tags/route.ts     ← NEW
│   │   ├── blog/admin/all/route.ts ← NEW
│   │   ├── blog/admin/[id]/route.ts ← NEW
│   │   ├── admin/dashboard/route.ts ← NEW
│   │   ├── admin/sales/monthly/route.ts ← NEW
│   │   ├── admin/users/route.ts   ← NEW
│   │   ├── admin/users/[id]/route.ts ← NEW
│   │   ├── admin/products/route.ts ← NEW
│   │   ├── admin/products/import/route.ts ← NEW
│   │   ├── admin/products/import-prices/route.ts ← NEW
│   │   └── images/route.ts        ← NEW
│   ├── lib/
│   │   ├── prisma.ts              ← NEW
│   │   ├── auth-helpers.ts        ← NEW
│   │   └── supabase/
│   │       ├── server.ts          ← NEW
│   │       └── client.ts          ← NEW
│   ├── context/
│   │   └── AuthContext.tsx        ← MODIFIED
│   ├── lib/
│   │   └── api.ts                 ← MODIFIED
│   └── middleware.ts              ← NEW

api/                               ← DELETED
```
