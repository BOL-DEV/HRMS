"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface PersistedFormOptions<T> {
  key: string;
  initialValue: T;
  enabled?: boolean;
  version?: string | number;
}

/**
 * Persists form state in localStorage so drafts are preserved across sudden logouts or page refreshes.
 * Call clearPersistedDraft() or resetForm() upon successful form completion.
 */
export function usePersistedFormState<T>(options: PersistedFormOptions<T>) {
  const { key, initialValue, enabled = true, version = 1 } = options;
  const storageKey = `hrms_draft_${key}_v${version}`;

  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined" || !enabled) return initialValue;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof initialValue === "object" &&
          initialValue !== null &&
          !Array.isArray(initialValue) &&
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          return { ...initialValue, ...parsed };
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return initialValue;
  });

  const isInitial = useRef(true);

  // Sync to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;

    if (isInitial.current) {
      isInitial.current = false;
      return;
    }

    try {
      if (state === undefined || state === null) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(state));
      }
    } catch (e) {
      console.warn("Failed to persist form draft to localStorage:", e);
    }
  }, [state, storageKey, enabled]);

  const clearPersistedDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  }, [storageKey]);

  const resetForm = useCallback(() => {
    clearPersistedDraft();
    setState(initialValue);
  }, [clearPersistedDraft, initialValue]);

  return [state, setState, clearPersistedDraft, resetForm] as const;
}

export default usePersistedFormState;
