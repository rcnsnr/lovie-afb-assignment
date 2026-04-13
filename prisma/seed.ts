import { PrismaClient, RequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const DEMO_PASSWORD_HASH = await bcrypt.hash("demo1234", 10);

  // Seed users: Alice, Bob, Carol
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: { phone: "+15550001111" },
    create: {
      email: "alice@example.com",
      password: DEMO_PASSWORD_HASH,
      name: "Alice",
      phone: "+15550001111",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: { phone: "+15550002222" },
    create: {
      email: "bob@example.com",
      password: DEMO_PASSWORD_HASH,
      name: "Bob",
      phone: "+15550002222",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: { phone: "+15550003333" },
    create: {
      email: "carol@example.com",
      password: DEMO_PASSWORD_HASH,
      name: "Carol",
      phone: "+15550003333",
    },
  });

  // AC5 fixture: a PENDING request with expiresAt in the past
  // status must be PENDING (not EXPIRED) so getEffectiveStatus() is exercised in E2E
  const pastExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  await prisma.paymentRequest.upsert({
    where: {
      // Use a stable deterministic ID so re-seeding is idempotent
      id: "00000000-0000-0000-0000-000000000001",
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      requesterId: bob.id,
      recipientId: alice.id,
      amountMinorUnits: 2500, // $25.00
      note: "Expired fixture for AC5 testing",
      status: RequestStatus.PENDING,
      expiresAt: pastExpiry,
    },
  });

  console.log("Seed complete:", {
    users: [alice.email, bob.email, carol.email],
    ac5Fixture: "PENDING request with expiresAt 24h ago",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
