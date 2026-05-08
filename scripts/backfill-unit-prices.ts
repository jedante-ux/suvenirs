import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const items = await prisma.quoteItem.findMany({
    where: { unitPrice: 0 },
    select: { id: true, productId: true },
  });

  console.log(`Items sin precio: ${items.length}`);
  if (items.length === 0) { await prisma.$disconnect(); return; }

  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { productId: { in: ids } },
    select: { productId: true, price: true, salePrice: true },
  });

  const priceMap = new Map(products.map((p) => [p.productId, p.salePrice ?? p.price ?? 0]));

  let updated = 0;
  for (const item of items) {
    const price = priceMap.get(item.productId) ?? 0;
    if (price > 0) {
      await prisma.quoteItem.update({ where: { id: item.id }, data: { unitPrice: price } });
      updated++;
      console.log(`  ✓ item ${item.id} → $${price}`);
    } else {
      console.log(`  - item ${item.id} (${item.productId}) sin precio en productos`);
    }
  }

  console.log(`\nActualizados: ${updated}/${items.length}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
