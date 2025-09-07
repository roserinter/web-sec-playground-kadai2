const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, password: true, failedCount: true, isLocked: true, role: true, lastLoginAt: true },
    });
    console.log('USERS:');
    console.log(users);

    const histories = await prisma.loginHistory.findMany({ take: 20 });
    console.log('\nLOGIN_HISTORY (up to 20):');
    console.log(histories);

    const sessions = await prisma.session.findMany({ take: 20 });
    console.log('\nSESSIONS (up to 20):');
    console.log(sessions);
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
