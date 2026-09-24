import https from "node:https";
import { getSetting, setSetting } from "./db.js";
import { exportData } from "./backup.js";

interface TgResult {
  ok: boolean;
  description?: string;
}

function apiCall(token: string, method: string, payload: Record<string, unknown>): Promise<TgResult> {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/${method}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 15000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as TgResult);
          } catch {
            resolve({ ok: false, description: "invalid response" });
          }
        });
      },
    );
    req.on("error", (e) => resolve({ ok: false, description: e.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, description: "timeout" });
    });
    req.write(body);
    req.end();
  });
}

function sendDocument(
  token: string,
  chatId: string,
  filename: string,
  content: string,
  caption: string,
): Promise<TgResult> {
  return new Promise((resolve) => {
    const boundary = `----HVPN${Date.now()}`;
    const parts: Buffer[] = [];
    const push = (s: string) => parts.push(Buffer.from(s, "utf8"));

    push(`--${boundary}\r\n`);
    push('Content-Disposition: form-data; name="chat_id"\r\n\r\n');
    push(`${chatId}\r\n`);

    push(`--${boundary}\r\n`);
    push('Content-Disposition: form-data; name="caption"\r\n\r\n');
    push(`${caption}\r\n`);

    push(`--${boundary}\r\n`);
    push('Content-Disposition: form-data; name="parse_mode"\r\n\r\n');
    push(`HTML\r\n`);

    push(`--${boundary}\r\n`);
    push(
      `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n` +
        "Content-Type: application/json\r\n\r\n",
    );
    push(content);
    push(`\r\n--${boundary}--\r\n`);

    const payload = Buffer.concat(parts);
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/sendDocument`,
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": payload.length,
        },
        timeout: 30000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as TgResult);
          } catch {
            resolve({ ok: false, description: "invalid response" });
          }
        });
      },
    );
    req.on("error", (e) => resolve({ ok: false, description: e.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, description: "timeout" });
    });
    req.write(payload);
    req.end();
  });
}

export interface BotConfig {
  enabled: boolean;
  token: string;
  chatIds: string[];
  dailyBackup: boolean;
}

export function getBotConfig(): BotConfig {
  return {
    enabled: getSetting("bot_enabled") === "1",
    token: getSetting("bot_token") || "",
    chatIds: JSON.parse(getSetting("bot_chat_ids") || "[]") as string[],
    dailyBackup: getSetting("bot_daily_backup") !== "0",
  };
}

export function saveBotConfig(cfg: Partial<BotConfig>): void {
  if (cfg.enabled !== undefined) setSetting("bot_enabled", cfg.enabled ? "1" : "0");
  if (cfg.token !== undefined) setSetting("bot_token", cfg.token.trim());
  if (cfg.chatIds !== undefined)
    setSetting("bot_chat_ids", JSON.stringify(cfg.chatIds.map((c) => c.trim()).filter(Boolean)));
  if (cfg.dailyBackup !== undefined) setSetting("bot_daily_backup", cfg.dailyBackup ? "1" : "0");
}

export async function broadcast(html: string): Promise<void> {
  const cfg = getBotConfig();
  if (!cfg.enabled || !cfg.token || cfg.chatIds.length === 0) return;
  for (const chatId of cfg.chatIds) {
    await apiCall(cfg.token, "sendMessage", {
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }
}

export async function testBot(
  token: string,
  chatIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  if (!token || chatIds.length === 0) return { ok: false, error: "token and chat id required" };
  const message =
    "<b>✅ HVPN bot connected</b>\n\n" +
    '🔗 <a href="https://github.com/icubaby/HVPN">github.com/icubaby/HVPN</a>\n\n' +
    "⭐️ If you enjoy the project, please give it a star — it means a lot!";
  let anyOk = false;
  let lastError = "";
  for (const chatId of chatIds) {
    const res = await apiCall(token, "sendMessage", {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    });
    if (res.ok) anyOk = true;
    else lastError = res.description || "failed";
  }
  return anyOk ? { ok: true } : { ok: false, error: lastError };
}

export async function sendDailyBackup(): Promise<void> {
  const cfg = getBotConfig();
  if (!cfg.enabled || !cfg.token || cfg.chatIds.length === 0 || !cfg.dailyBackup) return;
  const data = JSON.stringify(exportData(), null, 2);
  const date = new Date().toISOString().slice(0, 10);
  const caption =
    "<b>🗄 HVPN daily backup</b>\n" +
    `<b>Date:</b> ${date}\n` +
    "Keep this file safe — you can restore it from the dashboard.";
  for (const chatId of cfg.chatIds) {
    await sendDocument(cfg.token, chatId, `HVPN-backup-${date}.json`, data, caption);
  }
}
