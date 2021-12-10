/*
  Warnings:

  - You are about to drop the column `first_name` on the `restaurant_user` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `restaurant_user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "restaurant_user" DROP COLUMN "first_name",
DROP COLUMN "last_name";
