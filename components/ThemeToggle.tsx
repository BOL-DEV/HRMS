"use client";

import { useEffect, useMemo, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import {
  applyTheme,
  getInitialTheme,
  normalizeTheme,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/libs/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  const nextTheme = useMemo<ThemeMode>(
    () => (theme === "dark" ? "light" : "dark"),
    [theme],
  );

  useEffect(() => {
    const themeFromDom = normalizeTheme(
      document.documentElement.dataset.theme ?? null,
    );
    const resolved = themeFromDom ?? getInitialTheme();

    setTheme(resolved);
    applyTheme(resolved, { persist: false });

    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const incoming = normalizeTheme(event.newValue);
      if (!incoming) {
        return;
      }

      setTheme(incoming);
      applyTheme(incoming, { persist: false });
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleToggle = () => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const Icon = theme === "dark" ? FiMoon : FiSun;
  const label = theme === "dark" ? "Dark mode" : "Light mode";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <Icon className="text-lg" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
