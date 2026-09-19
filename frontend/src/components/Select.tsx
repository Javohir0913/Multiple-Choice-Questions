import { useEffect, useRef, useState } from "react";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  value: T | "";
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A fully custom-styled dropdown, used instead of the native <select>.
 * Native <select> popups are rendered by the OS/browser chrome and often
 * ignore the page's `color-scheme` (e.g. a light popup list on a dark page
 * in some Chrome/Windows combinations), so we render our own listbox to
 * guarantee consistent light/dark theming everywhere.
 */
export function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Tanlang",
  disabled = false,
  className = "",
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-left transition-colors disabled:opacity-50 ${
          open ? "ring-2 ring-primary-500 border-primary-500" : ""
        }`}
      >
        <span className={selected ? "" : "text-gray-400"}>{selected ? selected.label : placeholder}</span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-xl bg-white/95 dark:bg-navy-800/95 backdrop-blur-xl shadow-apple-lg ring-1 ring-black/[0.06] dark:ring-white/[0.1] py-1">
          {options.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">Bo'sh</div>}
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                o.value === value
                  ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
                  : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
