"use client";

import { useMemo, useSyncExternalStore } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import {
  applyTheme,
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeToTheme,
} from "@/libs/theme";

export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const nextTheme = useMemo(
    () => (theme === "dark" ? "light" : "dark"),
    [theme],
  );

  const handleToggle = () => {
    applyTheme(nextTheme);
  };

  const Icon = theme === "dark" ? FiMoon : FiSun;
  const label = theme === "dark" ? "Dark mode" : "Light mode";

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <Icon className="text-lg" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
