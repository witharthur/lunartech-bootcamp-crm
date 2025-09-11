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
