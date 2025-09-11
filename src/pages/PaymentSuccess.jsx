import React, { useEffect } from "react";
import { getCurrentLeadId } from "../lib/session";
import { getLeadById, proceedToPayment } from "../api/mockBackend";

export default function PaymentSuccess({ navigate }) {
  useEffect(() => {
    const id = getCurrentLeadId();
    const l = id && getLeadById(id);
    if (l) {
      proceedToPayment(l.id);
      navigate("/schedule");
    } else {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="page-wrap"><div className="panel-card">Processing payment success…</div></div>
  );
}
