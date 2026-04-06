export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "swiftrev.theme";
export const THEME_CHANGE_EVENT = "swiftrev-theme-change";

export function normalizeTheme(value: string | null | undefined): ThemeMode | null {
  if (value === "dark" || value === "light") {
    return value;
  }

  return null;
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function getInitialTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme();
}

export function getThemeSnapshot(): ThemeMode {
  if (typeof document !== "undefined") {
    const themeFromDom = normalizeTheme(
      document.documentElement.dataset.theme ?? null,
    );

    if (themeFromDom) {
      return themeFromDom;
    }
  }

  return getInitialTheme();
}

export function getServerThemeSnapshot(): ThemeMode {
  return "light";
}

export function subscribeToTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const handleThemeChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  };
}

export function applyTheme(theme: ThemeMode, options?: { persist?: boolean }): void {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
  }

  if (options?.persist !== false && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }
}
