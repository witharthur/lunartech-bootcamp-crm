const KEY = "lt_current_lead_id";

export function setCurrentLeadId(id) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, id); } catch {}
}

export function getCurrentLeadId() {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(KEY); } catch { return null; }
}
