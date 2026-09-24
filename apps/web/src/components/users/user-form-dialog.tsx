import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Dice5, KeyRound, ChevronDown, Settings2, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { cn, relativeTime } from "@/lib/utils";
import type { Inbound, TrafficReset, User, UserFormValues } from "@/lib/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inbounds: Inbound[];
  editing: User | null;
  onSubmit: (values: UserFormValues) => Promise<void>;
}

const fingerprints = ["chrome", "firefox", "safari", "ios", "android", "edge", "random"];
const alpnOptions = ["h2,http/1.1", "h2", "http/1.1"];
const resets: TrafficReset[] = ["never", "daily", "weekly", "monthly"];

function randomToken(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  const rnd = crypto.getRandomValues(new Uint32Array(len));
  for (let i = 0; i < len; i++) out += chars[rnd[i] % chars.length];
  return out;
}

function ConnectedIps({ userId }: { userId: number }) {
  const { t } = useI18n();
  const { data: ips = [] } = useQuery({
    queryKey: ["client-ips", userId],
    queryFn: () => api.clientIps(userId),
    refetchInterval: 5000,
  });
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-main" />
        <Label>{t("connectedIps")}</Label>
        <Badge variant="info" className="text-[10px]">
          {ips.length} {t("activeCount")}
        </Badge>
      </div>
      {ips.length === 0 ? (
        <p className="rounded-base border-2 border-dashed border-border/40 px-3 py-2 text-xs text-text/50">
          {t("noConnections")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ips.map((entry) => (
            <div
              key={entry.ip}
              className="flex items-center justify-between gap-2 rounded-base border-2 border-border bg-bg/40 px-2.5 py-1.5"
            >
              <span className="truncate font-mono text-xs">{entry.ip}</span>
              <span className="shrink-0 text-[10px] text-text/50">{relativeTime(entry.last_seen)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserFormDialog({
  open,
  onOpenChange,
  inbounds,
  editing,
  onSubmit,
}: UserFormDialogProps) {
  const toast = useToast();
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [uuid, setUuid] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fingerprint, setFingerprint] = React.useState("chrome");
  const [alpn, setAlpn] = React.useState("h2,http/1.1");
  const [dataLimit, setDataLimit] = React.useState(0);
  const [expireDays, setExpireDays] = React.useState(30);
  const [ipLimit, setIpLimit] = React.useState(0);
  const [trafficReset, setTrafficReset] = React.useState<TrafficReset>("never");
  const [comment, setComment] = React.useState("");
  const [inboundIds, setInboundIds] = React.useState<number[]>([]);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setShowAdvanced(false);
    if (editing) {
      setEmail(editing.email);
      setUuid(editing.uuid);
      setPassword(editing.password);
      setFingerprint(editing.fingerprint);
      setAlpn(editing.alpn);
      setDataLimit(Math.round((editing.data_limit / 1024 ** 3) * 100) / 100);
      setIpLimit(editing.ip_limit);
      setExpireDays(
        editing.expire_at
          ? Math.max(0, Math.round((editing.expire_at - Date.now()) / 86_400_000))
          : 0,
      );
      setTrafficReset(editing.traffic_reset);
      setComment(editing.comment);
      setInboundIds(editing.inbound_ids);
    } else {
      setEmail("");
      setUuid(crypto.randomUUID());
      setPassword(randomToken(16));
      setFingerprint("chrome");
      setAlpn("h2,http/1.1");
      setDataLimit(0);
      setIpLimit(0);
      setExpireDays(30);
      setTrafficReset("never");
      setComment("");
      setInboundIds(inbounds.filter((i) => i.enabled).map((i) => i.id));
    }
  }, [open, editing, inbounds]);

  const toggleInbound = (id: number) => {
    setInboundIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allSelected = inboundIds.length === inbounds.length && inbounds.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.push("error", t("enterName"));
      return;
    }
    if (inboundIds.length === 0) {
      toast.push("error", t("attachInbound"));
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        email,
        uuid,
        password,
        fingerprint,
        alpn,
        dataLimit,
        ipLimit,
        expireDays,
        trafficReset,
        comment,
        inboundIds,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? t("editUser") : t("newUser")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">{t("nameEmail")}</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.slice(0, 32))}
              maxLength={32}
              placeholder="HVPN"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("dataLimit")}</Label>
              <NumberInput value={dataLimit} onChange={setDataLimit} step={1} suffix="GB" />
              <p className="text-[11px] text-text/50">{t("unlimitedHint")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("expireIn")}</Label>
              <NumberInput value={expireDays} onChange={setExpireDays} step={1} suffix={t("days")} />
              <p className="text-[11px] text-text/50">{t("neverHint")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("attachedInbounds")}</Label>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setInboundIds(inbounds.map((i) => i.id))}
                >
                  {t("selectAll")}
                </Button>
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setInboundIds([])}
                  disabled={inboundIds.length === 0}
                >
                  {t("clearAll")}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {inbounds.map((ib) => {
                const active = inboundIds.includes(ib.id);
                return (
                  <button
                    key={ib.id}
                    type="button"
                    onClick={() => toggleInbound(ib.id)}
                    className={cn(
                      "flex min-w-[calc(50%-0.375rem)] flex-1 flex-col gap-0.5 rounded-base border-2 border-border px-2.5 py-1.5 text-left transition-all sm:min-w-[calc(33.333%-0.5rem)]",
                      active
                        ? "bg-main text-mtext neo-shadow"
                        : "bg-bw text-text hover:bg-main/10",
                      !ib.enabled && "opacity-50",
                    )}
                  >
                    <span className="truncate font-heading text-xs">{ib.tag}</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-70">
                      {ib.protocol}/{ib.transport}
                    </span>
                  </button>
                );
              })}
            </div>
            {allSelected && (
              <p className="text-[11px] text-text/50">{t("allInboundsAttached")}</p>
            )}
          </div>

          {editing && <ConnectedIps userId={editing.id} />}

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={cn(
              "flex w-full items-center justify-between rounded-base border-2 border-border px-4 py-3 font-heading text-sm transition-all",
              showAdvanced ? "bg-main text-mtext neo-shadow" : "bg-bw hover:bg-main/10",
            )}
          >
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />{t("advancedOptions")}</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")}
            />
          </button>

          {showAdvanced && (
            <div className="space-y-4 rounded-base border-2 border-border/40 bg-bg/30 p-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="uuid">UUID</Label>
                <div className="flex gap-2">
                  <Input id="uuid" value={uuid} onChange={(e) => setUuid(e.target.value)} />
                  <Button
                    type="button"
                    variant="neutral"
                    size="icon"
                    onClick={() => setUuid(crypto.randomUUID())}
                    title="Generate UUID"
                  >
                    <Dice5 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("passwordTrojan")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="neutral"
                    size="icon"
                    onClick={() => setPassword(randomToken(16))}
                    title="Generate password"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("fingerprint")}</Label>
                  <Select value={fingerprint} onValueChange={setFingerprint}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fingerprints.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("alpn")}</Label>
                  <Select value={alpn} onValueChange={setAlpn}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {alpnOptions.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("ipLimit")}</Label>
                  <NumberInput value={ipLimit} onChange={setIpLimit} step={1} />
                  <p className="text-[11px] text-text/50">{t("ipLimitHint")}</p>
                </div>
                <div className="space-y-2">
                  <Label>Traffic reset</Label>
                  <Select
                    value={trafficReset}
                    onValueChange={(v) => setTrafficReset(v as TrafficReset)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resets.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="comment">{t("comment")}</Label>
                  <Input id="comment" value={comment} onChange={(e) => setComment(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="neutral"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? t("saving") : editing ? t("saveChanges") : t("createUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
