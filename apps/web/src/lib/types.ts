export type Protocol = "vless" | "vmess" | "trojan";
export type Transport = "ws" | "xhttp" | "httpupgrade";
export type TrafficReset = "never" | "daily" | "weekly" | "monthly";

export type Permission =
  | "dashboard"
  | "users"
  | "inbounds"
  | "routing"
  | "activity"
  | "bot"
  | "settings";

export interface AdminInfo {
  id: number;
  username: string;
  role: "owner" | "admin";
  permissions: Permission[];
  dataLimit: number;
  createdAt: number;
  used?: number;
  userCount?: number;
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

export interface User {
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
  created_at: number;
  inbound_ids: number[];
  total: number;
  online: boolean;
  created_by: number | null;
  creator?: string;
}

export interface UserSummary {
  clients: number;
  online: number;
  active: number;
  depleting: number;
}

export interface ActivityEntry {
  id: number;
  ts: number;
  actor: string;
  action: string;
  detail: string;
}

export interface UserFormValues {
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
}

export interface SubLink {
  tag: string;
  protocol: string;
  transport: string;
  link: string;
}

export interface RoutingRule {
  id: number;
  domain: string;
  inbound_ids: number[];
  kind: "domain" | "ip";
  label: string;
  created_at: number;
}

export interface RoutingPreset {
  id: string;
  label: string;
  kind: "domain" | "ip";
  values: string[];
}

export interface BotConfig {
  enabled: boolean;
  token: string;
  chatIds: string[];
  dailyBackup: boolean;
}

export interface SubData {
  expired: boolean;
  user: {
    email: string;
    up: number;
    down: number;
    total: number;
    dataLimit: number;
    expireAt: number | null;
    online: boolean;
    enabled: boolean;
    active: boolean;
    subExpireDays: number;
    subFirstSeen: number | null;
    comment: string;
  };
  links: SubLink[];
  history: { ts: number; total: number }[];
}
