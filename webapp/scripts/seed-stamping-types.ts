import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const types = [
    { code: 'SERI-100',  name: 'Serigrafía',          price: 40000, minUnits: 0,   maxUnits: 100 },
    { code: 'SERI-500',  name: 'Serigrafía masiva',    price: 35000, minUnits: 101, maxUnits: 500 },
    { code: 'LASER-100', name: 'Grabado láser',        price: 45000, minUnits: 0,   maxUnits: 100 },
    { code: 'BORDA-100', name: 'Bordado',              price: 50000, minUnits: 0,   maxUnits: 100 },
    { code: 'SUBLIM',    name: 'Sublimación',          price: 38000, minUnits: 0,   maxUnits: null },
    { code: 'TAMPOG',    name: 'Tampografía',          price: 36000, minUnits: 0,   maxUnits: null },
    { code: 'UV-PRINT',  name: 'Impresión UV',         price: 42000, minUnits: 0,   maxUnits: null },
  ];

  for (const t of types) {
    const result = await prisma.stampingType.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
    console.log(`✓ ${result.code} — ${result.name} ($${result.price.toLocaleString('es-CL')})`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
