import { getJson, postJson } from "@/libs/api";
import {
  clearAgentTokens,
  getAgentAccessToken,
  getAgentRefreshToken,
  storeAgentTokens,
} from "@/libs/auth";
import type {
  AgentBillItemsResponse,
  AgentDashboardPeriod,
  AgentDashboardResponse,
  AgentDepartmentsResponse,
  AgentIncomeHeadsResponse,
  AgentLoginPayload,
  AgentLoginResponse,
  AgentPatientLookupResponse,
  AgentPaymentConfigResponse,
  AgentProfileResponse,
  AgentReceiptPrintPayload,
  AgentReceiptPrintResponse,
  AgentReceiptReprintRequestPayload,
  AgentReceiptReprintRequestResponse,
  AgentReceiptSearchType,
  AgentTransactionsResponse,
  AgentTransactionsTimePeriod,
  AuthRefreshResponse,
  ProcessPaymentPayload,
  ProcessPaymentResponse,
  AgentReceiptsResponse,
} from "@/libs/type";
import { ApiError } from "@/libs/api";

export async function loginAgent(payload: AgentLoginPayload) {
  return postJson<AgentLoginResponse>("/api/auth/login", payload);
}

function getAgentAuthHeaders(accessToken?: string) {
  const token = accessToken ?? getAgentAccessToken();

  if (!token) {
    throw new Error("Your session has expired. Please login again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function refreshAgentSession() {
  const refreshToken = getAgentRefreshToken();

  if (!refreshToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  const response = await postJson<AuthRefreshResponse>("/api/auth/refresh", {
    refreshToken,
  });

  const tokens = response.data;

  if (!tokens?.accessToken || !tokens.refreshToken) {
    throw new Error("Unable to refresh your session. Please login again.");
  }

  storeAgentTokens(tokens);

  return tokens.accessToken;
}

async function withAgentSessionRetry<T>(request: (accessToken: string) => Promise<T>) {
  const accessToken = getAgentAccessToken();

  if (!accessToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  try {
    return await request(accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    try {
      const nextAccessToken = await refreshAgentSession();
      return await request(nextAccessToken);
    } catch (refreshError) {
      clearAgentTokens();
      throw refreshError;
    }
  }
}

export async function getAgentDashboard(timePeriod: AgentDashboardPeriod) {
  return withAgentSessionRetry((accessToken) =>
    getJson<AgentDashboardResponse>(
      `/api/agent/dashboard?time_period=${timePeriod}`,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}

export async function getAgentProfile() {
  return withAgentSessionRetry((accessToken) =>
    getJson<AgentProfileResponse>("/api/agent/profile", {
      headers: getAgentAuthHeaders(accessToken),
    }),
  );
}

export async function logoutAgent() {
  return withAgentSessionRetry((accessToken) =>
    getJson<{ status: number; message: string; data: null }>("/api/auth/logout", {
      headers: getAgentAuthHeaders(accessToken),
    }),
  );
}

export async function getAgentDepartments() {
  return withAgentSessionRetry((accessToken) =>
    getJson<AgentDepartmentsResponse>("/api/agent/departments", {
      headers: getAgentAuthHeaders(accessToken),
    }),
  );
}

export async function getAgentPaymentConfig() {
  return withAgentSessionRetry((accessToken) =>
    getJson<AgentPaymentConfigResponse>("/api/agent/payment-config", {
      headers: getAgentAuthHeaders(accessToken),
    }),
  );
}

export async function lookupAgentPatient(patientId: string) {
  return withAgentSessionRetry((accessToken) =>
    getJson<AgentPatientLookupResponse>(`/api/agent/patients/${patientId}`, {
      headers: getAgentAuthHeaders(accessToken),
    }),
  );
}

export async function getAgentIncomeHeads(departmentId: string) {
  const searchParams = new URLSearchParams({
    department_id: departmentId,
  });

  return withAgentSessionRetry((accessToken) =>
    getJson<AgentIncomeHeadsResponse>(
      `/api/agent/income-heads?${searchParams.toString()}`,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}

export async function getAgentBillItems(params: {
  departmentId: string;
  incomeHeadId?: string;
  billName?: string;
}) {
  const searchParams = new URLSearchParams({
    department_id: params.departmentId,
  });

  if (params.incomeHeadId) {
    searchParams.set("income_head_id", params.incomeHeadId);
  }

  if (params.billName?.trim()) {
    searchParams.set("bill_name", params.billName.trim());
  }

  return withAgentSessionRetry((accessToken) =>
    getJson<AgentBillItemsResponse>(
      `/api/agent/bill-items?${searchParams.toString()}`,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}

export async function getAgentTransactions(params: {
  timePeriod: AgentTransactionsTimePeriod;
  paymentType?: string;
  department?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams({
    time_period: params.timePeriod,
    page: String(params.page ?? 1),
  });

  if (params.paymentType && params.paymentType !== "all") {
    searchParams.set("payment_type", params.paymentType);
  }

  if (params.department && params.department !== "all") {
    searchParams.set("department", params.department);
  }

  return withAgentSessionRetry((accessToken) =>
    getJson<AgentTransactionsResponse>(
      `/api/agent/transactions?${searchParams.toString()}`,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}

export async function processAgentPayment(payload: ProcessPaymentPayload) {
  return withAgentSessionRetry((accessToken) =>
    postJson<ProcessPaymentResponse>("/api/payments/process", payload, {
      headers: getAgentAuthHeaders(accessToken),
    }),
  );
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

  return withAgentSessionRetry((accessToken) =>
    getJson<AgentReceiptsResponse>(
      `/api/agent/receipts?${searchParams.toString()}`,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}

export async function requestAgentReceiptReprint(
  payload: AgentReceiptReprintRequestPayload,
) {
  return withAgentSessionRetry((accessToken) =>
    postJson<AgentReceiptReprintRequestResponse>(
      "/api/agent/receipts/request-reprint",
      payload,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}

export async function printApprovedAgentReceipt(
  payload: AgentReceiptPrintPayload,
) {
  return withAgentSessionRetry((accessToken) =>
    postJson<AgentReceiptPrintResponse>(
      "/api/agent/receipts/print-approved",
      payload,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}
