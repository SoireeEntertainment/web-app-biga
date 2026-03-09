-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('WEB', 'MANUAL');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "source" "OrderSource" NOT NULL DEFAULT 'WEB';
ALTER TABLE "Order" ADD COLUMN "deliverySlot" TEXT;
