"use client";

import { useEffect, useRef, useState } from "react";

type Option = { id: string; name: string };

/**
 * A custom combobox: tapping the field opens one popup panel with the
 * search box docked at the top and the filtered option list directly
 * below it, all in a single dropdown surface (not a native OS picker with
 * a separate search field floating above it). Renders no native <select>,
 * so it fully controls its own popup instead of handing rendering off to
 * the OS/browser.
 */
export function SearchableSelect({
  name,
  options,
  defaultValue,
  required,
  autoSubmit,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  className,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  required?: boolean;
  autoSubmit?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const selectedName = options.find((option) => option.id === selectedId)?.name;
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((option) => option.name.toLowerCase().includes(q)) : options;

  // Close on outside click/tap.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  // Reset the search text and focus it every time the panel opens (query
  // is cleared by the toggle handler, not here, to avoid setState-in-effect).
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) setQuery("");
      return next;
    });
  }

  function selectOption(id: string) {
    setSelectedId(id);
    setOpen(false);
    if (autoSubmit) {
      requestAnimationFrame(() => hiddenRef.current?.form?.requestSubmit());
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) selectOption(filtered[0].id);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input ref={hiddenRef} type="hidden" name={name} value={selectedId} required={required} />
      <button
        type="button"
        onClick={toggleOpen}
        className={`${className ?? ""} flex items-center justify-between gap-2`}
      >
        <span className={selectedName ? "" : "text-slate-500"}>{selectedName ?? placeholder}</span>
        <span aria-hidden className="text-slate-500">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
          <div className="relative border-b border-slate-700">
            <input
              ref={searchRef}
              type="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-900 py-3 pl-4 pr-10 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 active:bg-slate-800"
              >
                ✕
              </button>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-500">No matches for &quot;{query}&quot;.</li>
            )}
            {filtered.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => selectOption(option.id)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-base text-slate-100 active:bg-slate-800"
                >
                  <span className="w-4 shrink-0 text-slate-100">{option.id === selectedId ? "✓" : ""}</span>
                  {option.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
