import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.gpsEvent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.operator.deleteMany();

  const password = await bcrypt.hash("password123", 10);

  // Create 3 operators
  const op1 = await prisma.operator.create({
    data: {
      email: "mike@tacoking.com",
      name: "Mike Rodriguez",
      hashedPassword: password,
    },
  });

  const op2 = await prisma.operator.create({
    data: {
      email: "sarah@bbqbus.com",
      name: "Sarah Chen",
      hashedPassword: password,
    },
  });

  const op3 = await prisma.operator.create({
    data: {
      email: "james@fusionbites.com",
      name: "James Park",
      hashedPassword: password,
    },
  });

  // Create 3 trucks around Austin, TX with randomized positions
  const truck1 = await prisma.truck.create({
    data: {
      name: "Taco King",
      cuisineType: "Mexican",
      isLive: true,
      lastLat: 30.2672 + (Math.random() - 0.5) * 0.02,
      lastLng: -97.7431 + (Math.random() - 0.5) * 0.02,
      operatorId: op1.id,
    },
  });

  const truck2 = await prisma.truck.create({
    data: {
      name: "BBQ Bus",
      cuisineType: "BBQ",
      isLive: true,
      lastLat: 30.2672 + (Math.random() - 0.5) * 0.02,
      lastLng: -97.7431 + (Math.random() - 0.5) * 0.02,
      operatorId: op2.id,
    },
  });

  const truck3 = await prisma.truck.create({
    data: {
      name: "Fusion Bites",
      cuisineType: "Asian Fusion",
      isLive: false,
      lastLat: 30.2672 + (Math.random() - 0.5) * 0.02,
      lastLng: -97.7431 + (Math.random() - 0.5) * 0.02,
      operatorId: op3.id,
    },
  });

  // Create subscriptions - one per tier
  await prisma.subscription.create({
    data: {
      tier: "basic",
      priceUsd: 29,
      truckId: truck1.id,
    },
  });

  await prisma.subscription.create({
    data: {
      tier: "pro",
      priceUsd: 79,
      truckId: truck2.id,
    },
  });

  await prisma.subscription.create({
    data: {
      tier: "enterprise",
      priceUsd: 199,
      truckId: truck3.id,
    },
  });

  // Seed some GPS events and transactions for hotspot data
  const now = new Date();
  const trucks = [truck1, truck2, truck3];

  for (const truck of trucks) {
    // Create 5 GPS events per truck
    for (let i = 0; i < 5; i++) {
      await prisma.gpsEvent.create({
        data: {
          lat: (truck.lastLat ?? 30.2672) + (Math.random() - 0.5) * 0.005,
          lng: (truck.lastLng ?? -97.7431) + (Math.random() - 0.5) * 0.005,
          truckId: truck.id,
          createdAt: new Date(now.getTime() - i * 10000),
        },
      });
    }

    // Create 3 transactions per truck
    for (let i = 0; i < 3; i++) {
      await prisma.transaction.create({
        data: {
          itemName: ["Tacos", "Brisket Plate", "Ramen Bowl", "Loaded Fries", "Pho"][
            Math.floor(Math.random() * 5)
          ],
          price: parseFloat((Math.random() * 15 + 5).toFixed(2)),
          lat: (truck.lastLat ?? 30.2672) + (Math.random() - 0.5) * 0.003,
          lng: (truck.lastLng ?? -97.7431) + (Math.random() - 0.5) * 0.003,
          truckId: truck.id,
          createdAt: new Date(now.getTime() - i * 600000),
        },
      });
    }
  }

  console.log("Seed complete:");
  console.log("  3 operators (password: password123)");
  console.log("  - mike@tacoking.com (Basic tier)");
  console.log("  - sarah@bbqbus.com (Pro tier)");
  console.log("  - james@fusionbites.com (Enterprise tier)");
  console.log("  3 trucks around Austin, TX");
  console.log("  15 GPS events, 9 transactions");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
