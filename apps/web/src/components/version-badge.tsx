import { Tag } from "lucide-react";
import { GITHUB_URL, PANEL_VERSION } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function VersionBadge({ className }: { className?: string }) {
  return (
    <a
      href={`${GITHUB_URL}/releases`}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-base border-2 border-border bg-bw px-3 py-1.5 text-sm font-heading transition-all hover:bg-main hover:text-mtext hover:neo-shadow",
        className,
      )}
    >
      <Tag className="h-4 w-4" />
      <span>v{PANEL_VERSION}</span>
    </a>
  );
}
