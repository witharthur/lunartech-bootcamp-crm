import React, { useEffect, useState } from "react";
import { getLeadById, scheduleOnboarding } from "../api/mockBackend";
import { getCurrentLeadId } from "../lib/session";

export default function SchedulePage({ navigate }) {
  const [lead, setLead] = useState(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    const id = getCurrentLeadId();
    const l = id && getLeadById(id);
    setLead(l || null);
  }, []);

  function doSchedule() {
    if (!lead || !value) return;
    try {
      scheduleOnboarding(lead.id, new Date(value).toISOString());
      navigate("/");
    } catch (e) {
      alert(e.message);
    }
  }

  if (!lead) return <div className="page-wrap"><div className="panel-card">No active application.</div></div>;

  return (
    <div className="page-wrap">
      <div className="top-nav"><div className="brand">Schedule Onboarding</div></div>
      <div className="content-grid">
        <div className="panel-card shadow-lg">
          <h3 className="panel-title">Select time</h3>
          <div className="schedule-input">
            <input type="datetime-local" value={value} onChange={(e)=>setValue(e.target.value)} />
            <button className="btn-primary" onClick={doSchedule}>Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
}
