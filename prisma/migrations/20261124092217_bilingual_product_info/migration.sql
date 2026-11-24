-- AlterTable
ALTER TABLE "Producer" ADD COLUMN     "craftBn" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "handlingInfoBn" TEXT,
ADD COLUMN     "packagingInfoBn" TEXT,
ADD COLUMN     "processingInfoBn" TEXT,
ADD COLUMN     "storageInfoBn" TEXT;
