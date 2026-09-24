import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  reset: number;
  blockedUntil: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 10_000;
const MAX_REQUESTS = 80;
const BLOCK_MS = 60_000;

function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of buckets) {
    if (b.reset < now && b.blockedUntil < now) buckets.delete(ip);
  }
}, 60_000).unref?.();

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = clientIp(req);
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b) {
    b = { count: 0, reset: now + WINDOW_MS, blockedUntil: 0 };
    buckets.set(ip, b);
  }
  if (b.blockedUntil > now) {
    res.status(429).json({ error: "too many requests" });
    return;
  }
  if (b.reset < now) {
    b.count = 0;
    b.reset = now + WINDOW_MS;
  }
  b.count += 1;
  if (b.count > MAX_REQUESTS) {
    b.blockedUntil = now + BLOCK_MS;
    res.status(429).json({ error: "too many requests" });
    return;
  }
  next();
}

const loginBuckets = new Map<string, { count: number; reset: number }>();
const LOGIN_WINDOW_MS = 300_000;
const LOGIN_MAX = 8;

export function loginRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = clientIp(req);
  const now = Date.now();
  let b = loginBuckets.get(ip);
  if (!b || b.reset < now) {
    b = { count: 0, reset: now + LOGIN_WINDOW_MS };
    loginBuckets.set(ip, b);
  }
  b.count += 1;
  if (b.count > LOGIN_MAX) {
    res.status(429).json({ error: "too many login attempts, try again later" });
    return;
  }
  next();
}
