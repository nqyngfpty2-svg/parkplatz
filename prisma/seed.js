
  return sha256(label).slice(0, 4);
}

async function main() {

  for (let index = 1; index <= 60; index += 1) {
    const label = `P-${String(index).padStart(2, "0")}`;
    const ownerCode = generateOwnerCode(label);
    spots.push({ label, ownerCode });
  }


        label: spot.label,
        ownerCodeHash: sha256(spot.ownerCode),
        active: true
      }
    });

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
