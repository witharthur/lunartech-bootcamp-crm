import {
  advanceToReady,
  getLeadById,
  logInteraction,
} from '../api/mockBackend';

export async function askFAQ(leadId, question) {
  // Defensive logging of user message (don't throw on localStorage errors)
  try {
    logInteraction(leadId, question, 'user', null, false);
  } catch (e) {
    console.warn(
      '[faqAgent] failed to log user message:',
      e && e.message ? e.message : e
    );
  }

  // Use Promise.race to implement a timeout for the /api/ask request (avoids AbortController AbortError bubbling)
  const timeoutMs = 8000;
  const fetchPromise = fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  }).then(async (res) => {
    if (!res.ok) throw new Error(`ask API error ${res.status}`);
    return res.json();
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutMs)
  );

  try {
    const data = await Promise.race([fetchPromise, timeoutPromise]);
    const { answer, confidence = 0, escalated = false } = data || {};
    let final = String(answer || '').trim();
    const lead = getLeadById(leadId);
    const userName = lead?.fullName?.split(' ')[0] || '';
    // Avoid repeated greetings and escalation
    const alreadyGreeted = /^hi|hello|hey|greetings/i.test(final);
    if (final && !alreadyGreeted && !final.startsWith('Thanks')) {
      final = `Hi${userName ? ' ' + userName : ''}, ${
        final.charAt(0).toUpperCase() + final.slice(1)
      }`;
    }
    // Only escalate if AI cannot answer at all (simulate world-ending scenario)
    if (
      escalated &&
      (!final || /^(i'm not fully confident|no answer|unknown)$/i.test(final))
    ) {
      final +=
        '\n\nI want to make sure you get the best help. An admissions specialist will follow up soon!';
    }
    // Payment CTA: respond instantly if user asks about payment
    try {
      const paymentIntent =
        /\b(pay|payment|checkout|card|stripe|tuition)\b/i.test(question);
      if (paymentIntent) {
        if (lead?.stage === 'New') {
          try {
            await advanceToReady(leadId);
          } catch {}
        }
        const readyNow = getLeadById(leadId)?.stage === 'Ready';
        if (readyNow && !/proceed to payment/i.test(final)) {
          final +=
            "\n\nWould you like to proceed to payment now? Just click the button below when you're ready.";
        }
      }
    } catch (e) {
      console.warn(
        '[faqAgent] payment intent handling failed:',
        e && e.message ? e.message : e
      );
    }
    // Friendly closing for general questions
    if (
      !/proceed to payment|admissions specialist|follow up soon/i.test(final)
    ) {
      final +=
        '\n\nLet me know if you have any other questions or need help with the next steps!';
    }
    try {
      logInteraction(leadId, final || '', 'assistant', confidence, !!escalated);
    } catch (e) {
      console.warn(
        '[faqAgent] failed to log assistant message:',
        e && e.message ? e.message : e
      );
    }
    return { answer: final, confidence, escalated: !!escalated, source: null };
  } catch (e) {
    if (timeoutId) clearTimeout(timeoutId);
    console.warn('[faqAgent] ask failed:', e && e.message ? e.message : e);
    const msg =
      "I'm not fully confident. We've logged your question for follow-up.";
    try {
      logInteraction(leadId, msg, 'assistant', 0, true);
    } catch (err) {
      console.warn(
        '[faqAgent] failed to log failure message:',
        err && err.message ? err.message : err
      );
    }
    return { answer: msg, confidence: 0, escalated: true, source: null };
  }
}
