import * as React from "react";

const PREFIX = "wd:";

export function storageKey(suffix: string): string {
  return `${PREFIX}${suffix}`;
}

/**
 * useState backed by localStorage. The value persists across navigations and
 * page reloads. SSR-safe: starts with `initial` and hydrates from storage on
 * mount.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const fullKey = storageKey(key);
  const [value, setValue] = React.useState<T>(initial);
  const hydrated = React.useRef(false);

  // Hydrate from storage on mount and whenever key changes.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (raw != null) {
        setValue(JSON.parse(raw) as T);
      } else {
        setValue(initial);
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  // Persist on change (after hydration).
  React.useEffect(() => {
    if (!hydrated.current || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [fullKey, value]);

  // React to external imports (storage event from save-file load).
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<{ key?: string }>).detail;
      if (detail?.key && detail.key !== fullKey) return;
      try {
        const raw = window.localStorage.getItem(fullKey);
        if (raw != null) setValue(JSON.parse(raw) as T);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("wd:storage-sync", onSync);
    return () => window.removeEventListener("wd:storage-sync", onSync);
  }, [fullKey]);

  return [value, setValue];
}

/** Snapshot all Wealth Deck state keys into a plain object. */
export function snapshotAll(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  const out: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith(PREFIX)) continue;
    try {
      const raw = window.localStorage.getItem(k);
      if (raw != null) out[k] = JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }
  return out;
}

/** Replace all Wealth Deck state keys from a snapshot object. */
export function restoreAll(data: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  // Remove existing wd:* keys first.
  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(PREFIX)) toRemove.push(k);
  }
  toRemove.forEach((k) => window.localStorage.removeItem(k));
  // Write new keys.
  Object.entries(data).forEach(([k, v]) => {
    if (!k.startsWith(PREFIX)) return;
    try {
      window.localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  });
  // Notify subscribers.
  window.dispatchEvent(new CustomEvent("wd:storage-sync"));
}
