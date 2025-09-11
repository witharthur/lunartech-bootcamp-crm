import React, { useState } from "react";
import { createLead } from "../api/mockBackend";
import { setCurrentLeadId } from "../lib/session";

export default function LeadForm({ onCreated }) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", country: "", why: "" });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const lead = await Promise.resolve(createLead(form));
    setCreated(lead);
    setSubmitting(false);
    setCurrentLeadId(lead.id);
    onCreated?.(lead);
  }

  if (created) {
    return (
      <div className="lead-confirmation">
        <h3>Application received</h3>
        <p>Thanks {created.fullName}! We've emailed a confirmation and will be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <h3>Apply to the AI Bootcamp</h3>
      <div className="field">
        <label>Full name</label>
        <input name="fullName" value={form.fullName} onChange={handleChange} required />
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />
      </div>
      <div className="field">
        <label>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} />
      </div>
      <div className="field">
        <label>Country</label>
        <input name="country" value={form.country} onChange={handleChange} />
      </div>
      <div className="field">
        <label>Why are you applying?</label>
        <textarea name="why" value={form.why} onChange={handleChange} rows={4} />
      </div>
      <button className="btn-primary" type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
