import { kv } from "@vercel/kv";
import { setCors, handleOptions } from "./_cors.js";

const OPTIONS = new Set([
  "signin","music","library","chat","community","pool",
  "teachings","creative","outreach","archive"
]);

const KEY_END = "tbt:round:end";
const KEY_TOTAL = "tbt:votes:total";
const keyOpt = (opt) => `tbt:votes:${opt}`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return handleOptions(req, res);
  setCors(req, res);

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" }));
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const choice = String(body.choice || "").trim();

    if (!OPTIONS.has(choice)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ ok: false, error: "INVALID_CHOICE" }));
    }

    const endIso = await kv.get(KEY_END);
    if (endIso) {
      const endMs = Date.parse(endIso);
      if (Number.isFinite(endMs) && Date.now() > endMs) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ ok: false, error: "ROUND_CLOSED" }));
      }
    }

    // Increment chosen + total
    await kv.incr(keyOpt(choice));
    const totalVotes = await kv.incr(KEY_TOTAL);

    // Return fresh totals
    const keys = Array.from(OPTIONS).map(keyOpt);
    const values = await kv.mget(...keys);

    const totals = {};
    const opts = Array.from(OPTIONS);
    for (let i = 0; i < opts.length; i++) totals[opts[i]] = Number(values[i] || 0);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, totals, totalVotes }));
  } catch (err) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "VOTE_FAILED" }));
  }
}
