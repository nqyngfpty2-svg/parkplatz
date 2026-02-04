import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sha256 } from "../lib/hash";

const prisma = new PrismaClient();

function generateOwnerCode() {
  return crypto.randomBytes(6).toString("hex");
}

async function main() {
  const spots = [] as { label: string; ownerCode: string }[];
  for (let index = 1; index <= 20; index += 1) {
    const label = `P-${String(index).padStart(2, "0")}`;
    const ownerCode = generateOwnerCode();
    spots.push({ label, ownerCode });
  }

  for (const spot of spots) {
    await prisma.parkingSpot.create({
      data: {
        label: spot.label,
        ownerCodeHash: sha256(spot.ownerCode),
        active: true
      }
    });
  }

  console.log("Owner-Codes (einmalig ausgeben, sicher verteilen):");
  for (const spot of spots) {
    console.log(`${spot.label}: ${spot.ownerCode}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
