const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function generateOwnerCode(label) {
  return sha256(label).slice(0, 4);
}

async function main() {
  const spots = [];

  for (let index = 1; index <= 60; index += 1) {
    const label = `P-${String(index).padStart(2, "0")}`;
    const ownerCode = generateOwnerCode(label);
    spots.push({ label, ownerCode });
  }

  await prisma.parkingSpot.createMany({
    data: spots.map((spot) => ({
      label: spot.label,
      ownerCodeHash: sha256(spot.ownerCode),
      active: true
    })),
    skipDuplicates: true
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
