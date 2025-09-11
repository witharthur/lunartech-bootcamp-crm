const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function connect() {
  try {
    await prisma.$connect();
    console.log('[dev] prisma connected');
  } catch (e) {
    console.warn('[dev] prisma connection failed:', e && e.message ? e.message : e);
  }
}

module.exports = { prisma, connect };
