-- CreateTable
CREATE TABLE "restaurant" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "restaurant_name" VARCHAR(255) NOT NULL,
    "restaurant_location_address" VARCHAR(255) NOT NULL,
    "restaurant_location_city" VARCHAR(255) NOT NULL,
    "restaurant_location_lat" DECIMAL(8,6) NOT NULL,
    "restaurant_location_long" DECIMAL(9,6) NOT NULL,
    "restaurant_image" TEXT NOT NULL,
    "restaurant_opening_hours" VARCHAR(255) NOT NULL,
    "restaurant_facilities" VARCHAR(255) NOT NULL,
    "restaurant_cuisine" TEXT[],
    "restaurant_cost" INTEGER NOT NULL,
    "restaurant_start_date" TIMESTAMP(3) NOT NULL,
    "restaurant_end_date" TIMESTAMP(3) NOT NULL,
    "restaurant_start_time" TIME NOT NULL,
    "restaurant_end_time" TIME NOT NULL,
    "restaurant_average_seating_time" INTEGER NOT NULL,
    "restaurant_max_table_one" INTEGER NOT NULL,
    "restaurant_max_table_two" INTEGER NOT NULL,
    "restaurant_max_table_three" INTEGER NOT NULL,
    "restaurant_max_table_four" INTEGER NOT NULL,
    "restaurant_max_table_five" INTEGER NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "diner_user_email_key" ON "diner_user"("email");
