import { getJson } from "@/libs/api";
import { getAccessToken } from "@/libs/auth";
import type { FoDashboardResponse, FoProfileResponse } from "@/libs/type";

function getFoAuthHeaders() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getFoDashboard() {
  return getJson<FoDashboardResponse>("/api/fo/dashboard", {
    headers: getFoAuthHeaders(),
  });
}

export async function getFoProfile() {
  return getJson<FoProfileResponse>("/api/fo/profile", {
    headers: getFoAuthHeaders(),
  });
}
