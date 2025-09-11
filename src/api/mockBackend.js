<<<<<<< HEAD
// All functions now use server endpoints only, no localStorage or mock data

export async function createLead({ fullName, email, phone, country, why }) {
  const res = await fetch('/api/db/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, phone, country, why }),
  });
  if (!res.ok) throw new Error('Failed to create lead');
  return await res.json();
}

export async function getLeads() {
  const res = await fetch('/api/db/leads');
  if (!res.ok) return [];
  return await res.json();
}

export async function getLeadById(id) {
  const res = await fetch(`/api/db/leads/${id}`);
  if (!res.ok) return null;
  return await res.json();
}

export async function updateStage(id, targetStage) {
  const res = await fetch(`/api/db/leads/${id}/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: targetStage }),
  });
  if (!res.ok) throw new Error('Failed to update stage');
  return await res.json();
}

export async function advanceToReady(id) {
  return await updateStage(id, 'Ready');
}

export async function proceedToPayment(id) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId: id }),
  });
  if (!res.ok) throw new Error('Failed to create checkout session');
  return await res.json();
}

export async function scheduleOnboarding(id, isoDatetime) {
  const res = await fetch(`/api/db/leads/${id}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isoDatetime }),
  });
  if (!res.ok) throw new Error('Failed to schedule onboarding');
  return await res.json();
}

export async function deleteLead(id) {
  const res = await fetch(`/api/db/leads/${id}/delete`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to delete lead');
  return true;
}

export async function logInteraction(
  leadId,
  message,
  role = 'assistant',
  confidence = null,
  escalated = false
) {
  const res = await fetch('/api/db/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId, role, message, confidence, escalated }),
  });
  if (!res.ok) throw new Error('Failed to log interaction');
  return await res.json();
}

export async function getInteractions(leadId) {
  const res = await fetch(
    `/api/db/interactions?leadId=${encodeURIComponent(leadId)}`
  );
  if (!res.ok) return [];
  return await res.json();
}

export async function sessionSummary(leadId) {
  const history = await getInteractions(leadId);
  const q = history.filter((h) => h.role === 'user').length;
  const a = history.filter((h) => h.role === 'assistant').length;
  const esc = history.filter((h) => h.escalated).length;
  return `Q: ${q}, A: ${a}, escalations: ${esc}`;
}
=======
import { STAGES, normalizeStage, canAdvance } from "../lib/pipeline";

const hasLocalStorage = () => typeof window !== "undefined" && !!window.localStorage;
const STORAGE_KEY = "lt_crm_mock_db_v1";

function nowISO() {
  return new Date().toISOString();
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return fallback;
  }
}

const defaultDB = () => ({
  leads: [], // {id, fullName, email, phone, country, why, stage, createdAt, updatedAt, scheduledAt}
  interactions: [], // {id, leadId, role: 'user'|'assistant'|'system', message, confidence, escalated, createdAt}
});

function load() {
  if (hasLocalStorage()) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? safeParse(raw, defaultDB()) : defaultDB();
  }
  return defaultDB();
}

function save(db) {
  if (hasLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

const db = load();
const nurtureTimers = new Map(); // leadId -> timeouts

function scheduleNurture(leadId) {
  // Clear existing
  const timers = nurtureTimers.get(leadId) || [];
  timers.forEach((t) => clearTimeout(t));

  const t1 = setTimeout(() =>
    logInteraction(leadId, "Welcome to LunarTech! We're excited you applied. Reply with any questions.", "assistant", 1, false), 500);
  const t2 = setTimeout(() =>
    logInteraction(leadId, "Here are program highlights: AI engineering, LLM workflows, and real projects.", "assistant", 1, false), 3000);
  const t3 = setTimeout(() =>
    logInteraction(leadId, "Next steps: if you're ready, click 'Proceed to Payment' in your portal.", "assistant", 1, false), 6000);

  nurtureTimers.set(leadId, [t1, t2, t3]);
}

export function createLead({ fullName, email, phone, country, why }) {
  const lead = {
    id: uid(),
    fullName: fullName?.trim() || "",
    email: email?.trim() || "",
    phone: phone?.trim() || "",
    country: country?.trim() || "",
    why: (why || "").trim(),
    stage: STAGES[0],
    createdAt: nowISO(),
    updatedAt: nowISO(),
    scheduledAt: null,
  };
  db.leads.push(lead);
  save(db);
  // Immediate confirmation (simulated)
  logInteraction(lead.id, `Thanks ${lead.fullName || "there"}! We've received your application.`, "assistant", 1, false);
  scheduleNurture(lead.id);
  return lead;
}

export function getLeads() {
  // Return copy sorted by recency
  return [...db.leads].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getLeadById(id) {
  return db.leads.find((l) => l.id === id) || null;
}

export function updateStage(id, targetStage) {
  const lead = getLeadById(id);
  if (!lead) throw new Error("Lead not found");
  const target = normalizeStage(targetStage);
  if (!canAdvance(lead.stage, target)) throw new Error("Invalid stage transition");
  lead.stage = target;
  lead.updatedAt = nowISO();
  save(db);
  return lead;
}

export function advanceToReady(id) {
  return updateStage(id, "Ready");
}

export function proceedToPayment(id) {
  // mock success
  const updated = updateStage(id, "Paid");
  logInteraction(id, "Payment received successfully. Thank you!", "system", 1, false);
  return updated;
}

export function scheduleOnboarding(id, isoDatetime) {
  const lead = getLeadById(id);
  if (!lead) throw new Error("Lead not found");
  if (lead.stage !== "Paid") throw new Error("Lead must be Paid before scheduling");
  lead.scheduledAt = isoDatetime;
  lead.stage = "Scheduled";
  lead.updatedAt = nowISO();
  save(db);
  logInteraction(id, `Onboarding scheduled for ${isoDatetime}.`, "system", 1, false);
  return lead;
}

export function logInteraction(leadId, message, role = "assistant", confidence = null, escalated = false) {
  const interaction = {
    id: uid(),
    leadId,
    role,
    message,
    confidence,
    escalated,
    createdAt: nowISO(),
  };
  db.interactions.push(interaction);
  save(db);
  return interaction;
}

export function getInteractions(leadId) {
  return db.interactions.filter((i) => i.leadId === leadId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

export function sessionSummary(leadId) {
  const history = getInteractions(leadId);
  const q = history.filter((h) => h.role === "user").length;
  const a = history.filter((h) => h.role === "assistant").length;
  const esc = history.filter((h) => h.escalated).length;
  return `Q: ${q}, A: ${a}, escalations: ${esc}`;
}

export function seedLeads(count = 12) {
  const names = [
    "Alex Johnson","Priya Sharma","Chen Li","Fatima Noor","Diego Alvarez","Mina Park",
    "Liam O'Connor","Sofia Rossi","Jonas Müller","Amara N'diaye","Yuki Tanaka","Oliver Smith",
  ];
  for (let i = 0; i < count; i++) {
    const fullName = names[i % names.length] + (i >= names.length ? ` ${i}` : "");
    const email = `${fullName.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`;
    createLead({ fullName, email, phone: "+1000000000", country: "US", why: "Interested in AI." });
  }
  return getLeads();
}

export function resetAll() {
  db.leads.length = 0;
  db.interactions.length = 0;
  save(db);
  nurtureTimers.forEach((arr) => arr.forEach(clearTimeout));
  nurtureTimers.clear();
}
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
