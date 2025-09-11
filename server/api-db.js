const express = require('express');
const router = express.Router();
const { prisma } = require('./prismaClient');

// Create lead
router.post('/api/db/leads', async (req, res) => {
  try {
    const { fullName, email, phone, country, why } = req.body || {};
    const lead = await prisma.lead.create({ data: { fullName: fullName || '', email: email || '', phone: phone || '', country: country || '', why: why || '' } });
    // initial interaction
    await prisma.interaction.create({ data: { leadId: lead.id, role: 'assistant', message: `Thanks ${lead.fullName || 'there'}! We've received your application.`, confidence: 1, escalated: false } });
    res.json(lead);
  } catch (e) {
    console.error('/api/db/leads create error', e && e.message ? e.message : e);
    res.status(500).json({ error: 'db_error' });
  }
});

// Get leads
router.get('/api/db/leads', async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json(leads);
  } catch (e) {
    res.status(500).json({ error: 'db_error' });
  }
});

// Get lead by id
router.get('/api/db/leads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: 'not_found' });
    res.json(lead);
  } catch (e) {
    res.status(500).json({ error: 'db_error' });
  }
});

// Log interaction
router.post('/api/db/interactions', async (req, res) => {
  try {
    const { leadId, role, message, confidence, escalated } = req.body || {};
    const i = await prisma.interaction.create({ data: { leadId, role: role || 'assistant', message: message || '', confidence: confidence == null ? undefined : Number(confidence), escalated: !!escalated } });
    res.json(i);
  } catch (e) {
    res.status(500).json({ error: 'db_error' });
  }
});

// Get interactions for lead
router.get('/api/db/interactions', async (req, res) => {
  try {
    const leadId = req.query.leadId;
    if (!leadId) return res.status(400).json({ error: 'leadId required' });
    const items = await prisma.interaction.findMany({ where: { leadId }, orderBy: { createdAt: 'asc' } });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'db_error' });
  }
});

// Update lead stage
router.post('/api/db/leads/:id/stage', async (req, res) => {
  try {
    const id = req.params.id;
    const { stage } = req.body || {};
    const updated = await prisma.lead.update({ where: { id }, data: { stage } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'db_error' });
  }
});

// Schedule onboarding: set scheduledAt and stage to Scheduled
router.post('/api/db/leads/:id/schedule', async (req, res) => {
  try {
    const id = req.params.id;
    const { isoDatetime } = req.body || {};
    if (!isoDatetime) return res.status(400).json({ error: 'isoDatetime required' });
    const updated = await prisma.lead.update({ where: { id }, data: { scheduledAt: new Date(isoDatetime), stage: 'Scheduled' } });
    await prisma.interaction.create({ data: { leadId: id, role: 'system', message: `Onboarding scheduled for ${isoDatetime}.`, confidence: 1, escalated: false } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'db_error' });
  }
});

// Mark as paid
router.post('/api/db/leads/:id/pay', async (req, res) => {
  try {
    const id = req.params.id;
    const { stripeId, amount } = req.body || {};
    await prisma.payment.create({ data: { leadId: id, stripeId: stripeId || null, amount: amount || 400000, status: 'succeeded', currency: 'usd' } });
    const updated = await prisma.lead.update({ where: { id }, data: { stage: 'Paid' } });
    await prisma.interaction.create({ data: { leadId: id, role: 'system', message: 'Payment received successfully. Thank you!', confidence: 1, escalated: false } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'db_error' });
  }
});

// Delete lead and related interactions/payments
router.post('/api/db/leads/:id/delete', async (req, res) => {
  try {
    const id = req.params.id;
    await prisma.interaction.deleteMany({ where: { leadId: id } });
    await prisma.payment.deleteMany({ where: { leadId: id } });
    await prisma.lead.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
