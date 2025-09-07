const fetch = global.fetch || require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'http://localhost:3000';
async function waitForServer(url, timeout = 60000) {
  const start = Date.now();
  process.stdout.write(`Waiting for ${url}`);
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) { console.log('\nServer ready'); return true; }
    } catch (e) {
      process.stdout.write('.');
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('\nTimed out waiting for server');
  return false;
}

async function inspectUser(email) {
  const u = await prisma.user.findUnique({ where: { email } });
  console.log('DB User:', { id: u.id, email: u.email, failedCount: u.failedCount, isLocked: u.isLocked });
  const histories = await prisma.loginHistory.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'asc' } });
  console.log('LoginHistory count:', histories.length);
  histories.slice(-5).forEach(h => console.log(` - ${h.createdAt.toISOString()} success=${h.success} ip=${h.ip}`));
  const sessions = await prisma.session.findMany({ where: { userId: u.id } });
  console.log('Session count:', sessions.length);
}

async function postLogin(email, password) {
  const res = await fetch(BASE + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });
  let json = null;
  try { json = await res.json(); } catch (e) {}
  console.log('POST /api/login', email, '=>', res.status, json && json.message ? json.message : JSON.stringify(json));
  return { status: res.status, body: json };
}

(async ()=>{
  const serverOk = await waitForServer(BASE + '/');
  if (!serverOk) { process.exit(1); }

  const TEST_EMAIL = 'user01@example.com';
  const CORRECT_PW = 'password1111';
  const WRONG_PW = 'wrongpassword';

  console.log('\nInitial state:');
  await inspectUser(TEST_EMAIL);

  console.log('\n--- Performing 5 failed login attempts to trigger lock ---');
  for (let i=1;i<=5;i++){
    await postLogin(TEST_EMAIL, WRONG_PW);
    await new Promise(r=>setTimeout(r,500));
    const u = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    console.log(`After attempt ${i}: failedCount=${u.failedCount}, isLocked=${u.isLocked}`);
  }

  console.log('\nState after failures:');
  await inspectUser(TEST_EMAIL);

  console.log('\n--- Resetting lock in DB to test successful login ---');
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  await prisma.user.update({ where: { id: user.id }, data: { isLocked: false, failedCount: 0 } });
  console.log('Lock cleared.');
  await inspectUser(TEST_EMAIL);

  console.log('\n--- Performing successful login ---');
  await postLogin(TEST_EMAIL, CORRECT_PW);
  await new Promise(r=>setTimeout(r,500));
  console.log('\nState after successful login:');
  await inspectUser(TEST_EMAIL);

  await prisma.$disconnect();
  console.log('\nTest script completed.');
})().catch(async (e)=>{ console.error('ERROR', e); await prisma.$disconnect(); process.exit(1); });
