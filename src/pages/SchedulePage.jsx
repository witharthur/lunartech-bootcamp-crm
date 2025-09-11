import React, { useEffect, useState, useRef } from "react";
import { getLeadById, scheduleOnboarding } from "../api/mockBackend";
import { getCurrentLeadId } from "../lib/session";

export default function SchedulePage({ navigate }) {
  const [lead, setLead] = useState(null);
  const [value, setValue] = useState("");
  const [calLink, setCalLink] = useState("");
  const embedLoaded = useRef(false);

  useEffect(() => {
    const id = getCurrentLeadId();
    const l = id && getLeadById(id);
    setLead(l || null);
  }, []);

  useEffect(() => {
    fetch("/api/cal/config").then(r=>r.json()).then(j=>setCalLink(j?.link || ""));
  }, []);

  useEffect(() => {
    if (!calLink || embedLoaded.current) return;
    embedLoaded.current = true;
    const s = document.createElement("script");
    s.src = "https://app.cal.com/embed/embed.js";
    s.async = true;
    document.body.appendChild(s);
    const onMsg = (e) => {
      const t = e?.data?.type || e?.data?.eventName;
      if (t === "cal:bookingSuccessful") {
        const when = e?.data?.payload?.booking?.startTime || new Date().toISOString();
        try { lead && scheduleOnboarding(lead.id, when); } catch {}
        navigate("/");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [calLink, lead, navigate]);

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
          {calLink ? (
            <div className="cal-embed-container">
              <div
                className="cal-inline"
                data-cal-link={calLink.replace(/^https?:\/\//, "")}
                style={{width:"100%",height:"680px",border:0}}
              />
            </div>
          ) : (
            <div className="schedule-input">
              <input type="datetime-local" value={value} onChange={(e)=>setValue(e.target.value)} />
              <button className="btn-primary" onClick={doSchedule}>Schedule</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
