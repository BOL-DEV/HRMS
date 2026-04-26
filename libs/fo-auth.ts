import {
  API_BASE_URL,
  ApiError,
  getJson,
  patchJson,
  postJson,
} from "@/libs/api";
import {
  clearAuthTokens,
  getAccessToken,
  getAgentRefreshToken,
  storeAgentTokens,
} from "@/libs/auth";
import {
  downloadBlobFile,
  openPrintWindowFromBlob,
  openPrintWindowFromHtml,
} from "@/libs/helper";
import type {
  AuthRefreshResponse,
  CreateFoAgentPayload,
  CreateFoAgentResponse,
  CreateFoBillItemPayload,
  CreateFoDepartmentPayload,
  CreateFoIncomeHeadPayload,
  FoAgentReportResponse,
  FoAgentStatus,
  FoAgentsResponse,
  FoBillItemMutationResponse,
  FoBillItemsResponse,
  FoDashboardResponse,
  FoDepartmentMutationResponse,
  FoDepartmentReportResponse,
  FoDepartmentsResponse,
  FoIncomeHeadMutationResponse,
  FoIncomeHeadsResponse,
  FoPatientReportResponse,
  FoProfileResponse,
  FoReportPaymentType,
  FoReceiptDecisionResponse,
  FoReceiptFilter,
  FoReceiptsResponse,
  FoReportsResponse,
  FoStatsResponse,
  FoStatsTimePeriod,
  FoTransactionsResponse,
  UpdateFoAgentStatusResponse,
  UpdateFoBillItemPayload,
  UpdateFoDepartmentPayload,
  UpdateFoIncomeHeadPayload,
} from "@/libs/type";

function getFoAuthHeaders(accessToken?: string) {
  const token = accessToken ?? getAccessToken();

  if (!token) {
    throw new Error("Your session has expired. Please login again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function refreshFoSession() {
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

async function withFoSessionRetry<T>(request: (accessToken: string) => Promise<T>) {
  const accessToken = getAccessToken();

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
      const nextAccessToken = await refreshFoSession();
      return await request(nextAccessToken);
    } catch (refreshError) {
      clearAuthTokens();
      throw refreshError;
    }
  }
}

async function fetchFoDocument(endpoint: string, accessToken: string) {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        ...getFoAuthHeaders(accessToken),
      },
    });
  } catch (error) {
    throw new Error("Failed to fetch.", {
      cause: error,
    });
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      error?: string;
    } | null;

    throw new ApiError(
      payload?.message ?? payload?.error ?? "Request failed.",
      response.status,
    );
  }

  return response;
}

function getFilenameFromDisposition(
  contentDisposition: string | null,
  fallback: string,
) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? fallback;
}

async function downloadFoDocument(
  endpoint: string,
  fallbackFilename: string,
  accessToken: string,
) {
  const response = await fetchFoDocument(endpoint, accessToken);
  const blob = await response.blob();
  const filename = getFilenameFromDisposition(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );

  downloadBlobFile(blob, filename);
}

async function printFoDocument(endpoint: string, accessToken: string) {
  const response = await fetchFoDocument(endpoint, accessToken);
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("text/html") || contentType.includes("text/plain")) {
    const html = await response.text();
    const didOpen = openPrintWindowFromHtml(html);

    if (!didOpen) {
      throw new Error("Popup blocked. Please allow popups to print.");
    }

    return;
  }

  const blob = await response.blob();
  const didOpen = openPrintWindowFromBlob(blob);

  if (!didOpen) {
    throw new Error("Popup blocked. Please allow popups to print.");
  }
}

export async function getFoDashboard() {
  return withFoSessionRetry(async (accessToken) => {
    const payload = await getJson<unknown>("/api/fo/dashboard", {
      headers: getFoAuthHeaders(accessToken),
    });

    return normalizeFoDashboardResponse(payload);
  });
}

type FoDashboardPeriodValue = FoDashboardResponse["data"]["periods"]["today"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeFoDashboardPeriod(value: unknown): FoDashboardPeriodValue {
  if (!isRecord(value)) {
    return {
      total_revenue: 0,
      transaction_count: 0,
      active_agents: 0,
    };
  }

  const activeAgents = value.active_agents;

  return {
    total_revenue: toNumber(value.total_revenue),
    transaction_count: toNumber(value.transaction_count),
    ...(typeof activeAgents === "number" && Number.isFinite(activeAgents)
      ? { active_agents: activeAgents }
      : { active_agents: 0 }),
  };
}

function normalizeFoDashboardResponse(payload: unknown): FoDashboardResponse {
  const status = isRecord(payload) ? toNumber(payload.status) : 200;
  const message =
    isRecord(payload) && typeof payload.message === "string"
      ? payload.message
      : "FO dashboard data retrieved successfully";

  const data =
    isRecord(payload) && isRecord(payload.data) ? payload.data : null;
  const hospitalId =
    data && typeof data.hospital_id === "string" ? data.hospital_id : "";
  const periodsRaw = data && isRecord(data.periods) ? data.periods : null;

  const normalizedPeriods: FoDashboardResponse["data"]["periods"] = {
    today: normalizeFoDashboardPeriod(periodsRaw?.today),
    last_month: normalizeFoDashboardPeriod(periodsRaw?.last_month),
    this_month: normalizeFoDashboardPeriod(periodsRaw?.this_month),
    this_year: normalizeFoDashboardPeriod(periodsRaw?.this_year),
  };

  if (process.env.NODE_ENV !== "production" && periodsRaw) {
    const missingKeys = [
      periodsRaw.today ? null : "today",
      periodsRaw.last_month ? null : "last_month",
      periodsRaw.this_month ? null : "this_month",
      periodsRaw.this_year ? null : "this_year",
    ].filter(Boolean);

    if (missingKeys.length) {
      console.warn(
        `[getFoDashboard] Backend payload is missing documented periods: ${missingKeys.join(
          ", ",
        )}`,
      );
    }
  }

  return {
    status,
    message,
    data: {
      hospital_id: hospitalId,
      periods: normalizedPeriods,
    },
  };
}

export async function getFoProfile() {
  return withFoSessionRetry((accessToken) =>
    getJson<FoProfileResponse>("/api/fo/profile", {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
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

  return withFoSessionRetry((accessToken) =>
    getJson<FoAgentsResponse>(`/api/fo/agents${suffix}`, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function getFoDepartments(search?: string) {
  const query = new URLSearchParams();

  if (search?.trim()) {
    query.set("search", search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return withFoSessionRetry((accessToken) =>
    getJson<FoDepartmentsResponse>(`/api/fo/departments${suffix}`, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function createFoDepartment(payload: CreateFoDepartmentPayload) {
  return withFoSessionRetry((accessToken) =>
    postJson<FoDepartmentMutationResponse>("/api/fo/departments", payload, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function updateFoDepartment(
  departmentId: string,
  payload: UpdateFoDepartmentPayload,
) {
  return withFoSessionRetry((accessToken) =>
    patchJson<FoDepartmentMutationResponse>(
      `/api/fo/departments/${departmentId}`,
      payload,
      {
        headers: getFoAuthHeaders(accessToken),
      },
    ),
  );
}

export async function getFoIncomeHeads(params?: {
  departmentId?: string;
  search?: string;
}) {
  const query = new URLSearchParams();

  if (params?.departmentId?.trim()) {
    query.set("department_id", params.departmentId.trim());
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return withFoSessionRetry((accessToken) =>
    getJson<FoIncomeHeadsResponse>(`/api/fo/income-heads${suffix}`, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function createFoIncomeHead(payload: CreateFoIncomeHeadPayload) {
  return withFoSessionRetry((accessToken) =>
    postJson<FoIncomeHeadMutationResponse>("/api/fo/income-heads", payload, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function updateFoIncomeHead(
  incomeHeadId: string,
  payload: UpdateFoIncomeHeadPayload,
) {
  return withFoSessionRetry((accessToken) =>
    patchJson<FoIncomeHeadMutationResponse>(
      `/api/fo/income-heads/${incomeHeadId}`,
      payload,
      {
        headers: getFoAuthHeaders(accessToken),
      },
    ),
  );
}

export async function getFoBillItems(params?: {
  departmentId?: string;
  incomeHeadId?: string;
  search?: string;
  billName?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.departmentId?.trim()) {
    query.set("department_id", params.departmentId.trim());
  }

  if (params?.incomeHeadId?.trim()) {
    query.set("income_head_id", params.incomeHeadId.trim());
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params?.billName?.trim()) {
    query.set("bill_name", params.billName.trim());
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return withFoSessionRetry((accessToken) =>
    getJson<FoBillItemsResponse>(`/api/fo/bill-items${suffix}`, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function createFoBillItem(payload: CreateFoBillItemPayload) {
  return withFoSessionRetry((accessToken) =>
    postJson<FoBillItemMutationResponse>("/api/fo/bill-items", payload, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function updateFoBillItem(
  billItemId: string,
  payload: UpdateFoBillItemPayload,
) {
  return withFoSessionRetry((accessToken) =>
    patchJson<FoBillItemMutationResponse>(
      `/api/fo/bill-items/${billItemId}`,
      payload,
      {
        headers: getFoAuthHeaders(accessToken),
      },
    ),
  );
}

export async function updateFoAgentStatus(
  agentId: string,
  status: FoAgentStatus,
) {
  return withFoSessionRetry((accessToken) =>
    patchJson<UpdateFoAgentStatusResponse>(
      `/api/fo/agents/${agentId}/status`,
      { status },
      {
        headers: getFoAuthHeaders(accessToken),
      },
    ),
  );
}

export async function getFoReports(params?: {
  startDate?: string;
  endDate?: string;
  departments?: string[];
  incomeHeads?: string[];
  agents?: string[];
  paymentMethod?: FoReportPaymentType;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.departments?.length) {
    query.set("departments", params.departments.join(","));
  }

  if (params?.incomeHeads?.length) {
    query.set("income_heads", params.incomeHeads.join(","));
  }

  if (params?.agents?.length) {
    query.set("agents", params.agents.join(","));
  }

  if (params?.paymentMethod) {
    query.set("payment_method", params.paymentMethod);
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return withFoSessionRetry((accessToken) =>
    getJson<FoReportsResponse>(`/api/fo/reports${suffix}`, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function exportFoReportsCsv(params?: {
  startDate?: string;
  endDate?: string;
  departments?: string[];
  incomeHeads?: string[];
  agents?: string[];
  paymentMethod?: FoReportPaymentType;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.departments?.length) {
    query.set("departments", params.departments.join(","));
  }

  if (params?.incomeHeads?.length) {
    query.set("income_heads", params.incomeHeads.join(","));
  }

  if (params?.agents?.length) {
    query.set("agents", params.agents.join(","));
  }

  if (params?.paymentMethod) {
    query.set("payment_method", params.paymentMethod);
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  query.set("export", "csv");

  return withFoSessionRetry((accessToken) =>
    downloadFoDocument(
      `/api/fo/reports?${query.toString()}`,
      "fo-report.csv",
      accessToken,
    ),
  );
}

export async function printFoReports(params?: {
  startDate?: string;
  endDate?: string;
  departments?: string[];
  incomeHeads?: string[];
  agents?: string[];
  paymentMethod?: FoReportPaymentType;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.departments?.length) {
    query.set("departments", params.departments.join(","));
  }

  if (params?.incomeHeads?.length) {
    query.set("income_heads", params.incomeHeads.join(","));
  }

  if (params?.agents?.length) {
    query.set("agents", params.agents.join(","));
  }

  if (params?.paymentMethod) {
    query.set("payment_method", params.paymentMethod);
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  query.set("print", "true");

  return withFoSessionRetry((accessToken) =>
    printFoDocument(`/api/fo/reports?${query.toString()}`, accessToken),
  );
}

export async function getFoTransactions(params?: {
  startDate?: string;
  endDate?: string;
  paymentMethod?: FoReportPaymentType;
  patientId?: string;
  department?: string;
  agent?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.paymentMethod) {
    query.set("payment_method", params.paymentMethod);
  }

  if (params?.patientId?.trim()) {
    query.set("patient_id", params.patientId.trim());
  }

  if (params?.department?.trim()) {
    query.set("department", params.department.trim());
  }

  if (params?.agent?.trim()) {
    query.set("agent", params.agent.trim());
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return withFoSessionRetry((accessToken) =>
    getJson<FoTransactionsResponse>(`/api/fo/transactions${suffix}`, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function exportFoTransactionsCsv(params?: {
  startDate?: string;
  endDate?: string;
  paymentMethod?: FoReportPaymentType;
  patientId?: string;
  department?: string;
  agent?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.paymentMethod) {
    query.set("payment_method", params.paymentMethod);
  }

  if (params?.patientId?.trim()) {
    query.set("patient_id", params.patientId.trim());
  }

  if (params?.department?.trim()) {
    query.set("department", params.department.trim());
  }

  if (params?.agent?.trim()) {
    query.set("agent", params.agent.trim());
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  query.set("export", "csv");

  return withFoSessionRetry((accessToken) =>
    downloadFoDocument(
      `/api/fo/transactions?${query.toString()}`,
      "fo-transactions.csv",
      accessToken,
    ),
  );
}

export async function getFoPatientReport(params?: {
  patientId?: string;
  startDate?: string;
  endDate?: string;
  exportType?: "csv";
  print?: boolean;
}) {
  const query = new URLSearchParams();

  if (params?.patientId?.trim()) {
    query.set("patient_id", params.patientId.trim());
  }

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.exportType === "csv") {
    query.set("export", "csv");
  }

  if (params?.print) {
    query.set("print", "true");
  }

  return withFoSessionRetry((accessToken) =>
    getJson<FoPatientReportResponse>(
      `/api/fo/report/patient?${query.toString()}`,
      {
        headers: getFoAuthHeaders(accessToken),
      },
    ),
  );
}

export async function exportFoPatientReportCsv(params?: {
  patientId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const query = new URLSearchParams();

  if (params?.patientId?.trim()) {
    query.set("patient_id", params.patientId.trim());
  }

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  query.set("export", "csv");

  return withFoSessionRetry((accessToken) =>
    downloadFoDocument(
      `/api/fo/report/patient?${query.toString()}`,
      "fo-patient-report.csv",
      accessToken,
    ),
  );
}

export async function printFoPatientReport(params?: {
  patientId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const query = new URLSearchParams();

  if (params?.patientId?.trim()) {
    query.set("patient_id", params.patientId.trim());
  }

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  query.set("print", "true");

  return withFoSessionRetry((accessToken) =>
    printFoDocument(`/api/fo/report/patient?${query.toString()}`, accessToken),
  );
}

export async function getFoDepartmentReport(params?: {
  department?: string;
  startDate?: string;
  endDate?: string;
  exportType?: "csv";
  print?: boolean;
}) {
  const query = new URLSearchParams();

  if (params?.department?.trim()) {
    query.set("department", params.department.trim());
  }

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.exportType === "csv") {
    query.set("export", "csv");
  }

  if (params?.print) {
    query.set("print", "true");
  }

  return withFoSessionRetry((accessToken) =>
    getJson<FoDepartmentReportResponse>(
      `/api/fo/report/department?${query.toString()}`,
      {
        headers: getFoAuthHeaders(accessToken),
      },
    ),
  );
}

export async function exportFoDepartmentReportCsv(params?: {
  department?: string;
  startDate?: string;
  endDate?: string;
}) {
  const query = new URLSearchParams();

  if (params?.department?.trim()) {
    query.set("department", params.department.trim());
  }

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  query.set("export", "csv");

  return withFoSessionRetry((accessToken) =>
    downloadFoDocument(
      `/api/fo/report/department?${query.toString()}`,
      "fo-department-report.csv",
      accessToken,
    ),
  );
}

export async function printFoDepartmentReport(params?: {
  department?: string;
  startDate?: string;
  endDate?: string;
}) {
  const query = new URLSearchParams();

  if (params?.department?.trim()) {
    query.set("department", params.department.trim());
  }

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  query.set("print", "true");

  return withFoSessionRetry((accessToken) =>
    printFoDocument(
      `/api/fo/report/department?${query.toString()}`,
      accessToken,
    ),
  );
}

export async function getFoAgentReport(params?: {
  agentId?: string;
  startDate?: string;
  endDate?: string;
  exportType?: "csv";
  print?: boolean;
}) {
  const query = new URLSearchParams();

  if (params?.agentId?.trim()) {
    query.set("agent_id", params.agentId.trim());
  }

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.exportType === "csv") {
    query.set("export", "csv");
  }

  if (params?.print) {
    query.set("print", "true");
  }

  return withFoSessionRetry((accessToken) =>
    getJson<FoAgentReportResponse>(
      `/api/fo/report/agent?${query.toString()}`,
      {
        headers: getFoAuthHeaders(accessToken),
      },
    ),
  );
}

export async function exportFoAgentReportCsv(params?: {
  agentId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const query = new URLSearchParams();

  if (params?.agentId?.trim()) {
    query.set("agent_id", params.agentId.trim());
  }

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  query.set("export", "csv");

  return withFoSessionRetry((accessToken) =>
    downloadFoDocument(
      `/api/fo/report/agent?${query.toString()}`,
      "fo-agent-report.csv",
      accessToken,
    ),
  );
}

export async function printFoAgentReport(params?: {
  agentId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const query = new URLSearchParams();

  if (params?.agentId?.trim()) {
    query.set("agent_id", params.agentId.trim());
  }

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  query.set("print", "true");

  return withFoSessionRetry((accessToken) =>
    printFoDocument(`/api/fo/report/agent?${query.toString()}`, accessToken),
  );
}

export async function getFoStats(timePeriod: FoStatsTimePeriod = "today") {
  const query = new URLSearchParams({ time_period: timePeriod });

  return withFoSessionRetry((accessToken) =>
    getJson<FoStatsResponse>(`/api/fo/stats?${query.toString()}`, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function getFoReceipts(status: FoReceiptFilter = "all") {
  const query = new URLSearchParams({ status });

  return withFoSessionRetry((accessToken) =>
    getJson<FoReceiptsResponse>(`/api/fo/receipts?${query.toString()}`, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function approveFoReceipt(requestId: string) {
  return withFoSessionRetry((accessToken) =>
    postJson<FoReceiptDecisionResponse>(
      "/api/fo/receipts/approve",
      { request_id: requestId },
      {
        headers: getFoAuthHeaders(accessToken),
      },
    ),
  );
}

export async function rejectFoReceipt(requestId: string) {
  return withFoSessionRetry((accessToken) =>
    postJson<FoReceiptDecisionResponse>(
      "/api/fo/receipts/reject",
      { request_id: requestId },
      {
        headers: getFoAuthHeaders(accessToken),
      },
    ),
  );
}

export async function createFoAgent(payload: CreateFoAgentPayload) {
  return withFoSessionRetry((accessToken) =>
    postJson<CreateFoAgentResponse>("/api/fo/create", payload, {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}

export async function logoutFo() {
  return withFoSessionRetry((accessToken) =>
    getJson<{ status: number; message: string; data: null }>("/api/auth/logout", {
      headers: getFoAuthHeaders(accessToken),
    }),
  );
}
