"use client";

import { useEffect } from "react";
import { applyTheme, getInitialTheme } from "@/libs/theme";

export default function ThemeHydrationFix() {
  useEffect(() => {
    // Ensure the DOM reflects the persisted/system theme after hydration.
    // This prevents a post-hydration reset to light mode in some cases.
    applyTheme(getInitialTheme(), { persist: false });
  }, []);

  return null;
}
