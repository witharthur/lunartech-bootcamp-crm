import React from "react";

export default function PaymentCancel({ navigate }) {
  return (
    <div className="page-wrap">
      <div className="top-nav"><div className="brand">Payment</div></div>
      <div className="content-grid">
        <div className="panel-card">
          <h3 className="panel-title">Payment canceled</h3>
          <p>You can try again anytime.</p>
          <button className="btn-secondary" onClick={() => navigate("/")}>Back to portal</button>
        </div>
      </div>
    </div>
  );
}
