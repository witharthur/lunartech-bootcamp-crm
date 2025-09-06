import React, { useEffect, useRef, useState } from "react";
import { askFAQ } from "../ai/faqAgent";
import { getInteractions } from "../api/mockBackend";

import { getLeadById } from "../api/mockBackend";

export default function ChatWidget({ leadId, navigate }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    if (!leadId) return;
    const history = getInteractions(leadId);
    setMessages(history);
  }, [leadId]);

  useEffect(() => {
    // preload FAQ suggestions
    fetch("/api/faq").then((r) => r.json()).then((qs) => Array.isArray(qs) && setSuggestions(qs.slice(0, 6))).catch(() => {});
  }, []);

  // Auto-refresh to reflect nurture messages or parallel updates
  useEffect(() => {
    if (!leadId) return;
    const interval = setInterval(() => {
      setMessages((prev) => {
        const next = getInteractions(leadId);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [leadId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !leadId || sending) return;
    setSending(true);
    // Optimistic append of user message
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        leadId,
        role: "user",
        message: text,
        confidence: null,
        escalated: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");
    setTyping(true);
    try {
      await askFAQ(leadId, text);
    } finally {
      setTyping(false);
      setMessages(getInteractions(leadId));
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  function sendSuggestion(q) {
    setInput(q);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      handleSend(fakeEvent);
    }, 0);
  }

  if (!leadId) return <div className="chat-empty">Create an application to start chat.</div>;

  return (
    <div className="chat-panel">
      <div className="chat-history" ref={listRef}>
        {messages.map((m) => {
          const showPaymentCTA = m.role === "assistant" && /proceed to payment/i.test(m.message) && getLeadById(leadId)?.stage === "Ready";
          return (
            <div key={m.id} className={`msg-row ${m.role === "user" ? "align-right" : "align-left"}`}>
              <div className={`msg-avatar ${m.role}`}>{m.role === "user" ? "U" : "A"}</div>
              <div className={`msg msg-${m.role} ${m.escalated ? "msg-escalated" : ""}`}>
                <div className="msg-body">{m.message}</div>
                {showPaymentCTA && (
                  <div className="cta-inline"><button className="btn-primary" onClick={()=>navigate?.("/payment")}>Proceed to Payment 💳</button></div>
                )}
                {m.escalated && <div className="msg-note">We’ll have an admissions specialist follow up.</div>}
                <div className="msg-meta-small">{new Date(m.createdAt).toLocaleTimeString()}</div>
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="msg-row align-left">
            <div className="msg-avatar assistant">A</div>
            <div className="msg msg-assistant">
              <div className="typing-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="quick-suggest">
          {suggestions.map((q) => (
            <button key={q} className="suggest-chip" onClick={() => sendSuggestion(q)} disabled={sending}>{q}</button>
          ))}
        </div>
      )}

      <form className="chat-input" onSubmit={handleSend}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about tuition, prerequisites, job guarantee, schedule... (Shift+Enter = newline)"
          rows={2}
        />
        <button className="btn-primary" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
