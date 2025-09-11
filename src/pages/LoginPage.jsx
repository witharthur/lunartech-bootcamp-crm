import React, { useState } from 'react';
import { refreshCurrentUser, setCurrentUser } from '../lib/auth';

export default function LoginPage({ navigate, redirectTo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  async function handleSubmit(e) {
    e && e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'admin', password }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.error || 'Login failed');
        setLoading(false);
        return;
      }
      // refresh current user from server and navigate
      await refreshCurrentUser();
      window.location.href = redirectTo || '/admin';
    } catch (e) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="top-nav gradient">
        <div className="brand">LunarTech CRM — Admin Login</div>
      </div>
      <div className="content-grid">
        <div
          className="panel-card shadow-lg"
          style={{
            maxWidth: 480,
            margin: '0 auto',
            padding: '32px 32px 24px 32px',
            borderRadius: '18px',
            boxShadow: '0 8px 32px rgba(60,60,120,0.08)',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontWeight: 700,
              fontSize: '2rem',
              letterSpacing: '-1px',
            }}
          >
            Admin Login
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>
            Sign in to access your admin dashboard and settings.
          </p>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <div className="field">
              <label style={{ fontWeight: 600, marginBottom: 6 }}>
                Admin Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                style={{
                  fontSize: '1rem',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
            <div className="field">
              <label style={{ fontWeight: 600, marginBottom: 6 }}>
                Password{' '}
                <span
                  style={{
                    fontWeight: 400,
                    color: '#9ca3af',
                    fontSize: '0.95em',
                  }}
                >
                  (default: <b>admin</b>)
                </span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Admin password"
                style={{
                  fontSize: '1rem',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
            {error && (
              <div style={{ color: '#ef4444', marginTop: 8, fontWeight: 500 }}>
                {error}
              </div>
            )}
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  fontSize: '1.1rem',
                  padding: '12px 0',
                  borderRadius: '10px',
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  fontSize: '1.1rem',
                  padding: '12px 0',
                  borderRadius: '10px',
                }}
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  setError('');
                }}
              >
                Clear
              </button>
            </div>
          </form>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button
              className="btn-link"
              type="button"
              onClick={() => setShowRecovery(true)}
              style={{
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Forgot password?
            </button>
          </div>
          {showRecovery && (
            <div
              className="panel-card"
              style={{
                marginTop: 16,
                padding: 16,
                background: '#f9fafb',
                borderRadius: 10,
              }}
            >
              <h4>Password Recovery</h4>
              <p>Enter your admin email to receive a password reset link.</p>
              <input
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="admin@example.com"
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  marginBottom: 8,
                }}
              />
              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  setRecoverySent(true);
                }}
              >
                Send Recovery Email
              </button>
              {recoverySent && (
                <div style={{ color: '#2563eb', marginTop: 8 }}>
                  Recovery email sent (simulated).
                </div>
              )}
              <button
                className="btn-secondary"
                type="button"
                style={{ marginTop: 8 }}
                onClick={() => setShowRecovery(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
