# Design: Migración a Vercel + Supabase

**Fecha:** 2026-03-09
**Objetivo:** Eliminar Railway reduciendo costos, consolidar frontend y backend en un solo proyecto Vercel con Supabase como base de datos.

## Motivación

- Eliminar costo de Railway (~$5-20/mes)
- Un solo repositorio/proyecto desplegado en Vercel
- Simplificar infraestructura a dos servicios: Vercel + Supabase

## Arquitectura final

```
suvenirs/
├── webapp/                        ← único proyecto Vercel
│   ├── prisma/
│   │   ├── schema.prisma          ← modelos PostgreSQL
│   │   └── migrations/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/               ← Route Handlers (reemplaza Express)
│   │   │   │   ├── products/
│   │   │   │   ├── categories/
│   │   │   │   ├── auth/
│   │   │   │   ├── quotes/
│   │   │   │   ├── admin/
│   │   │   │   └── blog/
│   │   │   └── ...páginas existentes
│   │   ├── lib/
│   │   │   ├── prisma.ts          ← cliente Prisma singleton
│   │   │   └── supabase.ts        ← cliente Supabase SSR
│   │   └── middleware.ts          ← auth middleware Next.js
│   └── package.json
└── docs/
```

La carpeta `api/` se elimina del repositorio.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (existente) |
| API | Next.js Route Handlers (App Router) |
| ORM | Prisma |
| Base de datos | Supabase PostgreSQL |
| Auth | Supabase Auth + @supabase/ssr |
| Hosting | Vercel (único) |

## Schema de base de datos

### Modelos Prisma (traducción desde Mongoose)

- `Profile` — linked a `auth.users` de Supabase, guarda rol, teléfono, empresa, direcciones
- `Product` — mismo campo, `categoryId` como FK UUID
- `Category` — self-relation para categorías padre/hijo
- `Quote` + `QuoteItem` — Quote principal con items en tabla separada
- `BlogPost` — FK a `Profile`

## Auth

- Supabase Auth maneja registro/login con email+password
- Roles (`admin`/`user`) en tabla `profiles`
- Next.js `middleware.ts` protege `/gestion/*` — redirige a login si no hay sesión
- Frontend usa `@supabase/ssr` con cookies para SSR correcto
- Admin inicial creado via script seed

## Desarrollo local

- Supabase CLI con `supabase start` levanta PostgreSQL + Auth local en Docker
- Variables de entorno en `webapp/.env.local`:
  ```
  DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
  DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres
  NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<local-service-key>
  ```
- `npm run dev` desde `webapp/` levanta todo

## Migración de datos

1. `mongodump` desde Docker local (MongoDB)
2. Script TypeScript de transformación: ObjectIds → UUIDs, adaptar estructura a Prisma
3. Usuarios migrados a Supabase Auth via Admin API
4. `prisma db seed` carga datos transformados

## Variables de entorno producción (Vercel)

```
DATABASE_URL=<supabase-pooler-url>
DIRECT_URL=<supabase-direct-url>
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
JWT_SECRET=<kept-for-any-legacy>
```

## Decisiones tomadas

- **Prisma sobre Drizzle/Supabase client:** Curva mínima viniendo de Mongoose, mejor tipado, migraciones ordenadas
- **Supabase Auth sobre JWT propio:** Reduce código de auth considerablemente, funciones de reset de password gratis
- **Un solo proyecto Vercel:** Elimina complejidad de CORS entre servicios y gestión de múltiples deployments
