import { kv } from "@vercel/kv";
import { setCors, handleOptions } from "./_cors.js";

const LIST_KEY = "tbt:suggestions"; // list of JSON strings

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
    const text = String(body.text || "").trim();
    const email = String(body.email || "").trim();

    if (!text) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ ok: false, error: "MISSING_TEXT" }));
    }

    const item = {
      text,
      email: email || null,
      createdAt: new Date().toISOString(),
      ua: String(req.headers["user-agent"] || "")
    };

    // keep newest first, cap later if needed
    await kv.lpush(LIST_KEY, JSON.stringify(item));

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "SUGGEST_FAILED" }));
  }
}
