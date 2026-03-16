-- CreateTable stamping_types
CREATE TABLE IF NOT EXISTS "stamping_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL DEFAULT 40000,
  "minUnits" INTEGER,
  "maxUnits" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stamping_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stamping_types_code_key" ON "stamping_types"("code");

-- AlterTable quotes: add shipping and stamping columns
ALTER TABLE "quotes"
  ADD COLUMN IF NOT EXISTS "shippingService" TEXT,
  ADD COLUMN IF NOT EXISTS "shippingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "stampingTypeId" UUID,
  ADD COLUMN IF NOT EXISTS "stampingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_stampingTypeId_fkey"
  FOREIGN KEY ("stampingTypeId") REFERENCES "stamping_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable quote_items: add unitPrice column
ALTER TABLE "quote_items"
  ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
