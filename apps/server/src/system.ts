import os from "node:os";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { config } from "./config.js";
import { isRunning, xrayVersion, xrayUptime } from "./xray.js";
import { getIpInfo } from "./ipinfo.js";
import type { SystemStats } from "./types.js";

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function readNum(path: string): number | null {
  try {
    const v = Number(fs.readFileSync(path, "utf8").trim());
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

function cgroupCpuLimit(): number | null {
  const v2 = (() => {
    try {
      const raw = fs.readFileSync("/sys/fs/cgroup/cpu.max", "utf8").trim();
      const [quota, period] = raw.split(/\s+/);
      if (quota === "max") return null;
      const q = Number(quota);
      const p = Number(period) || 100000;
      if (q > 0 && p > 0) return q / p;
    } catch {
      /* noop */
    }
    return null;
  })();
  if (v2 != null) return v2;
  const quota = readNum("/sys/fs/cgroup/cpu/cpu.cfs_quota_us");
  const period = readNum("/sys/fs/cgroup/cpu/cpu.cfs_period_us");
  if (quota && quota > 0 && period && period > 0) return quota / period;
  return null;
}

function cgroupCpuUsageUsec(): number | null {
  try {
    const stat = fs.readFileSync("/sys/fs/cgroup/cpu.stat", "utf8");
    const m = stat.match(/usage_usec\s+(\d+)/);
    if (m) return Number(m[1]);
  } catch {
    /* noop */
  }
  const v1 = readNum("/sys/fs/cgroup/cpuacct/cpuacct.usage");
  if (v1 != null) return Math.round(v1 / 1000);
  return null;
}

let lastCpuUsage = cgroupCpuUsageUsec();
let lastCpuStamp = Date.now();

function cpuUsage(): { usage: number; cores: number; avg: number } {
  const limit = cgroupCpuLimit();
  const cores = limit ? Math.max(1, Math.round(limit)) : os.cpus().length;
  const curUsage = cgroupCpuUsageUsec();
  const now = Date.now();

  if (curUsage != null && lastCpuUsage != null && now > lastCpuStamp) {
    const deltaUsec = curUsage - lastCpuUsage;
    const elapsedUsec = (now - lastCpuStamp) * 1000;
    const effectiveCores = limit || os.cpus().length;
    lastCpuUsage = curUsage;
    lastCpuStamp = now;
    const usage = elapsedUsec > 0 ? (deltaUsec / (elapsedUsec * effectiveCores)) * 100 : 0;
    const clamped = Math.max(0, Math.min(100, usage));
    return { usage: round(clamped), cores, avg: round(clamped) };
  }

  lastCpuUsage = curUsage;
  lastCpuStamp = now;
  const load = os.loadavg()[0];
  const denom = limit || os.cpus().length;
  const avg = denom > 0 ? Math.min(100, (load / denom) * 100) : 0;
  return { usage: round(avg), cores, avg: round(avg) };
}

function memUsage() {
  const limitV2 = (() => {
    try {
      const raw = fs.readFileSync("/sys/fs/cgroup/memory.max", "utf8").trim();
      if (raw === "max") return null;
      const v = Number(raw);
      return Number.isFinite(v) ? v : null;
    } catch {
      return null;
    }
  })();
  const usedV2 = readNum("/sys/fs/cgroup/memory.current");
  const limitV1 = readNum("/sys/fs/cgroup/memory/memory.limit_in_bytes");
  const usedV1 = readNum("/sys/fs/cgroup/memory/memory.usage_in_bytes");

  const hostTotal = os.totalmem();
  let total = limitV2 ?? (limitV1 && limitV1 < hostTotal ? limitV1 : null) ?? hostTotal;
  let used = usedV2 ?? usedV1 ?? hostTotal - os.freemem();

  if (total > hostTotal * 2 || total <= 0) total = hostTotal;
  if (used > total) used = total;

  return { usage: round((used / total) * 100), used, total };
}

function swapUsage(): { usage: number; used: number; total: number } {
  try {
    if (config.platform === "linux" && fs.existsSync("/proc/meminfo")) {
      const info = fs.readFileSync("/proc/meminfo", "utf8");
      const totalKb = Number(info.match(/SwapTotal:\s+(\d+)/)?.[1] || 0);
      const freeKb = Number(info.match(/SwapFree:\s+(\d+)/)?.[1] || 0);
      const total = totalKb * 1024;
      const used = (totalKb - freeKb) * 1024;
      return { usage: total > 0 ? round((used / total) * 100) : 0, used, total };
    }
  } catch {
    /* noop */
  }
  return { usage: 0, used: 0, total: 0 };
}

function storageUsage(): { usage: number; free: number; total: number } {
  try {
    const stat = fs.statfsSync(config.dataDir);
    const total = stat.blocks * stat.bsize;
    const free = stat.bavail * stat.bsize;
    const used = total - free;
    return { usage: total > 0 ? round((used / total) * 100) : 0, free, total };
  } catch {
    /* noop */
  }
  try {
    if (config.platform === "win32") {
      const out = execSync("wmic logicaldisk get size,freespace,caption", { encoding: "utf8" });
      const line = out.split("\n").find((l) => l.trim().startsWith("C:"));
      if (line) {
        const parts = line.trim().split(/\s+/);
        const free = Number(parts[1]);
        const total = Number(parts[2]);
        return { usage: total > 0 ? round(((total - free) / total) * 100) : 0, free, total };
      }
    }
  } catch {
    /* noop */
  }
  return { usage: 0, free: 0, total: 0 };
}

export function getSystemStats(): SystemStats {
  const ipInfo = getIpInfo();
  return {
    cpu: cpuUsage(),
    ram: memUsage(),
    swap: swapUsage(),
    storage: storageUsage(),
    uptime: os.uptime(),
    ip: { address: ipInfo.ip, location: ipInfo.location, isp: ipInfo.isp },
    xray: { running: isRunning(), version: xrayVersion(), uptime: xrayUptime() },
  };
}
