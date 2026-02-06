import { kv } from "@vercel/kv";
import { setCors, handleOptions } from "./_cors.js";

const OPTIONS = [
  "signin","music","library","chat","community","pool",
  "teachings","creative","outreach","archive"
];

const KEY_END = "tbt:round:end";          // ISO string
const KEY_TOTAL = "tbt:votes:total";      // number
const keyOpt = (opt) => `tbt:votes:${opt}`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return handleOptions(req, res);
  setCors(req, res);

  try {
    // Ensure a default 24h window exists
    let endIso = await kv.get(KEY_END);
    if (!endIso) {
      const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
      endIso = end.toISOString();
      await kv.set(KEY_END, endIso);
    }

    // Fetch totals
    const keys = OPTIONS.map(keyOpt);
    const values = await kv.mget(...keys);

    const totals = {};
    let computedTotal = 0;
    for (let i = 0; i < OPTIONS.length; i++) {
      const n = Number(values[i] || 0);
      totals[OPTIONS[i]] = n;
      computedTotal += n;
    }

    const storedTotal = Number((await kv.get(KEY_TOTAL)) || 0);
    const totalVotes = Math.max(storedTotal, computedTotal);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      ok: true,
      serverTime: new Date().toISOString(),
      endTime: endIso,
      totals,
      totalVotes
    }));
  } catch (err) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      ok: false,
      error: "STATUS_FAILED"
    }));
  }
}
