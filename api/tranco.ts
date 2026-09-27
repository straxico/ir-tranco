import type { IncomingMessage, ServerResponse } from "node:http";

let lastRequest = 0;
const cache = new Map<string, { expires: number; value: unknown }>();

// Shared by the local Express server and the Vercel Node function.
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const send = (status: number, data: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(data));
  };
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    send(405, { error: "GET required" });
    return;
  }
  const domain = new URL(req.url || "/", "http://localhost").searchParams
    .get("domain")
    ?.toLowerCase();
  if (
    !domain ||
    domain.length > 253 ||
    !domain.includes(".") ||
    !domain
      .split(".")
      .every((s) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s))
  ) {
    send(400, { error: "Valid domain required" });
    return;
  }
  const existing = cache.get(domain);
  if (existing && existing.expires > Date.now()) {
    send(200, existing.value);
    return;
  }
  if (Date.now() - lastRequest < 1100) {
    res.setHeader("Retry-After", "2");
    send(429, { error: "Please retry in two seconds" });
    return;
  }
  lastRequest = Date.now();
  try {
    const response = await fetch(
      `https://tranco-list.eu/api/ranks/domain/${encodeURIComponent(domain)}`,
      {
        headers: { "User-Agent": "ir-tranco-history/1.0" },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) {
      send(response.status === 429 ? 429 : 502, {
        error: "Tranco request failed",
      });
      return;
    }
    const value = await response.json();
    if (!Array.isArray(value.ranks)) {
      send(502, { error: "Invalid Tranco response" });
      return;
    }
    // Bound warm-instance memory; upstream 429s are forwarded across serverless instances.
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(domain, { expires: Date.now() + 60000, value });
    send(200, value);
  } catch {
    send(502, { error: "Tranco is temporarily unavailable" });
  }
}
