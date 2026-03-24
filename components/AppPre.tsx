"use client";

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { applyTheme, getInitialTheme, type ThemeMode } from "@/libs/theme";

function AppPre() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const defaultRange = "This Month";

  useEffect(() => {
    applyTheme(theme, { persist: false });
  }, [theme]);

  const handleThemeToggle = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            App Preferences
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Local preferences for the agent workspace
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => handleThemeToggle("light")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              theme === "light"
                ? "bg-white text-blue-700 shadow dark:bg-slate-700 dark:text-sky-300"
                : "text-gray-700 dark:text-slate-300"
            }`}
            type="button"
          >
            <FiSun /> Light
          </button>
          <button
            onClick={() => handleThemeToggle("dark")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              theme === "dark"
                ? "bg-white text-blue-700 shadow dark:bg-slate-700 dark:text-sky-300"
                : "text-gray-700 dark:text-slate-300"
            }`}
            type="button"
          >
            <FiMoon /> Dark
          </button>
        </div>
      </div>
    </section>
  );
}

export default AppPre;
