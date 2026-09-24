import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { db } from "./db.js";
import { config, publicHost } from "./config.js";
import { listInbounds } from "./inbounds.js";
import { buildUserLinks } from "./links.js";
import { buildClashConfig, buildSingboxConfig } from "./sub-formats.js";
import {
  getUserByToken,
  markSubFirstSeen,
  isSubExpired,
  isUserActive,
} from "./users.js";
import type { UserRecord } from "./types.js";

export const sub = Router();

let staticRoot = "";
export function setSubStaticRoot(root: string): void {
  staticRoot = root;
}

function usageHistory(userId: number) {
  const rows = db
    .prepare("SELECT ts, total FROM usage_history WHERE user_id = ? ORDER BY ts ASC")
    .all(userId) as { ts: number; total: number }[];
  return rows.map((r) => ({ ts: r.ts, total: r.total }));
}

function usagePayload(token: string, host: string) {
  const user = getUserByToken(token);
  if (!user) return null;
  markSubFirstSeen(user.id);
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as unknown as UserRecord;
  if (isSubExpired(row)) return { expired: true as const };
  const inbounds = listInbounds();
  const links = buildUserLinks(host, user, inbounds);
  return {
    expired: false as const,
    user: {
      email: user.email,
      up: user.up,
      down: user.down,
      total: user.total,
      dataLimit: user.data_limit,
      expireAt: user.expire_at,
      online: user.online,
      enabled: !!user.enabled,
      active: isUserActive(user),
      subExpireDays: user.sub_expire_days,
      subFirstSeen: user.sub_first_seen,
      comment: user.comment,
    },
    links,
    history: usageHistory(user.id),
  };
}

function subUserInfo(u: {
  up: number;
  down: number;
  dataLimit: number;
  expireAt: number | null;
}): string {
  const expire = u.expireAt ? Math.floor(u.expireAt / 1000) : 0;
  return `upload=${u.up}; download=${u.down}; total=${u.dataLimit}; expire=${expire}`;
}

sub.get("/:token/json", (req, res) => {
  const host = publicHost(req.headers.host);
  const data = usagePayload(req.params.token, host);
  if (!data) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (data.expired) {
    res.status(410).json({ expired: true });
    return;
  }
  res.json(data);
});

function rawLinks(token: string, host: string) {
  const user = getUserByToken(token);
  if (!user) return null;
  markSubFirstSeen(user.id);
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as unknown as UserRecord;
  if (isSubExpired(row)) return { expired: true as const };
  const inbounds = listInbounds();
  return { expired: false as const, user, inbounds };
}

sub.get("/:token/clash", (req, res) => {
  const host = publicHost(req.headers.host);
  const data = rawLinks(req.params.token, host);
  if (!data) {
    res.status(404).send("not found");
    return;
  }
  if (data.expired) {
    res.status(410).send("expired");
    return;
  }
  res.setHeader("Content-Type", "text/yaml; charset=utf-8");
  res.setHeader("Profile-Title", Buffer.from(`HVPN ${data.user.email}`).toString("base64"));
  res.send(buildClashConfig(host, data.user, data.inbounds));
});

sub.get("/:token/singbox", (req, res) => {
  const host = publicHost(req.headers.host);
  const data = rawLinks(req.params.token, host);
  if (!data) {
    res.status(404).send("not found");
    return;
  }
  if (data.expired) {
    res.status(410).send("expired");
    return;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(buildSingboxConfig(host, data.user, data.inbounds));
});

sub.get("/:token", (req, res) => {
  const host = publicHost(req.headers.host);
  const ua = String(req.headers["user-agent"] || "");
  const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edg|OPR/i.test(ua);

  if (isBrowser && req.query.raw !== "1" && req.query.format === undefined && staticRoot) {
    const indexFile = path.join(staticRoot, "index.html");
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
      return;
    }
  }

  const data = usagePayload(req.params.token, host);
  if (!data) {
    res.status(404).send("subscription not found");
    return;
  }
  if (data.expired) {
    res.status(410).send("subscription expired");
    return;
  }
  const body = data.links.map((l) => l.link).join("\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Subscription-Userinfo", subUserInfo(data.user));
  res.setHeader("Profile-Update-Interval", "12");
  res.setHeader("Profile-Title", Buffer.from(`HVPN ${data.user.email}`).toString("base64"));
  res.send(Buffer.from(body).toString("base64"));
});

void config;
