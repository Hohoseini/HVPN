import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ScrollText,
  Trash2,
  LogIn,
  UserPlus,
  UserCog,
  UserX,
  Power,
  Settings2,
  KeyRound,
  Download,
  Upload,
  Router,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { ActivityEntry } from "@/lib/types";

const actionMeta: Record<
  string,
  { icon: React.ElementType; labelKey: string; color: string }
> = {
  login: { icon: LogIn, labelKey: "actSignedIn", color: "info" },
  login_failed: { icon: ShieldAlert, labelKey: "actFailedLogin", color: "danger" },
  setup: { icon: Power, labelKey: "actSetup", color: "success" },
  user_create: { icon: UserPlus, labelKey: "actCreatedUser", color: "success" },
  user_update: { icon: UserCog, labelKey: "actUpdatedUser", color: "info" },
  user_delete: { icon: UserX, labelKey: "actDeletedUser", color: "danger" },
  user_toggle: { icon: Power, labelKey: "actToggledUser", color: "warning" },
  user_reset_traffic: { icon: Router, labelKey: "actResetTraffic", color: "warning" },
  user_rotate_token: { icon: KeyRound, labelKey: "actRotatedToken", color: "warning" },
  inbound_toggle: { icon: Router, labelKey: "actToggledInbound", color: "warning" },
  settings_update: { icon: Settings2, labelKey: "actUpdatedSettings", color: "info" },
  credentials_change: { icon: KeyRound, labelKey: "actChangedCredentials", color: "warning" },
  backup_export: { icon: Download, labelKey: "actExportedBackup", color: "info" },
  backup_import: { icon: Upload, labelKey: "actImportedBackup", color: "warning" },
  activity_clear: { icon: Trash2, labelKey: "actClearedLog", color: "danger" },
  admin_create: { icon: UserPlus, labelKey: "actAdminCreate", color: "success" },
  admin_update: { icon: UserCog, labelKey: "actAdminUpdate", color: "info" },
  admin_delete: { icon: UserX, labelKey: "actAdminDelete", color: "danger" },
  routing_add: { icon: Router, labelKey: "actRoutingAdd", color: "warning" },
  routing_update: { icon: Router, labelKey: "actRoutingUpdate", color: "info" },
  routing_delete: { icon: Router, labelKey: "actRoutingDelete", color: "danger" },
  bot_update: { icon: Settings2, labelKey: "actBotUpdate", color: "info" },
  bot_test: { icon: Settings2, labelKey: "actBotTest", color: "info" },
};

export default function ActivityPage() {
  const toast = useToast();
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: entries = [] } = useQuery<ActivityEntry[]>({
    queryKey: ["activity"],
    queryFn: api.activity,
    refetchInterval: 8000,
  });

  const clearMut = useMutation({
    mutationFn: () => api.clearActivity(),
    onSuccess: () => {
      toast.push("success", t("logCleared"));
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">{t("activityLog")}</h1>
          <p className="text-sm font-base text-text/60">{t("recentEvents")}</p>
        </div>
        <Button variant="danger" onClick={() => clearMut.mutate()} disabled={entries.length === 0}>
          <Trash2 className="h-4 w-4" />
          {t("clearLog")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-text/50">
              <ScrollText className="h-10 w-10" />
              <p className="font-heading">{t("noActivity")}</p>
            </div>
          ) : (
            <ul className="divide-y-2 divide-border/30">
              {entries.map((e) => {
                const meta = actionMeta[e.action] || {
                  icon: ScrollText,
                  labelKey: "",
                  color: "neutral",
                };
                const Icon = meta.icon;
                const label = meta.labelKey ? t(meta.labelKey as never) : e.action;
                const detail =
                  e.detail === "panel initialized" ? t("detailPanelInit" as never) : e.detail;
                return (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-3 sm:items-center sm:gap-4 sm:px-5 sm:py-3.5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-base border-2 border-border bg-bg sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4 text-text/80 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm sm:text-base">{label}</span>
                        {detail && (
                          <Badge variant={meta.color as never} className="max-w-full truncate text-[10px]">
                            {detail}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-base text-text/50">
                        <span>{t("by")} {e.actor}</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="sm:hidden">{formatDate(e.ts)}</span>
                      </div>
                    </div>
                    <div className="hidden whitespace-nowrap text-xs font-base text-text/50 sm:block">
                      {formatDate(e.ts)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
