import React, { useEffect, useState } from "react";
import LeadForm from "../components/LeadForm";
import ChatWidget from "../components/ChatWidget";
import { getLeadById } from "../api/mockBackend";
import { getCurrentLeadId } from "../lib/session";

export default function ApplicantPage({ navigate }) {
  const [lead, setLead] = useState(null);

  useEffect(() => {
    const id = getCurrentLeadId();
    if (id) {
      const l = getLeadById(id);
      if (l) setLead(l);
    }
  }, []);

  function goPayment() { navigate("/payment"); }
  function goSchedule() { navigate("/schedule"); }

  return (
    <div className="page-wrap">
      <div className="top-nav">
        <div className="brand">LunarTech CRM</div>
      </div>
      <div className="content-grid">
        <div className="panel-card">
          <h2 className="panel-title">Applicant Portal</h2>
          {!lead && <LeadForm onCreated={setLead} />}
          {lead && (
            <div>
              <div className="status-bar">
                <span className="status-pill">Stage: {lead.stage}</span>
                {lead.stage === "Ready" && (
                  <button className="btn-primary" onClick={goPayment}>Proceed to Payment 💳</button>
                )}
                {lead.stage === "Paid" && (
                  <button className="btn-primary" onClick={goSchedule}>Schedule Onboarding 📅</button>
                )}
                {lead.stage === "Scheduled" && lead.scheduledAt && (
                  <span className="status-pill">Onboarding: {new Date(lead.scheduledAt).toLocaleString()}</span>
                )}
              </div>
              <h3 className="section-title">Chat with Admissions</h3>
              <ChatWidget leadId={lead.id} navigate={navigate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
