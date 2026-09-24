import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
  Upload,
  CalendarClock,
  Gauge,
  QrCode as QrIcon,
  Copy,
  Check,
  Link2,
  ShieldCheck,
  CircleAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import { QrCode } from "@/components/qr-code";
import { RailLogo } from "@/components/rail-logo";
import { AnimatedBackground } from "@/components/animated-background";
import { useGitHubStars } from "@/components/github-button";
import { useToast } from "@/components/ui/toast";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";
import { GITHUB_URL, GITHUB_REPO, TELEGRAM_URL, PANEL_VERSION } from "@/lib/brand";
import { Github, Star, Tag, Send, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatBytes, formatDate, relativeTime, cn } from "@/lib/utils";
import type { SubData, SubLink } from "@/lib/types";

const protocolColor: Record<string, string> = {
  vless: "#a3e635",
  vmess: "#7dd3fc",
  trojan: "#f0abfc",
};

function useSubData(token: string | undefined) {
  return useQuery<SubData | { expired: true }>({
    queryKey: ["sub", token],
    queryFn: async () => {
      const res = await fetch(`/sub/${token}/json`);
      if (res.status === 410) return { expired: true } as const;
      if (!res.ok) throw new Error("not found");
      return (await res.json()) as SubData;
    },
    enabled: !!token,
    refetchInterval: 20000,
  });
}

function CopyButton({
  value,
  label,
  icon,
  className,
}: {
  value: string;
  label?: string;
  icon?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  if (icon) {
    return (
      <Button variant="neutral" size="icon" onClick={copy} className={cn("h-9 w-9 shrink-0", className)}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    );
  }
  return (
    <Button variant="neutral" onClick={copy} className={cn("shrink-0", className)}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {label || (copied ? "Copied" : "Copy")}
    </Button>
  );
}

function buildChart(history: { ts: number; total: number }[]) {
  if (!history || history.length < 2) return [];
  return history.map((h) => ({
    ts: h.ts,
    used: h.total,
  }));
}

export default function SubscriptionPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useI18n();
  const { data, isLoading, isError } = useSubData(token);
  const [qrConfig, setQrConfig] = React.useState<SubLink | null>(null);
  const [subQrOpen, setSubQrOpen] = React.useState(false);

  const subUrl = `${window.location.origin}/sub/${token}`;

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <RailLogo className="h-10 w-10 animate-pulse text-main" />
          <p className="font-heading text-text/60">{t("loadingSub")}</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState title={t("subNotFound")} desc={t("subNotFoundDesc")} />
    );
  }

  if ("expired" in data && data.expired) {
    return (
      <ErrorState
        title={t("subExpired")}
        desc={t("subExpiredDesc")}
      />
    );
  }

  const sub = data as SubData;
  const { user, links } = sub;
  const usagePct = user.dataLimit > 0 ? Math.min(100, (user.total / user.dataLimit) * 100) : 0;
  const remaining = user.dataLimit > 0 ? Math.max(0, user.dataLimit - user.total) : 0;
  const chart = buildChart(sub.history || []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg pb-16">
      <AnimatedBackground />

      <div className="relative mx-auto w-full min-w-0 max-w-3xl px-4 pt-6 sm:pt-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-base border-2 border-border bg-main text-mtext neo-shadow">
              <RailLogo className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="font-heading text-2xl leading-tight">SideRail</div>
              <div className="truncate text-sm font-base text-text/60">{user.email}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user.online ? (
              <Badge variant="success" className="gap-1">
                <Wifi className="h-3.5 w-3.5" /> {t("online")}
              </Badge>
            ) : (
              <Badge variant="neutral" className="gap-1">
                <WifiOff className="h-3.5 w-3.5" /> {t("offline")}
              </Badge>
            )}
            <Badge variant={user.active ? "success" : "danger"} className="gap-1">
              {user.active ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <CircleAlert className="h-3.5 w-3.5" />
              )}
              {user.active ? t("active") : t("inactive")}
            </Badge>
          </div>
        </header>

        <Card className="mt-6 animate-pop-in">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-heading uppercase tracking-widest text-text/60">{t("dataUsed")}</span>
                <span className="font-heading text-sm">
                  {user.dataLimit > 0
                    ? `${formatBytes(user.total)} / ${formatBytes(user.dataLimit)}`
                    : formatBytes(user.total)}
                </span>
              </div>
              <Progress
                value={user.dataLimit > 0 ? usagePct : 100}
                className="mt-2 h-4"
                indicatorClassName={
                  usagePct > 90 ? "bg-red-400" : usagePct > 70 ? "bg-yellow-400" : "bg-main"
                }
              />
              <div className="mt-1 text-xs font-base text-text/50">
                {user.dataLimit > 0 ? `${formatBytes(remaining)} ${t("remainingLabel")}` : t("unlimitedPlan")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat
                icon={Download}
                label={t("download")}
                value={formatBytes(user.down)}
                accent="#a3e635"
              />
              <MiniStat
                icon={Upload}
                label={t("upload")}
                value={formatBytes(user.up)}
                accent="#7dd3fc"
              />
              <MiniStat
                icon={CalendarClock}
                label={t("expires")}
                value={user.expireAt ? relativeTime(user.expireAt) : t("never")}
                accent="#fda4af"
              />
              <MiniStat
                icon={Gauge}
                label={t("configs")}
                value={String(links.length)}
                accent="#f0abfc"
              />
            </div>

            <div>
              <span className="mb-2 block text-xs font-heading uppercase tracking-widest text-text/60">{t("usageTrend")}</span>
              <div className="h-[160px] w-full rounded-base border-2 border-border bg-bg/40 p-2">
                {chart.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a3e635" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#a3e635" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="ts" hide />
                      <YAxis hide />
                      <RTooltip
                        formatter={(v: number) => [formatBytes(v), "Total"]}
                        labelFormatter={(l: number) =>
                          new Date(l).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        }
                        contentStyle={{
                          border: "2px solid #000",
                          borderRadius: 8,
                          background: "#fff",
                          color: "#000",
                          fontWeight: 600,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="used"
                        stroke="#000"
                        strokeWidth={2}
                        fill="url(#usageFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-xs font-base text-text/40">
                    {t("notEnoughData")}
                  </div>
                )}
              </div>
              {user.expireAt && (
                <div className="mt-2 text-center text-xs font-base text-text/50">
                  {t("validUntil")} {formatDate(user.expireAt)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 space-y-2">
          <div className="flex min-w-0 items-center gap-2 rounded-base border-2 border-border bg-bw px-3 py-2 neo-shadow">
            <Link2 className="h-4 w-4 shrink-0 text-text/50" />
            <span className="truncate font-mono text-xs text-text/80">{subUrl}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CopyButton value={subUrl} label={t("copySub")} className="w-full" />
            <Button variant="default" onClick={() => setSubQrOpen(true)} className="w-full">
              <QrIcon className="h-4 w-4" />
              QR
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <CopyButton value={subUrl} label="V2ray" className="w-full" />
            <CopyButton value={`${subUrl}/clash`} label="Clash" className="w-full" />
            <CopyButton value={`${subUrl}/singbox`} label="Sing-box" className="w-full" />
          </div>
          <p className="text-center text-[11px] font-base text-text/40">{t("copyHint")}</p>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-heading text-lg">{t("configurations")}</h2>
          <div className="grid gap-3">
            {links.map((link, i) => (
              <Card
                key={`${link.tag}-${i}`}
                className="animate-fade-in overflow-hidden"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <CardContent className="flex items-center gap-2.5 p-3 sm:gap-3 sm:p-4">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-base border-2 border-border font-heading text-black uppercase sm:h-11 sm:w-11"
                    style={{ background: protocolColor[link.protocol] || "#a3e635" }}
                  >
                    {link.protocol.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-heading text-sm sm:text-base">{link.tag}</div>
                    <Badge variant="neutral" className="mt-0.5 text-[10px] uppercase">
                      {link.transport}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <CopyButton value={link.link} icon />
                    <Button
                      variant="neutral"
                      size="icon"
                      onClick={() => setQrConfig(link)}
                      className="h-9 w-9 shrink-0"
                    >
                      <QrIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {links.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-text/50">
                  {t("noConfigs")}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <footer className="mt-10">
          <SubFooter />
        </footer>
      </div>

      <Dialog open={!!qrConfig} onOpenChange={(o) => !o && setQrConfig(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{qrConfig?.tag}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {qrConfig && <QrCode value={qrConfig.link} size={220} />}
            <p className="break-all text-center font-mono text-[11px] text-text/50">
              {qrConfig?.link}
            </p>
            {qrConfig && <CopyButton value={qrConfig.link} label={t("copyConfig")} />}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={subQrOpen} onOpenChange={setSubQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{t("subscriptionQr")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <QrCode value={subUrl} size={220} />
            <p className="text-center text-sm font-base text-text/60">
              {t("scanImport")}
            </p>
            <CopyButton value={subUrl} label={t("copySub")} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-base border-2 border-border bg-bg/40 p-3 text-center">
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[5px] border-2 border-border"
        style={{ background: accent }}
      >
        <Icon className="h-4 w-4 text-black" />
      </div>
      <span className="text-[10px] font-heading uppercase tracking-widest text-text/60">
        {label}
      </span>
      <div className="w-full truncate font-heading text-sm">{value}</div>
    </div>
  );
}

function SubFooter() {
  const { lang, setLang, t } = useI18n();
  const toast = useToast();
  const stars = useGitHubStars();

  const changeLang = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    toast.push("success", t("languageChanged"));
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-base border-2 border-border bg-bw/70 px-3 py-2 font-heading text-xs text-text/80 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-main hover:text-mtext hover:neo-shadow"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Github className="h-4 w-4 shrink-0" />
            <span className="truncate">{GITHUB_REPO}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 rounded-[4px] border-2 border-border bg-main px-1.5 text-mtext">
            <Star className="h-3 w-3" fill="currentColor" />
            {stars ?? 0}
          </span>
        </a>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-base border-2 border-border bg-bw/70 px-3 py-2 font-heading text-xs text-text/80 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-main hover:text-mtext hover:neo-shadow"
        >
          <Send className="h-4 w-4 shrink-0" />
          <span className="truncate">Telegram</span>
        </a>
        <a
          href={`${GITHUB_URL}/releases`}
          target="_blank"
          rel="noreferrer"
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-base border-2 border-border bg-bw/70 px-3 py-2 font-heading text-xs text-text/80 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-main hover:text-mtext hover:neo-shadow"
        >
          <Tag className="h-4 w-4 shrink-0" />
          <span className="truncate">v{PANEL_VERSION}</span>
        </a>
      </div>
      <div className="flex items-center gap-1 rounded-base border-2 border-border bg-bw/70 p-1 backdrop-blur">
        <Languages className="ml-1 h-4 w-4 shrink-0 text-text/50" />
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => changeLang(l.code)}
            className={cn(
              "flex-1 rounded-[4px] px-1 py-1.5 text-xs font-heading transition-colors",
              lang === l.code ? "bg-main text-mtext" : "hover:bg-main/15",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className={cn("grid min-h-screen place-items-center bg-bg p-4")}>
      <Card className="w-full max-w-md animate-pop-in">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-base border-2 border-border bg-red-300">
            <CircleAlert className="h-8 w-8 text-black" />
          </div>
          <div>
            <h1 className="font-heading text-2xl">{title}</h1>
            <p className="mt-1 text-sm font-base text-text/60">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
