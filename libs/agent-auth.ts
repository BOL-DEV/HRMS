import { getJson, postJson } from "@/libs/api";
import { getAgentAccessToken } from "@/libs/auth";
import type {
  AgentDashboardPeriod,
  AgentDashboardResponse,
  AgentDepartmentsResponse,
  AgentLoginPayload,
  AgentLoginResponse,
  AgentProfileResponse,
  AgentReceiptPrintPayload,
  AgentReceiptPrintResponse,
  AgentReceiptReprintRequestPayload,
  AgentReceiptReprintRequestResponse,
  AgentReceiptsResponse,
  AgentTransactionsResponse,
  AgentTransactionsTimePeriod,
  ProcessPaymentPayload,
  ProcessPaymentResponse,
  AgentReceiptSearchType,
} from "@/libs/type";

export async function loginAgent(payload: AgentLoginPayload) {
  return postJson<AgentLoginResponse>("/api/auth/login", payload);
}

export async function getAgentDashboard(timePeriod: AgentDashboardPeriod) {
  const accessToken = getAgentAccessToken();

  if (!accessToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  return getJson<AgentDashboardResponse>(
    `/api/agent/dashboard?time_period=${timePeriod}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function getAgentProfile() {
  return getJson<AgentProfileResponse>("/api/agent/profile", {
    headers: getAgentAuthHeaders(),
  });
}

function getAgentAuthHeaders() {
  const accessToken = getAgentAccessToken();

  if (!accessToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function getAgentDepartments() {
  return getJson<AgentDepartmentsResponse>("/api/agent/departments", {
    headers: getAgentAuthHeaders(),
  });
}

export async function getAgentTransactions(params: {
  timePeriod: AgentTransactionsTimePeriod;
  paymentType?: string;
  revenueHead?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams({
    time_period: params.timePeriod,
    page: String(params.page ?? 1),
  });

  if (params.paymentType && params.paymentType !== "all") {
    searchParams.set("payment_type", params.paymentType);
  }

  if (params.revenueHead && params.revenueHead !== "all") {
    searchParams.set("revenue_head", params.revenueHead);
  }

  return getJson<AgentTransactionsResponse>(
    `/api/agent/transactions?${searchParams.toString()}`,
    {
      headers: getAgentAuthHeaders(),
    },
  );
}

export async function processAgentPayment(payload: ProcessPaymentPayload) {
  return postJson<ProcessPaymentResponse>("/api/payments/process", payload, {
    headers: getAgentAuthHeaders(),
  });
}

export async function getAgentReceipts(params: {
  searchType?: AgentReceiptSearchType;
  searchValue?: string;
  timePeriod: AgentTransactionsTimePeriod;
  page?: number;
}) {
  const searchParams = new URLSearchParams({
    time_period: params.timePeriod,
    page: String(params.page ?? 1),
  });

  if (params.searchType && params.searchValue?.trim()) {
    searchParams.set("search_type", params.searchType);
    searchParams.set("search_value", params.searchValue.trim());
  }

  return getJson<AgentReceiptsResponse>(
    `/api/agent/receipts?${searchParams.toString()}`,
    {
      headers: getAgentAuthHeaders(),
    },
  );
}

export async function requestAgentReceiptReprint(
  payload: AgentReceiptReprintRequestPayload,
) {
  return postJson<AgentReceiptReprintRequestResponse>(
    "/api/agent/receipts/request-reprint",
    payload,
    {
      headers: getAgentAuthHeaders(),
    },
  );
}

export async function printApprovedAgentReceipt(
  payload: AgentReceiptPrintPayload,
) {
  return postJson<AgentReceiptPrintResponse>(
    "/api/agent/receipts/print-approved",
    payload,
    {
      headers: getAgentAuthHeaders(),
    },
  );
}
