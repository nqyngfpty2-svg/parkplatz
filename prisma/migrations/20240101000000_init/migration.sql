-- CreateTable
CREATE TABLE "ParkingSpot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "ownerCodeHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "Release_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "ParkingSpot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "cancelTokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "ParkingSpot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSpot_label_key" ON "ParkingSpot"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Release_spotId_date_key" ON "Release"("spotId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_spotId_date_key" ON "Reservation"("spotId", "date");
