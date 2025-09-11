import React, { useState } from 'react';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage({ navigate }) {
  const [version, setVersion] = useState(0);
  return (
    <div className="page-wrap">
      <div className="top-nav gradient">
        <div className="brand">Admin Dashboard</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              try {
                localStorage.removeItem('lt_current_user');
              } catch {}
              window.location.href = '/';
            }}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="content-grid">
        <div className="panel-card shadow-lg">
          <AdminDashboard version={version} />
        </div>
      </div>
    </div>
  );
}
