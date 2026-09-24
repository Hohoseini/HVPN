import * as React from "react";
import { Github, Star, Tag, Languages, Send } from "lucide-react";
import { RailLogo } from "@/components/rail-logo";
import { useGitHubStars } from "@/components/github-button";
import { useToast } from "@/components/ui/toast";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";
import { GITHUB_URL, GITHUB_REPO, TELEGRAM_URL, PANEL_VERSION } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * A bold, modern shell for the Setup and Login pages. A split layout: a loud
 * neobrutalist brand panel on the left (desktop) and a frosted form panel on
 * the right. On mobile it stacks into a single centred column. Includes the
 * GitHub / version / language controls at the bottom.
 */
export function AuthShell({
  children,
  heading,
  sub,
  highlights,
}: {
  children: React.ReactNode;
  heading: string;
  sub: string;
  highlights?: { icon: React.ElementType; text: string }[];
}) {
  const { lang, setLang, t } = useI18n();
  const toast = useToast();
  const stars = useGitHubStars();

  const changeLang = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    toast.push("success", t("languageChanged"));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      {/* animated blobs + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-50" />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-main/30 blur-[110px] animate-[drift1_26s_ease-in-out_infinite]" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-sky-400/25 blur-[120px] animate-[drift2_32s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] left-1/3 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-[110px] animate-[drift3_36s_ease-in-out_infinite]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4 lg:p-8">
        <div className="grid w-full overflow-hidden rounded-base border-2 border-border neo-shadow lg:grid-cols-[1.05fr_1fr]">
          {/* Brand / hero panel */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-main p-10 text-mtext lg:flex">
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(45deg,transparent,transparent_14px,rgba(0,0,0,.4)_14px,rgba(0,0,0,.4)_15px)]" />
            <div className="relative flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-base border-2 border-border bg-bw text-main neo-shadow animate-float">
                <RailLogo className="h-8 w-8" />
              </div>
              <div>
                <div className="font-heading text-4xl leading-none tracking-tight">HVPN</div>
                <div className="mt-1 text-sm font-base text-mtext/70">
                  Xray-core management panel
                </div>
              </div>
            </div>

            <div className="relative space-y-4">
              <h2 className="max-w-[16ch] font-heading text-3xl leading-tight">{heading}</h2>
              <p className="max-w-[34ch] font-base text-mtext/80">{sub}</p>
              {highlights && (
                <ul className="space-y-2.5 pt-2">
                  {highlights.map((h, i) => (
                    <li
                      key={h.text}
                      className="flex items-center gap-3 animate-slide-up"
                      style={{ animationDelay: `${120 + i * 90}ms` }}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-base border-2 border-border bg-bw text-main">
                        <h.icon className="h-4 w-4" />
                      </span>
                      <span className="font-base text-mtext/90">{h.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative text-xs font-heading uppercase tracking-widest text-mtext/50">
              © {new Date().getFullYear()} Hohoseini
            </div>
          </div>

          {/* Form panel */}
          <div className="flex flex-col justify-center gap-6 bg-bw/85 p-6 backdrop-blur-xl sm:p-10">
            <div className="animate-slide-up">
              <div className="mb-5 flex items-center gap-3 lg:hidden">
                <div className="grid h-12 w-12 place-items-center rounded-base border-2 border-border bg-main text-mtext neo-shadow animate-float">
                  <RailLogo className="h-7 w-7" />
                </div>
                <div className="font-heading text-2xl tracking-tight">HVPN</div>
              </div>
              <h1 className="font-heading text-3xl tracking-tight">{heading}</h1>
              <p className="mt-1 text-sm font-base text-text/60">{sub}</p>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
              {children}
            </div>

            <div className="flex flex-col gap-2 animate-slide-up" style={{ animationDelay: "160ms" }}>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-base border-2 border-border bg-bw px-3 py-2 font-heading text-xs text-text/80 transition-all hover:-translate-y-0.5 hover:bg-main hover:text-mtext hover:neo-shadow"
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
                  className="flex items-center justify-center gap-1.5 rounded-base border-2 border-border bg-bw px-3 py-2 font-heading text-xs text-text/80 transition-all hover:-translate-y-0.5 hover:bg-main hover:text-mtext hover:neo-shadow"
                >
                  <Send className="h-4 w-4 shrink-0" />
                  <span className="truncate">Telegram</span>
                </a>
                <a
                  href={`${GITHUB_URL}/releases`}
                  target="_blank"
                  rel="noreferrer"
                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-base border-2 border-border bg-bw px-3 py-2 font-heading text-xs text-text/80 transition-all hover:-translate-y-0.5 hover:bg-main hover:text-mtext hover:neo-shadow"
                >
                  <Tag className="h-4 w-4 shrink-0" />
                  <span className="truncate">v{PANEL_VERSION}</span>
                </a>
              </div>

              <div className="flex items-center gap-1 rounded-base border-2 border-border bg-bw p-1">
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
          </div>
        </div>
      </div>
    </div>
  );
}
