-- CreateTable
CREATE TABLE "availabilityDateTime" (
    "id" SERIAL NOT NULL,
    "date_time" TEXT NOT NULL,
    "available_table_one" INTEGER NOT NULL,
    "available_table_two" INTEGER NOT NULL,
    "available_table_three" INTEGER NOT NULL,
    "available_table_four" INTEGER NOT NULL,
    "available_table_five" INTEGER NOT NULL,
    "restaurant_id" INTEGER NOT NULL,

    CONSTRAINT "availabilityDateTime_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "availabilityDateTime" ADD CONSTRAINT "availabilityDateTime_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
