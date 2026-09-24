import { db } from "./db.js";

export interface RoutingRule {
  id: number;
  domain: string;
  inbound_ids: number[];
  kind: "domain" | "ip";
  label: string;
  created_at: number;
}

interface RoutingRow {
  id: number;
  domain: string;
  inbound_ids: string;
  kind: string;
  label: string;
  created_at: number;
}

function decode(row: RoutingRow): RoutingRule {
  let ids: number[] = [];
  try {
    ids = JSON.parse(row.inbound_ids) as number[];
  } catch {
    ids = [];
  }
  return {
    id: row.id,
    domain: row.domain,
    inbound_ids: ids,
    kind: row.kind === "ip" ? "ip" : "domain",
    label: row.label || row.domain,
    created_at: row.created_at,
  };
}

export function listRoutingRules(): RoutingRule[] {
  const rows = db
    .prepare("SELECT * FROM routing_rules ORDER BY id DESC")
    .all() as unknown as RoutingRow[];
  return rows.map(decode);
}

export function addRoutingRule(
  domain: string,
  inboundIds: number[],
  kind: "domain" | "ip" = "domain",
  label = "",
): RoutingRule {
  const info = db
    .prepare(
      "INSERT INTO routing_rules (domain, inbound_ids, kind, label, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(domain.trim(), JSON.stringify(inboundIds), kind, label || domain.trim(), Date.now());
  const row = db
    .prepare("SELECT * FROM routing_rules WHERE id = ?")
    .get(Number(info.lastInsertRowid)) as unknown as RoutingRow;
  return decode(row);
}

export function updateRoutingRule(id: number, inboundIds: number[]): void {
  db.prepare("UPDATE routing_rules SET inbound_ids = ? WHERE id = ?").run(
    JSON.stringify(inboundIds),
    id,
  );
}

export function deleteRoutingRule(id: number): void {
  db.prepare("DELETE FROM routing_rules WHERE id = ?").run(id);
}

export function seedDefaultRouting(): void {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM routing_rules").get() as { c: number }).c;
  if (count > 0) return;
  addRoutingRule("geosite:category-ads-all", [], "domain", "Ads (all)");
}
