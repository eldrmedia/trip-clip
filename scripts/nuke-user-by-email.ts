// scripts/nuke-user-by-email.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx scripts/nuke-user-by-email.ts you@example.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`No user found for ${email}`);
    return;
  }

  const uid = user.id;
  console.log(`Found user ${uid} for ${email}. Deleting related auth + app data…`);

  // Delete NextAuth artifacts (order matters for FKs)
  await prisma.account.deleteMany({ where: { userId: uid } });
  await prisma.session.deleteMany({ where: { userId: uid } });
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  // Optional: delete app data tied to this user (uncomment what you need)
  await prisma.gmailMessage.deleteMany({ where: { userId: uid } });
  await prisma.activityLog.deleteMany({ where: { userId: uid } });
  await prisma.expense.deleteMany({ where: { userId: uid } });
  await prisma.report.deleteMany({ where: { userId: uid } });
  await prisma.trip.deleteMany({ where: { userId: uid } });
  // If you have other tables with userId FKs, add them here.

  // Finally, delete the User
  await prisma.user.delete({ where: { id: uid } });

  console.log(`Done. User ${email} removed. You can now Sign in with Google.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
