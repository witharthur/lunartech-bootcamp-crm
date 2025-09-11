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

  return (
    <div className="admin-dashboard">
      <div className="stage-summary">
        {STAGES.map((s) => (
          <div key={s} className="stage-pill" data-stage={s}>
            <strong>{s}</strong> {counts[s] || 0}
          </div>
        ))}
        <button className="btn-secondary" onClick={refresh}>
          Refresh
        </button>
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
            <LeadRow
              key={l.id}
              lead={l}
              handleReady={handleReady}
              handlePay={handlePay}
              handleSchedule={handleSchedule}
              handleDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
  return (
    <div className="schedule-input">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        className="btn-primary"
        onClick={() => value && onSchedule(new Date(value).toISOString())}
      >
        Schedule
      </button>
    </div>
  );
}
