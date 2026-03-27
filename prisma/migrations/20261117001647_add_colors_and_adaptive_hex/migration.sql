-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CaseColor" ADD VALUE 'blush';
ALTER TYPE "CaseColor" ADD VALUE 'sage';
ALTER TYPE "CaseColor" ADD VALUE 'lavender';
ALTER TYPE "CaseColor" ADD VALUE 'sand';
ALTER TYPE "CaseColor" ADD VALUE 'white';
ALTER TYPE "CaseColor" ADD VALUE 'titanium';
ALTER TYPE "CaseColor" ADD VALUE 'burgundy';

-- AlterTable
ALTER TABLE "Configuration" ADD COLUMN     "customColorHex" TEXT;
