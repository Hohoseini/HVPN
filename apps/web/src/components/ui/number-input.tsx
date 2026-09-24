import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  className?: string;
  suffix?: string;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  id,
  className,
  suffix,
}: NumberInputProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const dec = () => onChange(clamp(Math.round((value - step) * 100) / 100));
  const inc = () => onChange(clamp(Math.round((value + step) * 100) / 100));

  return (
    <div
      className={cn(
        "flex h-10 items-stretch overflow-hidden rounded-base border-2 border-border bg-bw",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className="grid w-10 shrink-0 place-items-center border-r-2 border-border transition-colors hover:bg-main disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="flex flex-1 items-center justify-center gap-1 px-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^\d.]/g, ""));
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          className="w-full min-w-0 bg-transparent text-center text-sm font-heading text-text outline-none"
        />
        {suffix && <span className="shrink-0 text-xs font-base text-text/50">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className="grid w-10 shrink-0 place-items-center border-l-2 border-border transition-colors hover:bg-main disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
