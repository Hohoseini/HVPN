export type Protocol = "vless" | "vmess" | "trojan";
export type Transport = "ws" | "xhttp" | "httpupgrade";
export type TrafficReset = "never" | "daily" | "weekly" | "monthly";

export interface Inbound {
  id: number;
  tag: string;
  protocol: Protocol;
  transport: Transport;
  port: number;
  path: string;
  host: string;
  enabled: number;
  created_at: number;
}

export interface UserRecord {
  id: number;
  email: string;
  uuid: string;
  password: string;
  sub_token: string;
  fingerprint: string;
  alpn: string;
  data_limit: number;
  ip_limit: number;
  expire_at: number | null;
  sub_expire_days: number;
  sub_first_seen: number | null;
  traffic_reset: TrafficReset;
  telegram_id: string;
  comment: string;
  enabled: number;
  up: number;
  down: number;
  last_reset: number;
  online_at: number | null;
  created_by: number | null;
  created_at: number;
}

export interface UserWithInbounds extends UserRecord {
  inbound_ids: number[];
  total: number;
  online: boolean;
  creator?: string;
}

export interface ActivityEntry {
  id: number;
  ts: number;
  actor: string;
  action: string;
  detail: string;
}

export interface SystemStats {
  cpu: { usage: number; cores: number; avg: number };
  ram: { usage: number; used: number; total: number };
  swap: { usage: number; used: number; total: number };
  storage: { usage: number; free: number; total: number };
  uptime: number;
  ip: { address: string; location: string; isp: string };
  xray: { running: boolean; version: string; uptime: number };
}

export interface UserStatsSummary {
  clients: number;
  online: number;
  active: number;
  depleting: number;
}
