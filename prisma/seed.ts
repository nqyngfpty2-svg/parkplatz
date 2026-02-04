import { PrismaClient } from "@prisma/client";
import { sha256 } from "../lib/hash";

const prisma = new PrismaClient();

function generateOwnerCode(label: string) {
  return sha256(label).slice(0, 4);
}

async function main() {
  const spots = [] as { label: string; ownerCode: string }[];
  for (let index = 1; index <= 60; index += 1) {
    const label = `P-${String(index).padStart(2, "0")}`;
    const ownerCode = generateOwnerCode(label);
    spots.push({ label, ownerCode });
  }

  for (const spot of spots) {
    await prisma.parkingSpot.upsert({
      where: { label: spot.label },
      update: {
        ownerCodeHash: sha256(spot.ownerCode),
        active: true
      },
      create: {
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
