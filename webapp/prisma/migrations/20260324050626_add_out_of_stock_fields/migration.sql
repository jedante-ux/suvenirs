-- AlterTable
ALTER TABLE "kit_items" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "kits" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "proveedor" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "outOfStock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replacesItemId" UUID;

-- AlterTable
ALTER TABLE "stamping_types" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;
