import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Rocket,
  Globe2,
  Server,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { AuthShell } from "@/components/layout/auth-layout";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupPage() {
  const { setup } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = React.useState("owner");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      toast.push("error", t("usernameMin"));
      return;
    }
    if (password.length < 6) {
      toast.push("error", t("passwordMin"));
      return;
    }
    if (password !== confirm) {
      toast.push("error", t("passwordsMismatch"));
      return;
    }
    setLoading(true);
    try {
      await setup(username, password);
      toast.push("success", t("panelInitialized"));
      navigate("/");
    } catch (err) {
      toast.push("error", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    { icon: Rocket, text: t("oneClickDeploy") },
    { icon: Globe2, text: t("protocolsFeature") },
    { icon: ShieldCheck, text: t("tlsFeature") },
    { icon: Server, text: t("xrayAutoFetch") },
  ];

  return (
    <AuthShell heading={t("firstSetup")} sub={t("createOwner")} highlights={highlights}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="username">{t("ownerUsername")}</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder={t("atLeast6")}
              className="px-9"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 transition-colors hover:text-text"
              tabIndex={-1}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("confirmPassword")}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text/40" />
            <Input
              id="confirm"
              type={showPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("creating") : t("createAccount")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
}
