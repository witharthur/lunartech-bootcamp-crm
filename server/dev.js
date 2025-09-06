const express = require("express");
const path = require("path");
const esbuild = require("esbuild");
const fs = require("fs");
const YAML = require("yaml");

const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
const ROOT = path.join(__dirname, "..");

const app = express();
app.use(express.json());

// Load FAQ knowledge base (YAML)
let FAQ_ENTRIES = [];
try {
  const faqText = fs.readFileSync(path.join(ROOT, "data", "faq.yml"), "utf8");
  const parsed = YAML.parse(faqText);
  if (Array.isArray(parsed)) FAQ_ENTRIES = parsed;
} catch (e) {
  console.warn("[dev] Could not load data/faq.yml:", e.message);
}

// Simple retrieval helpers
function tokenize(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
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
  const qv = vectorize(question);
  const scored = FAQ_ENTRIES.map((entry, idx) => {
    const text = `${entry.question} ${entry.answer}`;
    const sim = cosineSim(qv, vectorize(text));
    return { idx, sim, entry };
  }).sort((x, y) => y.sim - x.sim);
  return scored.slice(0, k);
}

// API: list FAQ question suggestions
app.get("/api/faq", (_req, res) => {
  res.json(Array.isArray(FAQ_ENTRIES) ? FAQ_ENTRIES.map((e) => e.question) : []);
});

// API: ask with optional OpenAI fallback if confidence low
app.post("/api/ask", async (req, res) => {
  const question = String((req.body && req.body.question) || "").trim();
  if (!question) return res.status(400).json({ error: "question required" });
  const best = retrieve(question, 1)[0];
  const confidence = best ? Math.max(0, Math.min(1, best.sim)) : 0;
  const threshold = 0.35;
  const escalated = confidence < threshold;

  if (!best) return res.json({ answer: "I'm not sure. An admissions specialist will follow up.", confidence, escalated: true, source: null });

  if (!escalated) {
    return res.json({ answer: best.entry.answer, confidence, escalated: false, source: { question: best.entry.question } });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.json({ answer: "I'm not fully confident. We've logged your question for follow-up.", confidence, escalated: true, source: { question: best.entry.question } });
  }

  try {
    const context = retrieve(question, 3).map((r, i) => `${i + 1}. Q: ${r.entry.question}\nA: ${r.entry.answer}`).join("\n\n");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an admissions assistant. Answer only using the provided FAQ context. If unknown, say you are not sure and escalate politely." },
          { role: "user", content: `FAQ context:\n${context}\n\nQuestion: ${question}` },
        ],
        temperature: 0.2,
      }),
    });
    const json = await response.json();
    const text = json.choices?.[0]?.message?.content?.trim() || "I'm not fully confident. We've logged your question for follow-up.";
    return res.json({ answer: text, confidence, escalated: true, source: { question: best.entry.question } });
  } catch (e) {
    return res.json({ answer: "I'm not fully confident. We've logged your question for follow-up.", confidence, escalated: true, source: { question: best.entry.question } });
  }
});

// Serve source files statically so esbuild can resolve them
app.use("/src", express.static(path.join(ROOT, "src")));
app.use("/data", express.static(path.join(ROOT, "data")));

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
