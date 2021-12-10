/*
  Warnings:

  - You are about to drop the `availabilityDateTime` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `diner_user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reservations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `restaurant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `restaurant_user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "availabilityDateTime" DROP CONSTRAINT "availabilityDateTime_restaurant_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_diner_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_restaurant_id_fkey";

-- DropTable
DROP TABLE "availabilityDateTime";

-- DropTable
DROP TABLE "diner_user";

-- DropTable
DROP TABLE "reservations";

-- DropTable
DROP TABLE "restaurant";

-- DropTable
DROP TABLE "restaurant_user";
