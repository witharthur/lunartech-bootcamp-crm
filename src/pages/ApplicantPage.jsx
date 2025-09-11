<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { getLeadById } from '../api/mockBackend';
import ChatWidget from '../components/ChatWidget';
import LeadForm from '../components/LeadForm';
import { getCurrentLeadId } from '../lib/session';
=======
import React, { useEffect, useState } from "react";
import LeadForm from "../components/LeadForm";
import ChatWidget from "../components/ChatWidget";
import { getLeadById } from "../api/mockBackend";
import { getCurrentLeadId } from "../lib/session";
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff

export default function ApplicantPage({ navigate }) {
  const [lead, setLead] = useState(null);

  useEffect(() => {
<<<<<<< HEAD
    let force = false;
    try {
      const params =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : null;
      force = !!(params && params.get('forceForm') === '1');
    } catch (e) {
      /* ignore */
    }

    if (force) {
      setLead(null);
      return;
    }

    const id = getCurrentLeadId();
    if (id) {
      (async () => {
        const l = await getLeadById(id);
        setLead(l || null);
      })();
    } else {
      setLead(null);
    }
  }, []);

  async function goPayment() {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead?.id }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch {}
    navigate('/payment');
  }
  function goSchedule() {
    navigate('/schedule');
  }
=======
    const id = getCurrentLeadId();
    if (id) {
      const l = getLeadById(id);
      if (l) setLead(l);
    }
  }, []);

  function goPayment() { navigate("/payment"); }
  function goSchedule() { navigate("/schedule"); }
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff

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
<<<<<<< HEAD
                {lead.stage === 'Ready' && (
                  <button className="btn-primary" onClick={goPayment}>
                    Proceed to Payment 💳
                  </button>
                )}
                {lead.stage === 'Paid' && (
                  <button className="btn-primary" onClick={goSchedule}>
                    Schedule Onboarding 📅
                  </button>
                )}
                {lead.stage === 'Scheduled' && lead.scheduledAt && (
                  <span className="status-pill">
                    Onboarding: {new Date(lead.scheduledAt).toLocaleString()}
                  </span>
=======
                {lead.stage === "Ready" && (
                  <button className="btn-primary" onClick={goPayment}>Proceed to Payment 💳</button>
                )}
                {lead.stage === "Paid" && (
                  <button className="btn-primary" onClick={goSchedule}>Schedule Onboarding 📅</button>
                )}
                {lead.stage === "Scheduled" && lead.scheduledAt && (
                  <span className="status-pill">Onboarding: {new Date(lead.scheduledAt).toLocaleString()}</span>
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
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
