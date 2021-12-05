/*
  Warnings:

  - You are about to drop the column `date` on the `reservations` table. All the data in the column will be lost.
  - Added the required column `display_date` to the `reservations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `system_date` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "date",
ADD COLUMN     "display_date" TEXT NOT NULL,
ADD COLUMN     "system_date" TIMESTAMP(3) NOT NULL;
