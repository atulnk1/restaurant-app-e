-- CreateTable
CREATE TABLE "timeStamp" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "date" DATE NOT NULL,
    "timestampWithTimeZone" TIMESTAMPTZ NOT NULL,
    "timeWithoutTimeZone" TIME NOT NULL,
    "timeWithTimeZone" TIMETZ NOT NULL,

    CONSTRAINT "timeStamp_pkey" PRIMARY KEY ("id")
);
