-- Add publicToken as nullable first
ALTER TABLE "quotes" ADD COLUMN "publicToken" UUID;

-- Populate existing rows with a generated UUID
UPDATE "quotes" SET "publicToken" = gen_random_uuid() WHERE "publicToken" IS NULL;

-- Make it required and unique
ALTER TABLE "quotes" ALTER COLUMN "publicToken" SET NOT NULL;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_publicToken_key" UNIQUE ("publicToken");
