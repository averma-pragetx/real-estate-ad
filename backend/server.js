import express from "express";
import cors from "cors";
import { generateAd, regenerateAd } from "./gemini.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/generate-ad", async (req, res) => {
  try {
    const result = await generateAd(req.body || {});
    res.json(result);
  } catch (err) {
    console.error("[generate-ad] error:", err);
    res.status(500).json({ error: err?.message || "Generation failed" });
  }
});

// Regenerate keeps the original listing details (same prompt base) and layers
// the user's refinement instructions on top. Optionally accepts the previous
// image so Gemini can iterate on it.
app.post("/api/regenerate-ad", async (req, res) => {
  try {
    const { input, refinement, previousImage } = req.body || {};
    if (!input) return res.status(400).json({ error: "Missing original input." });
    if (!refinement || !String(refinement).trim()) {
      return res.status(400).json({ error: "Missing refinement prompt." });
    }
    const result = await regenerateAd({ input, refinement, previousImage });
    res.json(result);
  } catch (err) {
    console.error("[regenerate-ad] error:", err);
    res.status(500).json({ error: err?.message || "Regeneration failed" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`EstateAd backend listening on http://localhost:${PORT}`);
});
