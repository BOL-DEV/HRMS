import { postJson } from "@/libs/api";
import { getAccessToken } from "@/libs/auth";
import type { UpdatePasswordPayload, UpdatePasswordResponse } from "@/libs/type";

function getAuthHeaders() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function updateAccountPassword(payload: UpdatePasswordPayload) {
  return postJson<UpdatePasswordResponse>("/api/auth/update", payload, {
    headers: getAuthHeaders(),
  });
}
