export function setCors(req, res) {
  // Keep permissive during build-out; tighten later.
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export function handleOptions(req, res) {
  setCors(req, res);
  res.statusCode = 204;
  res.end();
}
