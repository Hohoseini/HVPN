import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, Save, Plus, Trash2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BotConfig } from "@/lib/types";

export default function BotPage() {
  const toast = useToast();
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data } = useQuery<BotConfig>({ queryKey: ["bot"], queryFn: api.getBot });

  const [enabled, setEnabled] = React.useState(false);
  const [token, setToken] = React.useState("");
  const [chatIds, setChatIds] = React.useState<string[]>([""]);
  const [dailyBackup, setDailyBackup] = React.useState(true);

  React.useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setToken(data.token);
    setChatIds(data.chatIds.length ? data.chatIds : [""]);
    setDailyBackup(data.dailyBackup);
  }, [data]);

  const cleanIds = () => chatIds.map((c) => c.trim()).filter(Boolean);

  const saveMut = useMutation({
    mutationFn: () => api.saveBot({ enabled, token, chatIds: cleanIds(), dailyBackup }),
    onSuccess: () => {
      toast.push("success", t("botSaved"));
      qc.invalidateQueries({ queryKey: ["bot"] });
    },
    onError: (e: Error) => toast.push("error", e.message),
  });

  const testMut = useMutation({
    mutationFn: () => api.testBot(token, cleanIds()),
    onSuccess: () => toast.push("success", "Test message sent — check your Telegram"),
    onError: (e: Error) => toast.push("error", e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">{t("telegramBot")}</h1>
        <p className="text-sm font-base text-text/60">
          {t("botDesc")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-main" />
            <CardTitle>{t("botConfig")}</CardTitle>
          </div>
          <CardDescription>
            {t("botConfigDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-base border-2 border-border bg-bg/40 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-main" />
              <span className="font-heading text-sm">{t("enableBot")}</span>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">{t("botToken")}</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("chatIds")}</Label>
              <Button
                type="button"
                variant="neutral"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setChatIds((p) => [...p, ""])}
              >
                <Plus className="h-3.5 w-3.5" />{t("add")}
              </Button>
            </div>
            <div className="space-y-2">
              {chatIds.map((cid, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={cid}
                    onChange={(e) =>
                      setChatIds((p) => p.map((v, idx) => (idx === i ? e.target.value : v)))
                    }
                    placeholder="e.g. 123456789"
                  />
                  {chatIds.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="icon"
                      onClick={() => setChatIds((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text/50">
              {t("chatIdHint")}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-base border-2 border-border bg-bg/40 p-3">
            <div>
              <div className="font-heading text-sm">{t("dailyBackup")}</div>
              <div className="text-[11px] text-text/50">
                {t("dailyBackupDesc")}
              </div>
            </div>
            <Switch checked={dailyBackup} onCheckedChange={setDailyBackup} />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              className="w-full"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
            >
              <Save className="h-4 w-4" />{t("save")}
            </Button>
            <Button
              variant="neutral"
              className="w-full"
              onClick={() => testMut.mutate()}
              disabled={testMut.isPending || !token || cleanIds().length === 0}
            >
              <Send className="h-4 w-4" />
              {testMut.isPending ? t("sending") : t("sendTest")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
