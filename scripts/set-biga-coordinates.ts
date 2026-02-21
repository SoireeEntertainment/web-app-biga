/**
 * Imposta le coordinate del ristorante Biga Villanova d'Asti (Piazza Alfieri 32).
 * Esegui: npx tsx scripts/set-biga-coordinates.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const BIGA_VILLANOVA_LAT = 44.9422651;
const BIGA_VILLANOVA_LNG = 7.9373876;

async function main() {
  const r = await prisma.restaurant.update({
    where: { slug: "biga-villanova" },
    data: {
      restaurantLat: BIGA_VILLANOVA_LAT,
      restaurantLng: BIGA_VILLANOVA_LNG,
    },
  });
  console.log(
    `Coordinate impostate per "${r.name}" (${r.slug}): lat=${r.restaurantLat}, lng=${r.restaurantLng}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
