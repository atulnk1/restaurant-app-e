/*
  Warnings:

  - The `restaurant_facilities` column on the `restaurant` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "restaurant" DROP COLUMN "restaurant_facilities",
ADD COLUMN     "restaurant_facilities" TEXT[];
