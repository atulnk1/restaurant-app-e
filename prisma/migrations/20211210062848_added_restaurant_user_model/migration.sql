-- CreateTable
CREATE TABLE "restaurant_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,

    CONSTRAINT "restaurant_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_user_email_key" ON "restaurant_user"("email");
