"use client";

import { getPowerPolicy } from "@/lib/runtime/app-power-mode";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DEBOUNCE_MS = 400;

interface UsePersistedDraftOptions {
  /** Current persisted value from props or database. */
  savedValue: string;
  /** Invoked when the draft should be written to storage. */
  onSave: (value: string) => void;
  /** Debounce interval before autosave (default 400ms). */
  debounceMs?: number;
  /** When this key changes, local draft resets to savedValue. */
  resetKey?: string;
  /** Normalize before comparing or saving (default: trim). */
  normalize?: (value: string) => string;
  /** Reject empty normalized values and revert draft to savedValue. */
  rejectEmpty?: boolean;
}

function defaultNormalize(value: string): string {
  return value.trim();
}

/** Debounced string draft with flush on page hide / visibility change. */
export function usePersistedDraft({
  savedValue,
  onSave,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  resetKey,
  normalize = defaultNormalize,
  rejectEmpty = true,
}: UsePersistedDraftOptions) {
  const [draft, setDraft] = useState(savedValue);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const savedRef = useRef(savedValue);
  savedRef.current = savedValue;

  useEffect(() => {
    setDraft(savedValue);
  }, [resetKey, savedValue]);

  const commitDraft = useCallback(
    (raw: string) => {
      const next = normalize(raw);
      const saved = normalize(savedRef.current);

      if (rejectEmpty && !next) {
        setDraft(savedRef.current);
        return;
      }

      if (next === saved) {
        return;
      }

      onSaveRef.current(raw);
    },
    [normalize, rejectEmpty],
  );

  useEffect(() => {
    const saved = normalize(savedRef.current);
    const next = normalize(draft);
    if (next === saved) {
      return;
    }
    if (rejectEmpty && !next) {
      return;
    }

    if (getPowerPolicy().deferNonCriticalWrites) {
      return;
    }

    const timer = window.setTimeout(() => {
      commitDraft(draft);
    }, debounceMs * getPowerPolicy().debounceMultiplier);

    return () => window.clearTimeout(timer);
  }, [draft, debounceMs, commitDraft, normalize, rejectEmpty]);

  useEffect(() => {
    const flush = () => commitDraft(draft);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [draft, commitDraft]);

  const handleBlur = useCallback(() => {
    commitDraft(draft);
  }, [draft, commitDraft]);

  return { draft, setDraft, handleBlur, commitDraft };
}

export interface GearItemFieldDraft {
  name: string;
  weight: string;
  storageLocation: string;
}

interface UsePersistedGearItemDraftOptions {
  item: {
    id: string;
    name: string;
    weight_lbs?: number;
    storageLocation?: string;
  };
  onSave: (patch: {
    name: string;
    weight_lbs?: number;
    storageLocation?: string;
  }) => void;
  debounceMs?: number;
}

function gearItemToDraft(item: UsePersistedGearItemDraftOptions["item"]): GearItemFieldDraft {
  return {
    name: item.name,
    weight: typeof item.weight_lbs === "number" ? String(item.weight_lbs) : "",
    storageLocation: item.storageLocation ?? "",
  };
}

function draftsEqual(a: GearItemFieldDraft, b: GearItemFieldDraft): boolean {
  return (
    a.name.trim() === b.name.trim() &&
    a.weight.trim() === b.weight.trim() &&
    a.storageLocation.trim() === b.storageLocation.trim()
  );
}

/** Debounced multi-field draft for gear line-item editors. */
export function usePersistedGearItemDraft({
  item,
  onSave,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UsePersistedGearItemDraftOptions) {
  const [draft, setDraft] = useState(() => gearItemToDraft(item));
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const savedRef = useRef(gearItemToDraft(item));

  useEffect(() => {
    const saved = gearItemToDraft(item);
    savedRef.current = saved;
    setDraft(saved);
  }, [item.id, item.name, item.weight_lbs, item.storageLocation]);

  const commitDraft = useCallback((raw: GearItemFieldDraft) => {
    const saved = savedRef.current;
    if (draftsEqual(raw, saved)) {
      return;
    }

    const weightValue = Number.parseFloat(raw.weight);
    onSaveRef.current({
      name: raw.name.trim() || saved.name,
      weight_lbs: Number.isFinite(weightValue) ? weightValue : undefined,
      storageLocation: raw.storageLocation.trim() || undefined,
    });
  }, []);

  useEffect(() => {
    if (draftsEqual(draft, savedRef.current)) {
      return;
    }

    if (getPowerPolicy().deferNonCriticalWrites) {
      return;
    }

    const timer = window.setTimeout(() => {
      commitDraft(draft);
    }, debounceMs * getPowerPolicy().debounceMultiplier);

    return () => window.clearTimeout(timer);
  }, [draft, debounceMs, commitDraft]);

  useEffect(() => {
    const flush = () => commitDraft(draft);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [draft, commitDraft]);

  const handleBlur = useCallback(() => {
    commitDraft(draft);
  }, [draft, commitDraft]);

  const setField = useCallback(
    <K extends keyof GearItemFieldDraft>(key: K, value: GearItemFieldDraft[K]) => {
      setDraft((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  return { draft, setField, handleBlur, commitDraft };
}
