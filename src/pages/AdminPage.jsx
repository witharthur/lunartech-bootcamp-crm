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
        </div>
      </div>
    </div>
  );
}
