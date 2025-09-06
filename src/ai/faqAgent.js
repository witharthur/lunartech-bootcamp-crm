import { logInteraction } from "../api/mockBackend";

export async function askFAQ(leadId, question) {
  // Log user message immediately
  logInteraction(leadId, question, "user", null, false);

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    const { answer, confidence = 0, escalated = false, source } = data || {};
    const suffix = source?.question ? `\n\n(From FAQ: ${source.question})` : "";
    const final = `${answer || ""}${suffix}`.trim();
    logInteraction(leadId, final || "", "assistant", confidence, !!escalated);
    return { answer: final, confidence, escalated: !!escalated, source };
  } catch (e) {
    const msg = "I'm not fully confident. We've logged your question for follow-up.";
    logInteraction(leadId, msg, "assistant", 0, true);
    return { answer: msg, confidence: 0, escalated: true, source: null };
  }
}
