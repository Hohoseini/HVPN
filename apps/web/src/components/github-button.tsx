import * as React from "react";
import { Github, Star } from "lucide-react";
import { GITHUB_URL, GITHUB_REPO } from "@/lib/brand";
import { cn } from "@/lib/utils";

let cachedStars: number | null = null;
let cachedAt = 0;

async function fetchStars(): Promise<number | null> {
  try {
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
    if (!r.ok) return null;
    const d = await r.json();
    return typeof d.stargazers_count === "number" ? d.stargazers_count : null;
  } catch {
    return null;
  }
}

export function useGitHubStars() {
  const [stars, setStars] = React.useState<number | null>(cachedStars);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      if (cachedStars !== null && Date.now() - cachedAt < 300_000) {
        setStars(cachedStars);
        return;
      }
      const n = await fetchStars();
      if (active && n !== null) {
        cachedStars = n;
        cachedAt = Date.now();
        setStars(n);
      }
    };
    void load();
    const id = setInterval(() => void load(), 300_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return stars;
}

export function GitHubButton({
  className,
  showStars = true,
}: {
  className?: string;
  showStars?: boolean;
}) {
  const stars = useGitHubStars();
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-base border-2 border-border bg-bw px-3 py-1.5 text-sm font-heading transition-all hover:bg-main hover:text-mtext hover:neo-shadow",
        className,
      )}
    >
      <Github className="h-4 w-4" />
      <span>{GITHUB_REPO}</span>
      {showStars && stars !== null && (
        <span className="flex items-center gap-1 rounded-[4px] border-2 border-border bg-main px-1.5 text-mtext">
          <Star className="h-3 w-3" fill="currentColor" />
          {stars}
        </span>
      )}
    </a>
  );
}
