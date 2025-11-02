-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PhoneModel" ADD VALUE 'iphone13pro';
ALTER TYPE "PhoneModel" ADD VALUE 'iphone13promax';
ALTER TYPE "PhoneModel" ADD VALUE 'iphone14pro';
ALTER TYPE "PhoneModel" ADD VALUE 'iphone14promax';
ALTER TYPE "PhoneModel" ADD VALUE 'iphone15pro';
ALTER TYPE "PhoneModel" ADD VALUE 'iphone15promax';
ALTER TYPE "PhoneModel" ADD VALUE 'iphone16pro';
ALTER TYPE "PhoneModel" ADD VALUE 'iphone16promax';
