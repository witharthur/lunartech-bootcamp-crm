import React, { useMemo, useState } from "react";
import { STAGES } from "../lib/pipeline";
import {
  getLeads,
  advanceToReady,
  proceedToPayment,
  scheduleOnboarding,
  sessionSummary,
} from "../api/mockBackend";

export default function AdminDashboard() {
  const [tick, setTick] = useState(0);
  const leads = useMemo(() => getLeads(), [tick]);

  function refresh() {
    setTick((t) => t + 1);
  }

  function handleReady(id) {
    advanceToReady(id);
    refresh();
  }

  function handlePay(id) {
    proceedToPayment(id);
    refresh();
  }

  function handleSchedule(id, dt) {
    try {
      scheduleOnboarding(id, dt);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  const counts = STAGES.reduce((acc, s) => ({ ...acc, [s]: leads.filter((l) => l.stage === s).length }), {});

  return (
    <div className="admin-dashboard">
      <div className="stage-summary">
        {STAGES.map((s) => (
          <div key={s} className="stage-pill" data-stage={s}>
            <strong>{s}</strong> {counts[s] || 0}
          </div>
        ))}
        <button className="btn-secondary" onClick={refresh}>Refresh</button>
      </div>
      <table className="leads-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Stage</th>
            <th>Scheduled</th>
            <th>Summary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td>{l.fullName}</td>
              <td>{l.email}</td>
              <td>{l.stage}</td>
              <td>{l.scheduledAt ? new Date(l.scheduledAt).toLocaleString() : "-"}</td>
              <td>{sessionSummary(l.id)}</td>
              <td>
                {l.stage === "New" && (
                  <button className="btn-secondary" onClick={() => handleReady(l.id)}>Mark Ready</button>
                )}
                {l.stage === "Ready" && (
                  <button className="btn-primary" onClick={() => handlePay(l.id)}>Proceed to Payment</button>
                )}
                {l.stage === "Paid" && (
                  <ScheduleInput onSchedule={(dt) => handleSchedule(l.id, dt)} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleInput({ onSchedule }) {
  const [value, setValue] = useState("");
  return (
    <div className="schedule-input">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="btn-primary" onClick={() => value && onSchedule(new Date(value).toISOString())}>Schedule</button>
    </div>
  );
}
