/**
 * hvpn - Xray-core VPN management panel
 * Copyright (c) 2025 Hohoseini. All rights reserved.
 * Official repository: https://github.com/Hohoseini/HVPN
 *
 * Licensed under the hvpn Proprietary License (see LICENSE).
 * Unauthorized selling, white-labeling, or removal of attribution,
 * branding, or the embedded authorship identifiers is prohibited.
 * Watermark: sr-Hohoseini-2025-9f4c1a7e
 */
import { randomUUID } from "node:crypto";
import { nanoid } from "nanoid";
import { db } from "./db.js";
import type { TrafficReset, UserRecord, UserWithInbounds } from "./types.js";

const ONLINE_WINDOW_MS = 60_000;

export interface CreateUserInput {
  email: string;
  uuid?: string;
  password?: string;
  fingerprint?: string;
  alpn?: string;
  dataLimit?: number;
  ipLimit?: number;
  expireDays?: number;
  subExpireDays?: number;
  trafficReset?: TrafficReset;
  telegramId?: string;
  comment?: string;
  inboundIds?: number[];
  createdBy?: number | null;
}

export type UpdateUserInput = Partial<CreateUserInput> & { enabled?: boolean };

function gb(n: number): number {
  return Math.round(n * 1024 * 1024 * 1024);
}

function expireFromDays(days?: number): number | null {
  if (!days || days <= 0) return null;
  return Date.now() + days * 86_400_000;
}

function attachInbounds(userId: number, inboundIds: number[]): void {
  db.prepare("DELETE FROM user_inbounds WHERE user_id = ?").run(userId);
  const insert = db.prepare(
    "INSERT OR IGNORE INTO user_inbounds (user_id, inbound_id) VALUES (?, ?)",
  );
  for (const id of inboundIds) insert.run(userId, id);
}

export function seedDefaultClient(): void {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c;
  if (count > 0) return;
  const enabledInbounds = (
    db.prepare("SELECT id FROM inbounds WHERE enabled = 1").all() as { id: number }[]
  ).map((r) => r.id);
  const owner = db.prepare("SELECT id FROM admins WHERE role = 'owner' LIMIT 1").get() as
    | { id: number }
    | undefined;
  createUser({
    email: "sample-user",
    dataLimit: 0,
    ipLimit: 0,
    expireDays: 0,
    comment: "",
    inboundIds: enabledInbounds,
    createdBy: owner?.id ?? null,
  });
}

export function createUser(input: CreateUserInput): UserWithInbounds {
  const now = Date.now();
  const info = db
    .prepare(
      `INSERT INTO users
        (email, uuid, password, sub_token, fingerprint, alpn, data_limit, ip_limit,
         expire_at, sub_expire_days, traffic_reset, telegram_id, comment, enabled, last_reset, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    )
    .run(
      input.email,
      input.uuid || randomUUID(),
      input.password || nanoid(16),
      nanoid(24),
      input.fingerprint || "chrome",
      input.alpn || "h2,http/1.1",
      gb(input.dataLimit || 0),
      input.ipLimit || 0,
      expireFromDays(input.expireDays),
      input.subExpireDays || 0,
      input.trafficReset || "never",
      input.telegramId || "",
      input.comment || "",
      now,
      input.createdBy ?? null,
      now,
    );
  const id = Number(info.lastInsertRowid);
  attachInbounds(id, input.inboundIds || []);
  return getUser(id)!;
}

export function updateUser(id: number, input: UpdateUserInput): UserWithInbounds | null {
  const existing = getUserRow(id);
  if (!existing) return null;
  const fields: string[] = [];
  const values: unknown[] = [];
  const set = (col: string, val: unknown) => {
    fields.push(`${col} = ?`);
    values.push(val);
  };
  if (input.email !== undefined) set("email", input.email);
  if (input.uuid !== undefined) set("uuid", input.uuid);
  if (input.password !== undefined) set("password", input.password);
  if (input.fingerprint !== undefined) set("fingerprint", input.fingerprint);
  if (input.alpn !== undefined) set("alpn", input.alpn);
  if (input.dataLimit !== undefined) set("data_limit", gb(input.dataLimit));
  if (input.ipLimit !== undefined) set("ip_limit", input.ipLimit);
  if (input.expireDays !== undefined) set("expire_at", expireFromDays(input.expireDays));
  if (input.subExpireDays !== undefined) set("sub_expire_days", input.subExpireDays);
  if (input.trafficReset !== undefined) set("traffic_reset", input.trafficReset);
  if (input.telegramId !== undefined) set("telegram_id", input.telegramId);
  if (input.comment !== undefined) set("comment", input.comment);
  if (input.enabled !== undefined) set("enabled", input.enabled ? 1 : 0);
  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...(values as never[]));
  }
  if (input.inboundIds !== undefined) attachInbounds(id, input.inboundIds);
  return getUser(id);
}

export function deleteUser(id: number): void {
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function setUserEnabled(id: number, enabled: boolean): void {
  db.prepare("UPDATE users SET enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
}

export function resetUserTraffic(id: number): void {
  db.prepare("UPDATE users SET up = 0, down = 0, last_reset = ? WHERE id = ?").run(Date.now(), id);
}

export function rotateSubToken(id: number): void {
  db.prepare("UPDATE users SET sub_token = ?, sub_first_seen = NULL WHERE id = ?").run(
    nanoid(24),
    id,
  );
}

function getUserRow(id: number): UserRecord | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as
    | UserRecord
    | undefined;
}

function inboundIdsFor(userId: number): number[] {
  return (
    db.prepare("SELECT inbound_id FROM user_inbounds WHERE user_id = ?").all(userId) as unknown as {
      inbound_id: number;
    }[]
  ).map((r) => r.inbound_id);
}

function creatorName(id: number | null): string | undefined {
  if (id == null) return undefined;
  const row = db.prepare("SELECT username FROM admins WHERE id = ?").get(id) as
    | { username: string }
    | undefined;
  return row?.username;
}

function decorate(row: UserRecord): UserWithInbounds {
  return {
    ...row,
    inbound_ids: inboundIdsFor(row.id),
    total: row.up + row.down,
    online: row.online_at != null && Date.now() - row.online_at < ONLINE_WINDOW_MS,
    creator: creatorName(row.created_by),
  };
}

export function getUser(id: number): UserWithInbounds | null {
  const row = getUserRow(id);
  return row ? decorate(row) : null;
}

export function getUserByToken(token: string): UserWithInbounds | null {
  const row = db.prepare("SELECT * FROM users WHERE sub_token = ?").get(token) as unknown as
    | UserRecord
    | undefined;
  return row ? decorate(row) : null;
}

export function listUsers(createdBy?: number): UserWithInbounds[] {
  const rows =
    createdBy === undefined
      ? (db.prepare("SELECT * FROM users ORDER BY id DESC").all() as unknown as UserRecord[])
      : (db
          .prepare("SELECT * FROM users WHERE created_by = ? ORDER BY id DESC")
          .all(createdBy) as unknown as UserRecord[]);
  return rows.map(decorate);
}

export function usageByAdmin(adminId: number): { used: number; count: number } {
  const row = db
    .prepare("SELECT COALESCE(SUM(up + down), 0) AS used, COUNT(*) AS count FROM users WHERE created_by = ?")
    .get(adminId) as { used: number; count: number };
  return { used: row.used, count: row.count };
}

export function markSubFirstSeen(id: number): void {
  const row = getUserRow(id);
  if (row && row.sub_first_seen == null) {
    db.prepare("UPDATE users SET sub_first_seen = ? WHERE id = ?").run(Date.now(), id);
  }
}

export function isSubExpired(user: UserRecord): boolean {
  if (user.sub_expire_days > 0 && user.sub_first_seen != null) {
    const deadline = user.sub_first_seen + user.sub_expire_days * 86_400_000;
    if (Date.now() > deadline) return true;
  }
  return false;
}

export function isUserActive(user: UserWithInbounds): boolean {
  if (!user.enabled) return false;
  if (user.expire_at != null && Date.now() > user.expire_at) return false;
  if (user.data_limit > 0 && user.total >= user.data_limit) return false;
  return true;
}

export function isDepleting(user: UserWithInbounds): boolean {
  if (user.data_limit > 0) {
    const remaining = user.data_limit - user.total;
    if (remaining > 0 && remaining < user.data_limit * 0.1) return true;
  }
  if (user.expire_at != null) {
    const left = user.expire_at - Date.now();
    if (left > 0 && left < 3 * 86_400_000) return true;
  }
  return false;
}

export function applyTrafficReset(): void {
  const now = new Date();
  const rows = db
    .prepare("SELECT * FROM users WHERE traffic_reset != 'never'")
    .all() as unknown as UserRecord[];
  for (const u of rows) {
    const last = new Date(u.last_reset || u.created_at);
    let due = false;
    if (u.traffic_reset === "daily") due = now.toDateString() !== last.toDateString();
    else if (u.traffic_reset === "weekly") due = now.getTime() - last.getTime() >= 7 * 86_400_000;
    else if (u.traffic_reset === "monthly")
      due = now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear();
    if (due) resetUserTraffic(u.id);
  }
}

export function summarize(users: UserWithInbounds[]) {
  return {
    clients: users.length,
    online: users.filter((u) => u.online).length,
    active: users.filter((u) => isUserActive(u)).length,
    depleting: users.filter((u) => isDepleting(u)).length,
  };
}
