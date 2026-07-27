import "dotenv/config";
import { writeDb } from "@/lib/admin/db";
import { createSeedDatabase } from "@/lib/admin/seed";
import { prisma } from "@/lib/prisma";

async function main() {
  const seed = createSeedDatabase();
  await writeDb(seed);
  console.log("Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
