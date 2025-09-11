const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { prisma } = require('./prismaClient');

router.post('/api/seed', async (req, res) => {
  try {
    const count = Number(req.body?.count || 12);
    const names = [
      "Alex Johnson","Priya Sharma","Chen Li","Fatima Noor","Diego Alvarez","Mina Park",
      "Liam O'Connor","Sofia Rossi","Jonas Müller","Amara N'diaye","Yuki Tanaka","Oliver Smith",
    ];
    const created = [];
    for (let i = 0; i < count; i++) {
      const fullName = names[i % names.length] + (i >= names.length ? ` ${i}` : "");
      const email = `${fullName.toLowerCase().replace(/[^a-z]+/g, '.')}${i}@example.com`;
      const lead = await prisma.lead.create({ data: { fullName, email, phone: '+1000000000', country: 'US', why: 'Seeded lead' } });
      await prisma.interaction.create({ data: { leadId: lead.id, role: 'assistant', message: `Thanks ${lead.fullName}! We've received your application.`, confidence: 1, escalated: false } });
      created.push(lead);
    }

    // Optionally create an admin user using ADMIN_PASSWORD env if present
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || null;
      if (adminPassword) {
        const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (!existing) {
          const hash = await bcrypt.hash(adminPassword, 10);
          const user = await prisma.user.create({ data: { email: adminEmail, name: 'Admin', role: 'admin', hash } });
          console.log('[seed] created admin user', user.email);
        }
      }
    } catch (e) {
      console.warn('[seed] admin user creation failed:', e && e.message ? e.message : e);
    }

    res.json({ createdCount: created.length, leads: created.map(l => ({ id: l.id, fullName: l.fullName, email: l.email })) });
  } catch (e) {
    console.error('/api/seed error', e && e.message ? e.message : e);
    res.status(500).json({ error: 'seed_failed' });
  }
});

module.exports = router;
