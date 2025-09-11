const KEY = 'lt_current_user';

export function setCurrentUser(user) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(KEY, JSON.stringify(user)); } catch {}
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try { const raw = window.localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function clearCurrentUser() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(KEY); } catch {}
}

export async function refreshCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const j = await res.json();
    const user = j?.user || null;
    if (user) setCurrentUser(user); else clearCurrentUser();
    return user;
  } catch (e) {
    return null;
  }
}

export function isAdmin() {
  const u = getCurrentUser();
  return u && u.role === 'admin';
}

export function isApplicant() {
  const u = getCurrentUser();
  return u && u.role === 'applicant';
}

export default { setCurrentUser, getCurrentUser, clearCurrentUser, isAdmin, isApplicant, refreshCurrentUser };
