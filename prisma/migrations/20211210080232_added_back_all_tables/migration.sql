-- CreateTable
CREATE TABLE "restaurant" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "restaurant_name" VARCHAR(255) NOT NULL,
    "restaurant_description" TEXT NOT NULL DEFAULT E'',
    "restaurant_location_address" VARCHAR(255) NOT NULL,
    "restaurant_location_city" VARCHAR(255) NOT NULL,
    "restaurant_location_country" VARCHAR(255) NOT NULL,
    "restaurant_location_lat" DECIMAL(8,6) NOT NULL,
    "restaurant_location_long" DECIMAL(9,6) NOT NULL,
    "restaurant_image" TEXT[],
    "restaurant_opening_hours" VARCHAR(255) NOT NULL,
    "restaurant_facilities" TEXT[],
    "restaurant_cuisine" TEXT[],
    "restaurant_cuisine_search" TEXT NOT NULL DEFAULT E'none',
    "restaurant_cost" INTEGER NOT NULL,
    "restaurant_start_date" TIMESTAMP(3) NOT NULL,
    "restaurant_end_date" TIMESTAMP(3) NOT NULL,
    "restaurant_start_time" TEXT NOT NULL,
    "restaurant_end_time" TEXT NOT NULL,
    "restaurant_average_seating_time" INTEGER NOT NULL,
    "restaurant_max_table_one" INTEGER NOT NULL,
    "restaurant_max_table_two" INTEGER NOT NULL,
    "restaurant_max_table_three" INTEGER NOT NULL,
    "restaurant_max_table_four" INTEGER NOT NULL,
    "restaurant_max_table_five" INTEGER NOT NULL,
    "restauarant_featured" BOOLEAN NOT NULL DEFAULT false,
    "restaurant_status" TEXT NOT NULL DEFAULT E'open',

    CONSTRAINT "restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diner_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,

    CONSTRAINT "diner_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "party_size" INTEGER NOT NULL,
    "display_date" TEXT NOT NULL,
    "system_date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "reservation_status" TEXT NOT NULL DEFAULT E'booked',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "diner_id" TEXT NOT NULL,
    "restaurant_id" INTEGER NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "restaurant_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,

    CONSTRAINT "restaurant_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diner_user_email_key" ON "diner_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_user_email_key" ON "restaurant_user"("email");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_diner_id_fkey" FOREIGN KEY ("diner_id") REFERENCES "diner_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilityDateTime" ADD CONSTRAINT "availabilityDateTime_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
