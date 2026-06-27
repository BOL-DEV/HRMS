import type { AgentTokens } from "@/libs/type";

const ACCESS_TOKEN_KEY = "swiftrev.agent.access_token";
const REFRESH_TOKEN_KEY = "swiftrev.agent.refresh_token";
const CATALOG_DEMO_SESSION_KEY = "swiftrev.catalog.demo_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function canUseDocument() {
  return typeof document !== "undefined";
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getCookie(name: string) {
  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split("=")[1];

  return cookieValue ? decodeURIComponent(cookieValue) : null;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function setSessionFlag(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function getSessionFlag(name: string) {
  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split("=")[1];

  return cookieValue ? decodeURIComponent(cookieValue) : null;
}

export function storeAgentTokens(tokens: AgentTokens) {
  if (!canUseDocument()) {
    return;
  }

  setCookie(ACCESS_TOKEN_KEY, tokens.accessToken, COOKIE_MAX_AGE);
  setCookie(REFRESH_TOKEN_KEY, tokens.refreshToken, COOKIE_MAX_AGE);
}

export function getAgentAccessToken() {
  if (!canUseDocument()) {
    return null;
  }

  return getCookie(ACCESS_TOKEN_KEY);
}

export function getAgentRefreshToken() {
  if (!canUseDocument()) {
    return null;
  }

  return getCookie(REFRESH_TOKEN_KEY);
}

export function clearAgentTokens() {
  if (!canUseDocument()) {
    return;
  }

  removeCookie(ACCESS_TOKEN_KEY);
  removeCookie(REFRESH_TOKEN_KEY);
}

export function getAccessToken() {
  return getAgentAccessToken();
}

export function clearAuthTokens() {
  clearAgentTokens();
  clearCatalogDemoSession();
}

export function storeCatalogDemoSession() {
  if (!canUseDocument()) {
    return;
  }

  setSessionFlag(CATALOG_DEMO_SESSION_KEY, "true");
}

export function getCatalogDemoSession() {
  if (!canUseDocument()) {
    return false;
  }

  return getSessionFlag(CATALOG_DEMO_SESSION_KEY) === "true";
}

export function clearCatalogDemoSession() {
  if (!canUseDocument()) {
    return;
  }

  removeCookie(CATALOG_DEMO_SESSION_KEY);
}
