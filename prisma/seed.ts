import { PrismaClient } from "@prisma/client";
import { sha256 } from "../lib/hash";

const prisma = new PrismaClient();

  return sha256(label).slice(0, 4);
}

async function main() {
  for (let index = 1; index <= 60; index += 1) {
    const label = `P-${String(index).padStart(2, "0")}`;
    const ownerCode = generateOwnerCode(label);
    spots.push({ label, ownerCode });
  }

  const createdSpots = [] as { label: string; ownerCode: string }[];
  const existingLabels = [] as string[];

  for (const spot of spots) {

        label: spot.label,
        ownerCodeHash: sha256(spot.ownerCode),
        active: true
      }
    });
    createdSpots.push(spot);
  }

  if (createdSpots.length > 0) {
    console.log("Owner-Codes (einmalig ausgeben, sicher verteilen):");
    for (const spot of createdSpots) {
      console.log(`${spot.label}: ${spot.ownerCode}`);
    }
  }

  if (existingLabels.length > 0) {
    console.log("Bereits vorhandene Parkplätze übersprungen:");
    console.log(existingLabels.join(", "));
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
