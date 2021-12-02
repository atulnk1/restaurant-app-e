/*
  Warnings:

  - The `restaurant_image` column on the `restaurant` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "restaurant" DROP COLUMN "restaurant_image",
ADD COLUMN     "restaurant_image" TEXT[];
