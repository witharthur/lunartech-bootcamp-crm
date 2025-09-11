const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('./prismaClient');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const COOKIE_NAME = 'lt_token';
const CSRF_COOKIE = 'lt_csrf';

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const base = { httpOnly: true, sameSite: 'lax' };
  if (isProd) base.secure = true;
  // Respect explicit domain if provided
  if (process.env.COOKIE_DOMAIN) base.domain = process.env.COOKIE_DOMAIN;
  // Set a sensible maxAge (7 days)
  base.maxAge = 7 * 24 * 60 * 60 * 1000;
  return base;
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch (e) { return null; }
}

async function verifyAdminCredentials(email, password) {
  // Prefer a persisted admin user with a hashed password
  try {
    const user = await prisma.user.findFirst({ where: { email, role: 'admin' } });
    if (user && user.hash) {
      const ok = await bcrypt.compare(password, user.hash);
      return ok ? user : null;
    }
  } catch (e) {
    console.warn('verifyAdminCredentials error', e && e.message ? e.message : e);
  }
  // Fallback to legacy env-based password
  if (password === ADMIN_PASSWORD) {
    return { id: 'admin', email, role: 'admin', name: 'Admin' };
  }
  return null;
}

function generateCsrfToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Login endpoint
router.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !role) return res.status(400).json({ error: 'email and role required' });

  if (role === 'admin') {
    try {
      const adminUser = await verifyAdminCredentials(email, password);
      if (!adminUser) return res.status(401).json({ error: 'invalid_credentials' });

      const user = { id: adminUser.id || 'admin', email, role: 'admin', name: adminUser.name || 'Admin' };
      const token = signToken(user);
      res.cookie(COOKIE_NAME, token, cookieOptions());
      // set CSRF token (readable by JS for subsequent requests)
      const csrf = generateCsrfToken();
      res.cookie(CSRF_COOKIE, csrf, { ...cookieOptions(), httpOnly: false });
      return res.json({ ok: true, user });
    } catch (e) {
      console.error('/api/auth/login admin error', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'server_error' });
    }
  }

  // applicant: find or create lead
  try {
    let lead = await prisma.lead.findFirst({ where: { email } });
    if (!lead) {
      lead = await prisma.lead.create({ data: { fullName: email.split('@')[0] || email, email, phone: '', country: '', why: '' } });
      await prisma.interaction.create({ data: { leadId: lead.id, role: 'assistant', message: `Thanks ${lead.fullName}! We've received your application.`, confidence: 1, escalated: false } });
    }
    const user = { id: lead.id, email: lead.email, role: 'applicant', name: lead.fullName };
    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions());
    // CSRF token for applicants too
    const csrf = generateCsrfToken();
    res.cookie(CSRF_COOKIE, csrf, { ...cookieOptions(), httpOnly: false });
    return res.json({ ok: true, user });
  } catch (e) {
    console.error('/api/auth/login error', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Me endpoint
router.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token) return res.json({ user: null });
    const data = verifyToken(token);
    if (!data) return res.json({ user: null });
    if (data.role === 'applicant') {
      const lead = await prisma.lead.findUnique({ where: { id: data.id } });
      if (lead) data.email = lead.email, data.name = lead.fullName;
    } else if (data.role === 'admin') {
      // try to refresh admin name from DB if exists
      try {
        const u = await prisma.user.findUnique({ where: { id: data.id } });
        if (u) data.name = u.name || data.name;
      } catch (e) {}
    }
    return res.json({ user: data });
  } catch (e) {
    return res.json({ user: null });
  }
});

// Logout (requires CSRF header)
router.post('/api/auth/logout', (req, res) => {
  const csrfHeader = req.get('x-csrf-token');
  const csrfCookie = req.cookies && req.cookies[CSRF_COOKIE];
  if (csrfCookie && csrfHeader && csrfCookie !== csrfHeader) return res.status(403).json({ error: 'invalid_csrf' });
  res.clearCookie(COOKIE_NAME, cookieOptions());
  // clear csrf cookie
  res.clearCookie(CSRF_COOKIE, { ...cookieOptions(), httpOnly: false });
  res.json({ ok: true });
});

// Middleware to require a role
function requireRole(role) {
  return async function (req, res, next) {
    try {
      const token = req.cookies && req.cookies[COOKIE_NAME];
      if (!token) return res.status(401).json({ error: 'not_authenticated' });
      const data = verifyToken(token);
      if (!data) return res.status(401).json({ error: 'invalid_token' });
      if (role && data.role !== role) return res.status(403).json({ error: 'forbidden' });
      req.user = data;
      next();
    } catch (e) {
      return res.status(500).json({ error: 'server_error' });
    }
  };
}

module.exports = router;
module.exports.requireRole = requireRole;
