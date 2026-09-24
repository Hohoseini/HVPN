import { nanoid } from "nanoid";
import { db } from "./db.js";
import { config } from "./config.js";
import type { Inbound, Protocol, Transport } from "./types.js";

interface SeedDef {
  tag: string;
  protocol: Protocol;
  transport: Transport;
}

const SEED_INBOUNDS: SeedDef[] = [
  { tag: "VLESS-WS", protocol: "vless", transport: "ws" },
  { tag: "VLESS-XHTTP", protocol: "vless", transport: "xhttp" },
  { tag: "VMess-WS", protocol: "vmess", transport: "ws" },
  { tag: "Trojan-WS", protocol: "trojan", transport: "ws" },
  { tag: "VLESS-HTTPUpgrade", protocol: "vless", transport: "httpupgrade" },
];

export function seedInbounds(): void {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM inbounds").get() as { c: number }).c;
  if (count > 0) return;
  let offset = 0;
  const insert = db.prepare(
    `INSERT INTO inbounds (tag, protocol, transport, port, path, host, enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
  );
  for (const s of SEED_INBOUNDS) {
    const port = config.inboundBasePort + offset;
    const path = `/HVPN/${s.transport}-${nanoid(8)}`;
    insert.run(s.tag, s.protocol, s.transport, port, path, "", Date.now());
    offset += 1;
  }
}

export function listInbounds(): Inbound[] {
  return db.prepare("SELECT * FROM inbounds ORDER BY id ASC").all() as unknown as Inbound[];
}

export function listEnabledInbounds(): Inbound[] {
  return db
    .prepare("SELECT * FROM inbounds WHERE enabled = 1 ORDER BY id ASC")
    .all() as unknown as Inbound[];
}

export function getInbound(id: number): Inbound | undefined {
  return db.prepare("SELECT * FROM inbounds WHERE id = ?").get(id) as unknown as
    | Inbound
    | undefined;
}

export function setInboundEnabled(id: number, enabled: boolean): void {
  db.prepare("UPDATE inbounds SET enabled = ? WHERE id = ?").run(enabled ? 1 : 0, id);
}
