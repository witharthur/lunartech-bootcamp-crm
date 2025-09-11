<<<<<<< HEAD
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
=======
import React from "react";
import AdminDashboard from "../components/AdminDashboard";
import { seedLeads } from "../api/mockBackend";

export default function AdminPage({ navigate }) {
  return (
    <div className="page-wrap">
      <div className="top-nav gradient">
        <a className="nav-link" href="/" onClick={(e)=>{e.preventDefault();navigate("/");}}>← Applicants</a>
        <div className="brand">Admin Dashboard</div>
        <button className="btn-secondary" onClick={() => seedLeads(12)}>Seed 12 Leads</button>
      </div>
      <div className="content-grid">
        <div className="panel-card shadow-lg">
          <AdminDashboard />
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
        </div>
      </div>
    </div>
  );
}
