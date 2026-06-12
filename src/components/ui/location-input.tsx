"use client";

import { geocodeLocation, searchGeocodeLocations } from "@/lib/weather";
import { isNetworkAvailable } from "@/lib/runtime/network-guard";
import type { TripLocation } from "@/types";
import { MapPin } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface LocationInputHandle {
  commitQuery: () => Promise<TripLocation | undefined>;
}

interface LocationInputProps {
  value: TripLocation | undefined;
  onChange: (location: TripLocation | undefined) => void;
  placeholder?: string;
  label?: string;
}

export const LocationInput = forwardRef<LocationInputHandle, LocationInputProps>(
  function LocationInput(
    {
      value,
      onChange,
      placeholder = "Moab",
      label = "Location (for weather)",
    },
    ref,
  ) {
    const listId = useId();
  const inputId = useId();
    const [text, setText] = useState(value?.query ?? "");
    const [suggestions, setSuggestions] = useState<
      Array<{ name: string; latitude: number; longitude: number }>
    >([]);
    const [open, setOpen] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [offlineHint, setOfflineHint] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestionsRef = useRef(suggestions);

    useEffect(() => {
      suggestionsRef.current = suggestions;
    }, [suggestions]);

    useEffect(() => {
      setText(value?.query ?? "");
    }, [value?.query]);

    const runSearch = useCallback(async (query: string) => {
      const q = query.trim();
      if (q.length < 2) {
        setSuggestions([]);
        setOfflineHint(false);
        return;
      }
      if (!isNetworkAvailable()) {
        setSuggestions([]);
        setOfflineHint(true);
        return;
      }
      setOfflineHint(false);
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

    const resolveTypedLocation = useCallback(async (): Promise<
      TripLocation | undefined
    > => {
      const q = text.trim();
      if (!q) {
        commitLocation(undefined);
        return undefined;
      }

      if (
        value?.latitude != null &&
        value.longitude != null &&
        value.query === q
      ) {
        return value;
      }

      const topSuggestion = suggestionsRef.current[0];
      if (topSuggestion) {
        const loc: TripLocation = {
          query: topSuggestion.name,
          latitude: topSuggestion.latitude,
          longitude: topSuggestion.longitude,
          resolvedName: topSuggestion.name,
        };
        commitLocation(loc);
        setOpen(false);
        setSuggestions([]);
        return loc;
      }

      setResolving(true);
      try {
        if (!isNetworkAvailable()) {
          const loc: TripLocation = { query: q };
          commitLocation(loc);
          setOfflineHint(true);
          return loc;
        }

        const geo = await geocodeLocation(q);
        if (geo) {
          const loc: TripLocation = {
            query: geo.name,
            latitude: geo.latitude,
            longitude: geo.longitude,
            resolvedName: geo.name,
          };
          commitLocation(loc);
          return loc;
        }
        const loc: TripLocation = { query: q };
        commitLocation(loc);
        return loc;
      } finally {
        setResolving(false);
        setOpen(false);
      }
    }, [text, value, commitLocation]);

    useImperativeHandle(
      ref,
      () => ({
        commitQuery: resolveTypedLocation,
      }),
      [resolveTypedLocation],
    );

    return (
      <div className="relative flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className="text-xs font-bold uppercase tracking-wide text-muted"
        >
          {label}
        </label>
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent"
            aria-hidden
          />
          <input
            id={inputId}
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
            aria-label={label}
          />
        </div>
        {resolving ? (
          <p className="text-xs font-semibold text-muted">Resolving location…</p>
        ) : offlineHint ? (
          <p className="text-xs font-semibold text-muted">
            Offline — saved name only; connect to match coordinates.
          </p>
        ) : value?.latitude != null ? (
          <p className="text-xs font-semibold text-accent">Location matched</p>
        ) : text.trim().length >= 2 ? (
          <p className="text-xs font-semibold text-muted">
            Press Enter to use the top match
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
  },
);
