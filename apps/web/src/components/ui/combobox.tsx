import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface ComboItem {
  value: string;
  label: string;
  group?: string;
}

interface MultiComboboxProps {
  items: ComboItem[];
  selected: string[];
  onChange: (values: string[]) => void;
  labels: Record<string, string>;
  placeholder?: string;
}

export function MultiCombobox({
  items,
  selected,
  onChange,
  labels,
  placeholder = "Search or type…",
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = items.filter(
    (i) =>
      !selected.includes(i.value) &&
      (i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.value.toLowerCase().includes(query.toLowerCase())),
  );

  const groups = filtered.reduce<Record<string, ComboItem[]>>((acc, i) => {
    const g = i.group || "";
    (acc[g] ||= []).push(i);
    return acc;
  }, {});

  const add = (value: string, label?: string) => {
    const v = value.trim();
    if (!v || selected.includes(v)) return;
    onChange([...selected, v]);
    if (label) labels[v] = label;
    setQuery("");
  };

  const remove = (value: string) => onChange(selected.filter((v) => v !== value));

  const labelOf = (v: string) => labels[v] || items.find((i) => i.value === v)?.label || v;

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-base border-2 border-border bg-bw px-2 py-1.5"
      >
        {selected.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-[6px] border-2 border-border bg-main px-2 py-0.5 text-xs font-heading text-mtext"
          >
            {labelOf(v)}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(v);
              }}
              className="opacity-70 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex min-w-[80px] flex-1 items-center gap-1">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered.length > 0) add(filtered[0].value, filtered[0].label);
                else if (query.trim()) add(query.trim());
              } else if (e.key === "Backspace" && !query && selected.length > 0) {
                remove(selected[selected.length - 1]);
              }
            }}
            placeholder={selected.length === 0 ? placeholder : ""}
            className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-text/40"
          />
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-base border-2 border-border bg-bw neo-shadow animate-pop-in">
          <div className="flex items-center gap-2 border-b-2 border-border/40 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-text/50" />
            <span className="text-xs text-text/50">
              {query.trim() ? `Press Enter to add “${query.trim()}”` : "Pick presets or type your own"}
            </span>
          </div>
          <div className="no-scrollbar max-h-56 overflow-y-auto p-1">
            {Object.entries(groups).map(([g, list]) => (
              <div key={g}>
                {g && (
                  <div className="px-2 py-1 text-[10px] font-heading uppercase tracking-widest text-text/40">
                    {g}
                  </div>
                )}
                {list.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => add(item.value, item.label)}
                    className="flex w-full items-center justify-between gap-2 rounded-[4px] px-2 py-2 text-left text-sm font-base transition-colors hover:bg-main/15"
                  >
                    <span className="truncate">{item.label}</span>
                    <Check className="h-4 w-4 shrink-0 opacity-0" />
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-center text-xs text-text/50">
                {query.trim() ? (
                  <button
                    type="button"
                    onClick={() => add(query.trim())}
                    className="w-full rounded-[4px] px-2 py-2 font-heading hover:bg-main/15"
                  >
                    Add “{query.trim()}”
                  </button>
                ) : (
                  "No more presets"
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
