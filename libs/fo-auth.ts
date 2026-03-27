import { getJson, patchJson, postJson } from "@/libs/api";
import { getAccessToken } from "@/libs/auth";
import type {
  CreateFoAgentPayload,
  CreateFoAgentResponse,
  FoAgentsResponse,
  FoAgentStatus,
  FoDashboardResponse,
  FoProfileResponse,
  FoReceiptDecisionResponse,
  FoReceiptFilter,
  FoReceiptsResponse,
  FoReportsResponse,
  FoStatsResponse,
  FoStatsTimePeriod,
  UpdateFoAgentStatusResponse,
} from "@/libs/type";

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

export async function getFoAgents(params?: {
  search?: string;
  status?: FoAgentStatus | "all";
}) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params?.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<FoAgentsResponse>(`/api/fo/agents${suffix}`, {
    headers: getFoAuthHeaders(),
  });
}

export async function updateFoAgentStatus(
  agentId: string,
  status: FoAgentStatus,
) {
  return patchJson<UpdateFoAgentStatusResponse>(
    `/api/fo/agents/${agentId}/status`,
    { status },
    {
      headers: getFoAuthHeaders(),
    },
  );
}

export async function getFoReports(params?: {
  startDate?: string;
  endDate?: string;
  departments?: string[];
  agents?: string[];
}) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.departments?.length) {
    query.set("departments", params.departments.join(","));
  }

  if (params?.agents?.length) {
    query.set("agents", params.agents.join(","));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return getJson<FoReportsResponse>(`/api/fo/reports${suffix}`, {
    headers: getFoAuthHeaders(),
  });
}

export async function getFoStats(timePeriod: FoStatsTimePeriod = "today") {
  const query = new URLSearchParams({ time_period: timePeriod });

  return getJson<FoStatsResponse>(`/api/fo/stats?${query.toString()}`, {
    headers: getFoAuthHeaders(),
  });
}

export async function getFoReceipts(status: FoReceiptFilter = "all") {
  const query = new URLSearchParams({ status });

  return getJson<FoReceiptsResponse>(`/api/fo/receipts?${query.toString()}`, {
    headers: getFoAuthHeaders(),
  });
}

export async function approveFoReceipt(requestId: string) {
  return postJson<FoReceiptDecisionResponse>(
    "/api/fo/receipts/approve",
    { request_id: requestId },
    {
      headers: getFoAuthHeaders(),
    },
  );
}

export async function rejectFoReceipt(requestId: string) {
  return postJson<FoReceiptDecisionResponse>(
    "/api/fo/receipts/reject",
    { request_id: requestId },
    {
      headers: getFoAuthHeaders(),
    },
  );
}

export async function createFoAgent(payload: CreateFoAgentPayload) {
  return postJson<CreateFoAgentResponse>("/api/fo/create", payload, {
    headers: getFoAuthHeaders(),
  });
}
