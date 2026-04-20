import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateAd } from "./gemini.js";

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

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`EstateAd backend listening on http://localhost:${PORT}`);
});
