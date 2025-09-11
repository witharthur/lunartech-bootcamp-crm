<<<<<<< HEAD
import React, { useEffect, useRef, useState } from 'react';
import { askFAQ } from '../ai/faqAgent';
import { getInteractions } from '../api/mockBackend';

import { getLeadById } from '../api/mockBackend';

export default function ChatWidget({ leadId, navigate }) {
  const [input, setInput] = useState('');
=======
import React, { useEffect, useRef, useState } from "react";
import { askFAQ } from "../ai/faqAgent";
import { getInteractions } from "../api/mockBackend";

import { getLeadById } from "../api/mockBackend";

export default function ChatWidget({ leadId, navigate }) {
  const [input, setInput] = useState("");
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const listRef = useRef(null);
<<<<<<< HEAD
  const stickRef = useRef(true);

  useEffect(() => {
    if (!leadId) return;
    // Always fetch latest history on mount or leadId change
    (async () => {
      const history = await getInteractions(leadId);
      setMessages(Array.isArray(history) ? history : []);
    })();
=======

  useEffect(() => {
    if (!leadId) return;
    const history = getInteractions(leadId);
    setMessages(history);
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
  }, [leadId]);

  useEffect(() => {
    // preload FAQ suggestions
<<<<<<< HEAD
    fetch('/api/faq')
      .then((r) => r.json())
      .then((qs) => Array.isArray(qs) && setSuggestions(qs.slice(0, 6)))
      .catch(() => {});
=======
    fetch("/api/faq").then((r) => r.json()).then((qs) => Array.isArray(qs) && setSuggestions(qs.slice(0, 6))).catch(() => {});
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
  }, []);

  // Auto-refresh to reflect nurture messages or parallel updates
  useEffect(() => {
    if (!leadId) return;
<<<<<<< HEAD
    let active = true;
    const interval = setInterval(async () => {
      const history = await getInteractions(leadId);
      if (active) setMessages(Array.isArray(history) ? history : []);
    }, 2000); // less frequent polling for performance
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [leadId]);

  useEffect(() => {
    if (stickRef.current) {
      const el = listRef.current;
      el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, typing]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    stickRef.current = nearBottom;
  }

=======
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

>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !leadId || sending) return;
    setSending(true);
<<<<<<< HEAD
    stickRef.current = true;
    setInput('');
    setTyping(true);
    try {
      await askFAQ(leadId, text);
      // After assistant reply, update messages
      const updated = await getInteractions(leadId);
      setMessages(Array.isArray(updated) ? updated : []);
    } catch (err) {
      // Show error in chat if needed
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          leadId,
          role: 'system',
          message: 'Failed to send message. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setTyping(false);
=======
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
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
      setSending(false);
    }
  }

  function handleKeyDown(e) {
<<<<<<< HEAD
    if (e.key === 'Enter' && !e.shiftKey) {
=======
    if (e.key === "Enter" && !e.shiftKey) {
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
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

<<<<<<< HEAD
  if (!leadId)
    return (
      <div className="chat-empty">Create an application to start chat.</div>
    );

  return (
    <div className="chat-panel">
      <div className="chat-history" ref={listRef} onScroll={onScroll}>
        {messages.map((m) => {
          const leadStage = getLeadById(leadId)?.stage;
          const showPaymentCTA =
            m.role === 'assistant' &&
            (leadStage === 'Ready' || leadStage === 'Paid');
          return (
            <div
              key={m.id}
              className={`msg-row ${
                m.role === 'user' ? 'align-right' : 'align-left'
              }`}
            >
              <div className={`msg-avatar ${m.role}`}>
                {m.role === 'user' ? 'U' : 'A'}
              </div>
              <div
                className={`msg msg-${m.role} ${
                  m.escalated ? 'msg-escalated' : ''
                }`}
              >
                <div className="msg-body">{m.message}</div>
                {showPaymentCTA && (
                  <div className="cta-inline">
                    <button
                      className="btn-primary"
                      onClick={async () => {
                        try {
                          const lead = getLeadById(leadId);
                          // Start checkout
                          const res = await fetch('/api/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ leadId: lead?.id }),
                          });
                          const data = await res.json();
                          if (data?.url) {
                            // Simulate payment success for demo
                            await fetch(`/api/db/leads/${lead?.id}/pay`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                stripeId: 'demo',
                                amount: 400000,
                              }),
                            });
                            window.location.href = data.url;
                            return;
                          }
                        } catch {}
                        // Fallback: update stage to Paid and refresh chat
                        await fetch(`/api/db/leads/${leadId}/pay`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            stripeId: 'demo',
                            amount: 400000,
                          }),
                        });
                        setTimeout(async () => {
                          const updated = await getInteractions(leadId);
                          setMessages(Array.isArray(updated) ? updated : []);
                        }, 1000);
                        navigate?.('/payment');
                      }}
                    >
                      Proceed to Payment 💳
                    </button>
                  </div>
                )}
                {m.escalated && (
                  <div className="msg-note">
                    {/* Only show specialist follow-up if truly escalated (world-ending) */}
                    We’ll have an admissions specialist follow up.
                  </div>
                )}
                <div className="msg-meta-small">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
=======
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
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="msg-row align-left">
            <div className="msg-avatar assistant">A</div>
            <div className="msg msg-assistant">
<<<<<<< HEAD
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
=======
              <div className="typing-dots"><span></span><span></span><span></span></div>
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="quick-suggest">
          {suggestions.map((q) => (
<<<<<<< HEAD
            <button
              key={q}
              className="suggest-chip"
              onClick={() => sendSuggestion(q)}
              disabled={sending}
            >
              {q}
            </button>
=======
            <button key={q} className="suggest-chip" onClick={() => sendSuggestion(q)} disabled={sending}>{q}</button>
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
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
<<<<<<< HEAD
          {sending ? 'Sending...' : 'Send'}
=======
          {sending ? "Sending..." : "Send"}
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
        </button>
      </form>
    </div>
  );
}
