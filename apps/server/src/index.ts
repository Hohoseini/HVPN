/**
 * HVPN - Xray-core VPN management panel
 * Copyright (c) 2025 Hohoseini. All rights reserved.
 * Official repository: https://github.com/Hohoseini/HVPN
 *
 * Licensed under the hvpn Proprietary License (see LICENSE).
 * Unauthorized selling, white-labeling, or removal of attribution,
 * branding, or the embedded authorship identifiers is prohibited.
 * Watermark: sr-hvpn-2025-9f4c1a7e
 */
import "dotenv/config";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { migrate } from "./db.js";
import { seedInbounds } from "./inbounds.js";
import { seedDefaultClient } from "./users.js";
import { seedDefaultRouting } from "./routing.js";
import { api } from "./routes.js";
import { sub, setSubStaticRoot } from "./sub.js";
import { attachTunnel, tryTunnelHttp } from "./tunnel.js";
import { startXray, collectTraffic, collectClientIps, enforceIpLimits } from "./xray.js";
import { applyTrafficReset } from "./users.js";
import { rateLimit } from "./ratelimit.js";
import { sendDailyBackup } from "./bot.js";
import { refreshIpInfo } from "./ipinfo.js";
import { HVPN_SIGNATURE, watermark } from "./brand.js";

console.log(HVPN_SIGNATURE);

migrate();
seedInbounds();
seedDefaultClient();
seedDefaultRouting();

const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Powered-By", "hvpn by Hohoseini");
  res.setHeader("X-hvpn-Author", "Hohoseini");
  res.setHeader("X-hvpn-Repo", "https://github.com/Hohoseini/HVPN");
  next();
});
app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());

app.set("trust proxy", true);
app.get("/healthz", (_req, res) => res.json({ ok: true, ...watermark() }));

app.use("/api", rateLimit, api);
app.use("/sub", sub);

const staticCandidates = [
  path.join(process.cwd(), "public"),
  path.join(process.cwd(), "apps", "web", "dist"),
];
const staticDir = staticCandidates.find((p) => fs.existsSync(p)) || staticCandidates[0];

if (fs.existsSync(staticDir)) {
  setSubStaticRoot(staticDir);
  app.use(express.static(staticDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/sub")) return next();
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

const server = http.createServer((req, res) => {
  if ((req.url || "").startsWith("/api") || (req.url || "").startsWith("/sub")) {
    app(req, res);
    return;
  }
  if (tryTunnelHttp(req, res)) return;
  app(req, res);
});

attachTunnel(server);

server.listen(config.port, config.host, async () => {
  console.log(`HVPN listening on http://${config.host}:${config.port}`);
  await startXray();
  void refreshIpInfo();
});

setInterval(() => {
  try {
    collectTraffic();
  } catch {
    /* noop */
  }
}, 10_000);

setInterval(() => {
  try {
    collectClientIps();
  } catch {
    /* noop */
  }
}, 5_000);

setInterval(() => {
  try {
    enforceIpLimits();
  } catch {
    /* noop */
  }
}, 20_000);

setInterval(() => {
  try {
    applyTrafficReset();
  } catch {
    /* noop */
  }
}, 3_600_000);

let lastBackupDay = new Date().getDate();
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getDate() !== lastBackupDay) {
    lastBackupDay = now.getDate();
    void sendDailyBackup();
  }
}, 60_000);

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
