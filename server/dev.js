const express = require("express");
const path = require("path");
const esbuild = require("esbuild");
const fs = require("fs");
const YAML = require("yaml");

const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const ROOT = path.join(__dirname, "..");

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(require('cookie-parser')());

// Load FAQ knowledge base (YAML)
let FAQ_ENTRIES = [];
try {
  const faqText = fs.readFileSync(path.join(ROOT, "data", "faq.yml"), "utf8");
  const parsed = YAML.parse(faqText);
  if (Array.isArray(parsed)) FAQ_ENTRIES = parsed;
} catch (e) {
  console.warn("[dev] Could not load data/faq.yml:", e.message);
}

// Retrieval helpers: prefer OpenAI embeddings when available, fall back to token overlap
const FAQ_EMBEDDINGS = []; // parallel to FAQ_ENTRIES; each is an array of numbers

async function getEmbedding(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('no_openai_key');
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    // no-cors not needed
  });
  if (!resp.ok) {
    const j = await resp.text();
    throw new Error(`embeddings_failed:${resp.status}:${j}`);
  }
  const j = await resp.json();
  const vec = j?.data?.[0]?.embedding;
  if (!Array.isArray(vec)) throw new Error('invalid_embedding');
  return vec;
}

function cosineSimVec(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0, aMag = 0, bMag = 0;
  for (let i = 0; i < a.length; i++) { const av = a[i] || 0; const bv = b[i] || 0; dot += av * bv; aMag += av * av; bMag += bv * bv; }
  if (aMag === 0 || bMag === 0) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}

// Simple token overlap fallback
function tokenize(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}
function vectorize(text) {
  const tokens = tokenize(text);
  const vec = new Map();
  tokens.forEach((t) => vec.set(t, (vec.get(t) || 0) + 1));
  return vec;
}
function cosineSim(a, b) {
  let dot = 0, aMag = 0, bMag = 0;
  a.forEach((v, k) => { aMag += v * v; if (b.has(k)) dot += v * b.get(k); });
  b.forEach((v) => (bMag += v * v));
  if (aMag === 0 || bMag === 0) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}

function retrieve(question, k = 1) {
  // Prefer embeddings if available and lengths match
  try {
    if (FAQ_EMBEDDINGS.length === FAQ_ENTRIES.length && FAQ_EMBEDDINGS.length > 0 && process.env.OPENAI_API_KEY) {
      // synchronous call: compute embedding for question synchronously by calling OpenAI (but retrieve is sync) --
      // Instead, make retrieve async elsewhere. For simplicity, provide a sync wrapper that returns zero matches prompting OpenAI later.
      // To keep current API, we'll return token-based results here, and rely on a reindexed async path for embeddings.
    }
  } catch (e) {
    // ignore
  }

  // Fallback token overlap
  const qv = vectorize(question);
  const scored = FAQ_ENTRIES.map((entry, idx) => {
    const text = `${entry.question} ${entry.answer}`;
    const sim = cosineSim(qv, vectorize(text));
    return { idx, sim, entry };
  }).sort((x, y) => y.sim - x.sim);
  return scored.slice(0, k);
}

// Background indexing: compute embeddings for all FAQ entries asynchronously
async function indexFAQ() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return;
  try {
    console.log('[dev] starting FAQ embedding index...');
    for (let i = 0; i < FAQ_ENTRIES.length; i++) {
      const entry = FAQ_ENTRIES[i];
      const text = `${entry.question}\n${entry.answer}`;
      try {
        const emb = await getEmbedding(text);
        FAQ_EMBEDDINGS[i] = emb;
      } catch (e) {
        console.warn('[dev] failed to embed FAQ entry', i, e && e.message ? e.message : e);
        FAQ_EMBEDDINGS[i] = null;
      }
      // small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 150));
    }
    console.log('[dev] FAQ embedding index complete');
  } catch (e) {
    console.warn('[dev] indexFAQ error', e && e.message ? e.message : e);
  }
}

// Kick off indexing without blocking startup
indexFAQ().catch(() => {});

// API: list FAQ question suggestions
app.get("/api/faq", (_req, res) => {
  res.json(Array.isArray(FAQ_ENTRIES) ? FAQ_ENTRIES.map((e) => e.question) : []);
});

// API: ask — use OpenAI with top-3 FAQ context (RAG). Model will be instructed to ONLY answer from the FAQ context and escalate if unsure.
app.post("/api/ask", async (req, res) => {
  const start = Date.now();
  const question = String((req.body && req.body.question) || "").trim();
  console.log(`[dev] /api/ask received question: "${question}"`);
  if (!question) return res.status(400).json({ error: "question required" });

  let top = retrieve(question, 3);
  // If embeddings are indexed, prefer semantic retrieval
  try {
    if (FAQ_EMBEDDINGS.length === FAQ_ENTRIES.length && FAQ_EMBEDDINGS.some(Boolean) && process.env.OPENAI_API_KEY) {
      try {
        const qEmb = await getEmbedding(question);
        const scored = FAQ_EMBEDDINGS.map((emb, idx) => {
          if (!emb) return { idx, sim: 0, entry: FAQ_ENTRIES[idx] };
          const sim = cosineSimVec(qEmb, emb);
          return { idx, sim, entry: FAQ_ENTRIES[idx] };
        }).sort((a, b) => b.sim - a.sim);
        top = scored.slice(0, 3);
      } catch (e) {
        console.warn('[dev] failed to compute question embedding, falling back to token retrieval', e && e.message ? e.message : e);
        top = retrieve(question, 3);
      }
    }
  } catch (e) {
    top = retrieve(question, 3);
  }

  const best = top[0] || null;
  const confidence = best ? Math.max(0, Math.min(1, best.sim)) : 0;
  const threshold = 0.2;

  // If no good FAQ match (low confidence), treat as conversational/no-factual match and allow OpenAI to reply conversationally
  if (!best || confidence < threshold) {
    console.log(`[dev] /api/ask no sufficient faq match (confidence=${confidence}, took ${Date.now()-start}ms)`);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || String(apiKey).startsWith("REPLACE") || String(apiKey).includes("REPLACE_ENV")) {
      return res.json({ answer: "I'm not sure. An admissions specialist will follow up.", confidence, escalated: true, source: null });
    }
    try {
      const context = top.map((r, i) => `${i + 1}. Q: ${r.entry.question}\nA: ${r.entry.answer}`).join("\n\n");
      const system = `You are the LunarTech admissions assistant. You have a friendly, helpful persona. Rules:\n1) If asked who you are or given a greeting/thanks, respond conversationally from your persona (e.g. "I'm the LunarTech admissions assistant — I can help with tuition, prerequisites, scheduling, and payment.").\n2) For factual questions use ONLY the provided FAQ context below; do NOT invent facts.\n3) If the FAQ context does not contain a factual answer, reply exactly: "I'm not sure. An admissions specialist will follow up."\n4) Keep answers concise and actionable.`;
      const userMsg = `FAQ context:\n${context}\n\nQuestion: ${question}`;
      console.log(`[dev] /api/ask calling OpenAI for conversational reply (question length ${question.length})`);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: userMsg }
          ],
          temperature: 0.2,
          max_tokens: 200,
        }),
      });
      const json = await response.json();
      const text = (json?.choices?.[0]?.message?.content || "").toString().trim();
      const escalated = true;
      const answer = text || "I'm not sure. An admissions specialist will follow up.";
      console.log(`[dev] /api/ask openai conversational response (took ${Date.now()-start}ms): ${String(answer).slice(0,200)}`);
      return res.json({ answer, confidence, escalated, source: null });
    } catch (e) {
      console.error("/api/ask openai error (no faq):", e && e.stack ? e.stack : e);
      return res.json({ answer: "I'm not sure. An admissions specialist will follow up.", confidence, escalated: true, source: null });
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(apiKey).startsWith("REPLACE") || String(apiKey).includes("REPLACE_ENV")) {
    console.log(`[dev] /api/ask using local FAQ fallback (took ${Date.now()-start}ms)`);
    return res.json({ answer: best.entry.answer, confidence, escalated: confidence < threshold, source: { question: best.entry.question } });
  }

  try {
    const context = top.map((r, i) => `${i + 1}. Q: ${r.entry.question}\nA: ${r.entry.answer}`).join("\n\n");
    const system = `You are the LunarTech admissions assistant. You have a friendly, helpful persona. Rules:\n1) Introduce yourself if asked (e.g. "I'm the LunarTech admissions assistant — I can help with tuition, prerequisites, scheduling, and payment.").\n2) For factual questions ANSWER ONLY using the provided FAQ context below; do NOT invent facts.\n3) If the FAQ context does not contain the answer, reply exactly: "I'm not sure. An admissions specialist will follow up."\n4) Keep answers concise and actionable.`;
    const userMsg = `FAQ context:\n${context}\n\nQuestion: ${question}`;

    console.log(`[dev] /api/ask calling OpenAI (question length ${question.length})`);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg }
        ],
        temperature: 0.0,
        max_tokens: 800,
      }),
    });

    const json = await response.json();
    const text = (json?.choices?.[0]?.message?.content || "").toString().trim();
    const escalated = confidence < threshold || /I'm not sure/i.test(text);
    const answer = text || best.entry.answer;
    console.log(`[dev] /api/ask openai response (took ${Date.now()-start}ms): ${String(answer).slice(0,200)}`);
    return res.json({ answer, confidence, escalated, source: { question: best.entry.question } });
  } catch (e) {
    console.error("/api/ask openai error:", e && e.stack ? e.stack : e);
    return res.json({ answer: best.entry.answer, confidence, escalated: true, source: { question: best.entry.question } });
  }
});

// API: Stripe Checkout session (test mode)
app.post("/api/checkout", async (req, res) => {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || String(key).startsWith("REPLACE") || String(key).includes("REPLACE_ENV")) return res.status(501).json({ error: "Stripe not configured. Please set STRIPE_SECRET_KEY in environment." });
    const { leadId } = req.body || {};
    const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http").toString();
    const origin = `${proto}://${req.get("host")}`;
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${origin}/payment/success`);
    params.append("cancel_url", `${origin}/payment/cancel`);
    params.append("client_reference_id", leadId || "");
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", "AI Bootcamp Tuition");
    params.append("line_items[0][price_data][unit_amount]", String(400000));
    params.append("line_items[0][quantity]", "1");

    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const j = await r.json();
    if (!r.ok) return res.status(500).json({ error: j.error?.message || "stripe_error" });
    return res.json({ url: j.url });
  } catch (e) {
    return res.status(500).json({ error: "checkout_failed" });
  }
});

// Serve source files statically so esbuild can resolve them
app.use("/src", express.static(path.join(ROOT, "src")));
app.use("/data", express.static(path.join(ROOT, "data")));

// DB-backed API routes (optional, used when DATABASE_URL provided and Prisma installed)
try {
  const dbApi = require('./api-db');
  app.use(dbApi);
} catch (e) {
  console.warn('[dev] DB API not mounted (prisma or db missing):', e && e.message ? e.message : e);
}

try {
  const seedApi = require('./api-seed');
  app.use(seedApi);
} catch (e) {
  console.warn('[dev] Seed API not mounted:', e && e.message ? e.message : e);
}

try {
  const authApi = require('./api-auth');
  app.use(authApi);
} catch (e) {
  console.warn('[dev] Auth API not mounted:', e && e.message ? e.message : e);
}

// Cal.com embed config (no secrets in response)
app.get("/api/cal/config", async (_req, res) => {
  const explicit = process.env.CAL_EMBED_LINK || ""; // e.g., "cal.com/your-handle/15min"
  if (explicit) return res.json({ link: explicit });

  const apiKey = process.env.CAL_API_KEY || process.env.CALCOM_API_KEY || "";
  if (!apiKey) return res.json({ link: "" });

  try {
    // Fetch username
    const meResp = await fetch(`https://api.cal.com/v1/me?apiKey=${encodeURIComponent(apiKey)}`);
    const me = await meResp.json();
    const username = me?.username || me?.user?.username || "";

    // Fetch event types
    const etResp = await fetch(`https://api.cal.com/v1/event-types?apiKey=${encodeURIComponent(apiKey)}`);
    const et = await etResp.json();
    const first = Array.isArray(et?.data) ? et.data[0] : (Array.isArray(et) ? et[0] : null);
    const slug = first?.slug || first?.eventSlug || "";

    const link = username && slug ? `${username}/${slug}` : ""; // embed supports both full and relative
    return res.json({ link });
  } catch (e) {
    return res.json({ link: "" });
  }
});

// Simple HTML shell served dynamically (not written to disk)
app.get(["/", "/index.html"], (_req, res) => {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>LunarTech CRM Prototype</title>
      <link rel="stylesheet" href="/src/styles/crm.css" />
    </head>
    <body>
      <div id="root"></div>
      <script src="/app.js"></script>
    </body>
  </html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
});

// On-the-fly bundle of the app entry, which mounts src/MyComponent.js
app.get("/app.js", async (_req, res) => {
  console.log("[dev] building /app.js");
  try {
    const result = await esbuild.build({
      stdin: {
        contents: `import React from 'react';
import { createRoot } from 'react-dom/client';
import MyComponent from './src/MyComponent.js';
const root = document.getElementById('root');
createRoot(root).render(React.createElement(MyComponent));`,
        resolveDir: ROOT,
        sourcefile: "virtual-entry.js",
        loader: "jsx",
      },
      bundle: true,
      sourcemap: true,
      write: false,
      platform: "browser",
      format: "iife",
      loader: {
        ".js": "jsx",
        ".jsx": "jsx"
      },
      define: { "process.env.NODE_ENV": '"development"' },
    });
    const js = result.outputFiles[0].text;
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.end(js);
  } catch (e) {
    console.error("[dev] build error:", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(String(e && e.stack ? e.stack : e));
  }
});

// SPA fallback for any other route (e.g., /admin)
app.get("*", (req, res, next) => {
  if (req.path === "/app.js" || req.path.startsWith("/src/") || req.path.startsWith("/data/")) return next();
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset=\"utf-8\" />
      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
      <title>LunarTech CRM Prototype</title>
      <link rel=\"stylesheet\" href=\"/src/styles/crm.css\" />
    </head>
    <body>
      <div id=\"root\"></div>
      <script src=\"/app.js\"></script>
    </body>
  </html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[dev] listening on http://localhost:${PORT}`);
});
