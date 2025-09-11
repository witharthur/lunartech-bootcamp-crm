<<<<<<< HEAD
import React, { useMemo, useState } from 'react';
import {
  advanceToReady,
  deleteLead,
  getLeads,
  proceedToPayment,
  scheduleOnboarding,
  sessionSummary,
} from '../api/mockBackend';
import { STAGES } from '../lib/pipeline';

export default function AdminDashboard({ version = 0 }) {
  const [leads, setLeads] = useState([]);

  function refresh() {
    // getLeads is now async, always fetch from server
    (async () => {
      const serverLeads = await getLeads();
      setLeads(Array.isArray(serverLeads) ? serverLeads : []);
    })();
  }

  React.useEffect(() => {
    function onUpdate() {
      refresh();
    }
    window.addEventListener('lt:db:updated', onUpdate);
    refresh(); // initial fetch
    return () => window.removeEventListener('lt:db:updated', onUpdate);
  }, []);

  function handleReady(id) {
    (async () => {
      await advanceToReady(id);
      refresh();
    })();
  }

  function handlePay(id) {
    (async () => {
      await proceedToPayment(id);
      refresh();
    })();
  }

  function handleSchedule(id, dt) {
    (async () => {
      try {
        await scheduleOnboarding(id, dt);
        refresh();
      } catch (e) {
        alert(e.message);
      }
    })();
  }

  function handleDelete(id) {
    if (window.confirm('Remove this lead and its interactions?')) {
      (async () => {
        await deleteLead(id);
        refresh();
      })();
    }
  }

  const counts = STAGES.reduce(
    (acc, s) => ({
      ...acc,
      [s]: (leads || []).filter((l) => l.stage === s).length,
    }),
    {}
  );
=======
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
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff

  return (
    <div className="admin-dashboard">
      <div className="stage-summary">
        {STAGES.map((s) => (
          <div key={s} className="stage-pill" data-stage={s}>
            <strong>{s}</strong> {counts[s] || 0}
          </div>
        ))}
<<<<<<< HEAD
        <button className="btn-secondary" onClick={refresh}>
          Refresh
        </button>
=======
        <button className="btn-secondary" onClick={refresh}>Refresh</button>
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
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
<<<<<<< HEAD
            <LeadRow
              key={l.id}
              lead={l}
              handleReady={handleReady}
              handlePay={handlePay}
              handleSchedule={handleSchedule}
              handleDelete={handleDelete}
            />
=======
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
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
          ))}
        </tbody>
      </table>
    </div>
  );
}

<<<<<<< HEAD
function LeadRow({
  lead,
  handleReady,
  handlePay,
  handleSchedule,
  handleDelete,
}) {
  const [summary, setSummary] = React.useState('');
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await sessionSummary(lead.id);
      if (mounted) setSummary(s);
    })();
    return () => {
      mounted = false;
    };
  }, [lead.id]);
  return (
    <tr>
      <td>{lead.fullName}</td>
      <td>{lead.email}</td>
      <td>{lead.stage}</td>
      <td>
        {lead.scheduledAt ? new Date(lead.scheduledAt).toLocaleString() : '-'}
      </td>
      <td>{summary}</td>
      <td>
        {lead.stage === 'New' && (
          <button
            className="btn-secondary"
            onClick={() => handleReady(lead.id)}
          >
            Mark Ready
          </button>
        )}
        {lead.stage === 'Ready' && (
          <button className="btn-primary" onClick={() => handlePay(lead.id)}>
            Proceed to Payment
          </button>
        )}
        {lead.stage === 'Paid' && (
          <ScheduleInput onSchedule={(dt) => handleSchedule(lead.id, dt)} />
        )}
        <button className="btn-secondary" onClick={() => handleDelete(lead.id)}>
          Remove
        </button>
      </td>
    </tr>
  );
}

function ScheduleInput({ onSchedule }) {
  const [value, setValue] = useState('');
=======
function ScheduleInput({ onSchedule }) {
  const [value, setValue] = useState("");
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
  return (
    <div className="schedule-input">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
<<<<<<< HEAD
      <button
        className="btn-primary"
        onClick={() => value && onSchedule(new Date(value).toISOString())}
      >
        Schedule
      </button>
=======
      <button className="btn-primary" onClick={() => value && onSchedule(new Date(value).toISOString())}>Schedule</button>
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
    </div>
  );
}
