-- CreateEnum
CREATE TYPE "UnavailablePref" AS ENUM ('CALL', 'REMOVE');

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN "onUnavailable" "UnavailablePref" NOT NULL DEFAULT 'CALL';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "onUnavailable" "UnavailablePref" NOT NULL DEFAULT 'CALL';
