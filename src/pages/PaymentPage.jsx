import React, { useEffect, useState } from "react";
import { getLeadById, proceedToPayment } from "../api/mockBackend";
import { getCurrentLeadId } from "../lib/session";

export default function PaymentPage({ navigate }) {
  const [lead, setLead] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const id = getCurrentLeadId();
    const l = id && getLeadById(id);
    setLead(l || null);
  }, []);

  async function pay(e) {
    e.preventDefault();
    if (!lead) return;
    setProcessing(true);
    await Promise.resolve(proceedToPayment(lead.id));
    setProcessing(false);
    navigate("/schedule");
  }

  if (!lead) return <div className="page-wrap"><div className="panel-card">No active application. Go back and apply first.</div></div>;

  return (
    <div className="page-wrap">
      <div className="top-nav"><div className="brand">Payment</div></div>
      <div className="content-grid">
        <div className="panel-card shadow-lg">
          <h3 className="panel-title">Pay tuition deposit for {lead.fullName}</h3>
          <form className="pay-form" onSubmit={pay}>
            <div className="field"><label>Name on card</label><input required /></div>
            <div className="field-row">
              <div className="field"><label>Card number</label><input required placeholder="4242 4242 4242 4242" /></div>
              <div className="field"><label>Exp</label><input required placeholder="12/34" /></div>
              <div className="field"><label>CVC</label><input required placeholder="123" /></div>
            </div>
            <button className="btn-primary" disabled={processing} type="submit">{processing ? "Processing…" : "Pay $4,000"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
