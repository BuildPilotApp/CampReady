"use client";

import { geocodeLocation, searchGeocodeLocations } from "@/lib/weather";
import type { TripLocation } from "@/types";
import { MapPin } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

interface LocationInputProps {
  value: TripLocation | undefined;
  onChange: (location: TripLocation | undefined) => void;
  placeholder?: string;
  label?: string;
}

export function LocationInput({
  value,
  onChange,
  placeholder = "Moab",
  label = "Location (for weather)",
}: LocationInputProps) {
  const listId = useId();
  const [text, setText] = useState(value?.query ?? "");
  const [suggestions, setSuggestions] = useState<
    Array<{ name: string; latitude: number; longitude: number }>
  >([]);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(value?.query ?? "");
  }, [value?.query]);

  const runSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const results = await searchGeocodeLocations(q, 6);
    setSuggestions(results);
    setOpen(results.length > 0);
  }, []);

  const commitLocation = useCallback(
    (loc: TripLocation | undefined) => {
      onChange(loc);
      if (loc?.query) setText(loc.query);
    },
    [onChange],
  );

  const selectSuggestion = useCallback(
    (suggestion: { name: string; latitude: number; longitude: number }) => {
      commitLocation({
        query: suggestion.name,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        resolvedName: suggestion.name,
      });
      setOpen(false);
      setSuggestions([]);
    },
    [commitLocation],
  );

  const resolveTypedLocation = useCallback(async () => {
    const q = text.trim();
    if (!q) {
      commitLocation(undefined);
      return;
    }

    if (
      value?.latitude != null &&
      value.longitude != null &&
      value.query === q
    ) {
      return;
    }

    setResolving(true);
    try {
      const geo = await geocodeLocation(q);
      if (geo) {
        commitLocation({
          query: geo.name,
          latitude: geo.latitude,
          longitude: geo.longitude,
          resolvedName: geo.name,
        });
      } else {
        commitLocation({ query: q });
      }
    } finally {
      setResolving(false);
      setOpen(false);
    }
  }, [text, value, commitLocation]);

  return (
    <div className="relative flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent"
          aria-hidden
        />
        <input
          value={text}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              void runSearch(next);
            }, 350);
            if (!next.trim()) {
              commitLocation(undefined);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setOpen(false);
              void resolveTypedLocation();
            }, 200);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void resolveTypedLocation();
            }
          }}
          className="touch-target w-full rounded-xl border-2 border-border bg-background py-3 pl-10 pr-3 text-base font-medium text-foreground"
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listId}
        />
      </div>
      {resolving ? (
        <p className="text-xs font-semibold text-muted">Resolving location…</p>
      ) : value?.latitude != null ? (
        <p className="text-xs font-semibold text-accent">Location matched</p>
      ) : text.trim().length >= 2 ? (
        <p className="text-xs font-semibold text-muted">
          Select a suggestion or press Enter to match
        </p>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border-2 border-border bg-surface shadow-lg"
        >
          {suggestions.map((s) => (
            <li key={`${s.latitude}-${s.longitude}-${s.name}`}>
              <button
                type="button"
                className="flex min-h-12 w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-foreground active:bg-background"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
              >
                <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
                <span className="truncate">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
