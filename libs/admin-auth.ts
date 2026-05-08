import {
  API_BASE_URL,
  ApiError,
  deleteJson,
  getJson,
  patchJson,
  postJson,
  putJson,
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
  AdminAgentTopupPayload,
  AdminAgentTopupResponse,
  AdminDashboardResponse,
  AdminHospitalAgentTopupHistoryResponse,
  AdminHospitalAgentReportResponse,
  AdminHospitalDepartmentReportResponse,
  AdminHospitalPatientReportResponse,
  AdminUpdatePasswordPayload,
  AdminSystemLogsResponse,
  AdminHospitalAgentsResponse,
  AdminHospitalReceiptsResponse,
  AdminHospitalFosResponse,
  AdminHospitalDepartmentsResponse,
  AdminHospitalActivityLogsResponse,
  AdminHospitalPatientSearchResponse,
  AdminHospitalTransactionsResponse,
  AdminHospitalOverviewResponse,
  AdminHospitalIncomeHeadsResponse,
  HospitalImageUrlResponse,
  AdminHospitalIncomeHeadMutationResponse,
  AdminHospitalBillItemsResponse,
  AdminHospitalBillItemMutationResponse,
  AdminReceiptDecisionPayload,
  AdminReceiptDecisionResponse,
  AdminReceiptFilter,
  AdminHospitalStatus,
  AdminHospitalsResponse,
  AdminHospitalRevenueReportResponse,
  AdminReportsOptionsResponse,
  AdminReportPaymentType,
  CreateAdminHospitalAgentPayload,
  CreateAdminHospitalAgentResponse,
  CreateAdminHospitalFoPayload,
  CreateAdminHospitalFoResponse,
  CreateAdminHospitalDepartmentPayload,
  CreateAdminHospitalDepartmentResponse,
  CreateAdminHospitalIncomeHeadPayload,
  CreateAdminHospitalBillItemPayload,
  CreateAdminHospitalPayload,
  CreateAdminHospitalResponse,
  UpdateAdminHospitalAgentPayload,
  UpdateAdminHospitalAgentResponse,
  UpdateAdminHospitalFoPayload,
  UpdateAdminHospitalFoResponse,
  UpdateAdminHospitalDepartmentPayload,
  UpdateAdminHospitalDepartmentResponse,
  UpdateAdminHospitalIncomeHeadPayload,
  UpdateAdminHospitalBillItemPayload,
  UpdateAdminHospitalPayload,
  UpdateAdminHospitalResponse,
  DeleteAdminHospitalDepartmentResponse,
} from "@/libs/type";

function getAdminAuthHeaders(accessToken?: string) {
  const token = accessToken ?? getAccessToken();

  if (!token) {
    throw new Error("Your session has expired. Please login again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function refreshAdminSession() {
  const refreshToken = getAgentRefreshToken();

  if (!refreshToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  const response = await postJson<{ data?: { accessToken: string; refreshToken: string } }>(
    "/api/auth/refresh",
    {
      refreshToken,
    },
  );

  const tokens = response.data;

  if (!tokens?.accessToken || !tokens.refreshToken) {
    throw new Error("Unable to refresh your session. Please login again.");
  }

  storeAgentTokens(tokens);

  return tokens.accessToken;
}

async function withAdminSessionRetry<T>(
  request: (accessToken: string) => Promise<T>,
) {
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
      const nextAccessToken = await refreshAdminSession();
      return await request(nextAccessToken);
    } catch (refreshError) {
      clearAuthTokens();
      throw refreshError;
    }
  }
}

async function adminGet<TResponse>(endpoint: string) {
  return withAdminSessionRetry((accessToken) =>
    getJson<TResponse>(endpoint, {
      headers: getAdminAuthHeaders(accessToken),
    }),
  );
}

async function adminPost<TResponse>(
  endpoint: string,
  body: Record<string, unknown>,
) {
  return withAdminSessionRetry((accessToken) =>
    postJson<TResponse>(endpoint, body, {
      headers: getAdminAuthHeaders(accessToken),
    }),
  );
}

async function adminPatch<TResponse>(
  endpoint: string,
  body: Record<string, unknown>,
) {
  return withAdminSessionRetry((accessToken) =>
    patchJson<TResponse>(endpoint, body, {
      headers: getAdminAuthHeaders(accessToken),
    }),
  );
}

async function adminPut<TResponse>(
  endpoint: string,
  body: Record<string, unknown>,
) {
  return withAdminSessionRetry((accessToken) =>
    putJson<TResponse>(endpoint, body, {
      headers: getAdminAuthHeaders(accessToken),
    }),
  );
}

async function adminDelete<TResponse>(endpoint: string) {
  return withAdminSessionRetry((accessToken) =>
    deleteJson<TResponse>(endpoint, {
      headers: getAdminAuthHeaders(accessToken),
    }),
  );
}

async function fetchAdminDocument(endpoint: string) {
  return withAdminSessionRetry(async (accessToken) => {
    let response: Response;

    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          ...getAdminAuthHeaders(accessToken),
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
  });
}

function getFilenameFromDisposition(
  contentDisposition: string | null,
  fallback: string,
) {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? fallback;
}

function applyDateRangeQuery(
  query: URLSearchParams,
  params?: {
    startDate?: string;
    endDate?: string;
  },
) {
  const startDate = params?.startDate?.trim();
  const endDate = params?.endDate?.trim();

  if (startDate && endDate) {
    query.set("start_date", startDate);
    query.set("end_date", endDate);
    return;
  }

  if (startDate) {
    query.set("start_date", startDate);
    query.set("end_date", startDate);
    return;
  }

  if (endDate) {
    query.set("start_date", endDate);
    query.set("end_date", endDate);
  }
}

async function downloadAdminDocument(
  endpoint: string,
  fallbackFilename: string,
) {
  const response = await fetchAdminDocument(endpoint);
  const blob = await response.blob();
  const filename = getFilenameFromDisposition(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );

  downloadBlobFile(blob, filename);
}

async function printAdminDocument(endpoint: string) {
  const response = await fetchAdminDocument(endpoint);
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

export async function getAdminDashboard() {
  return adminGet<AdminDashboardResponse>("/api/admin/dashboard");
}

export async function getAdminSystemLogs(params?: {
  startDate?: string;
  endDate?: string;
  hospitalId?: string;
  role?: "PLATFORM_ADMIN" | "FO" | "AGENT" | "all";
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.hospitalId?.trim()) {
    query.set("hospital_id", params.hospitalId.trim());
  }

  if (params?.role && params.role !== "all") {
    query.set("role", params.role);
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return adminGet<AdminSystemLogsResponse>(`/api/admin/system-logs${suffix}`);
}

export async function getAdminHospitals(params?: {
  search?: string;
  hospitalName?: string;
  hospitalCode?: string;
  status?: AdminHospitalStatus | "all";
  sort?: "newest" | "oldest";
}) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params?.hospitalName?.trim()) {
    query.set("hospital_name", params.hospitalName.trim());
  }

  if (params?.hospitalCode?.trim()) {
    query.set("hospital_code", params.hospitalCode.trim());
  }

  if (params?.status && params.status !== "all") {
    query.set("hospital_status", params.status);
  }

  if (params?.sort) {
    query.set("sort", params.sort);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return adminGet<AdminHospitalsResponse>(`/api/admin/hospitals${suffix}`);
}

export async function getAdminHospitalOverview(hospitalId: string) {
  return adminGet<AdminHospitalOverviewResponse>(
    `/api/admin/hospitals/${hospitalId}/overview`,
  );
}

export async function getAdminHospitalImageUrl(hospitalId: string) {
  return adminGet<HospitalImageUrlResponse>(
    `/api/admin/hospitals/${hospitalId}/image-url`,
  );
}

export async function getAdminHospitalAgents(
  hospitalId: string,
  params?: {
    search?: string;
  },
) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return adminGet<AdminHospitalAgentsResponse>(
    `/api/admin/hospitals/${hospitalId}/agents${suffix}`,
  );
}

export async function getAdminHospitalAgentTopupHistory(
  hospitalId: string,
  params?: {
    agentId?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();

  if (params?.agentId?.trim()) {
    query.set("agent_id", params.agentId.trim());
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return adminGet<AdminHospitalAgentTopupHistoryResponse>(
    `/api/admin/hospitals/${hospitalId}/agents/topups${suffix}`,
  );
}

export async function createAdminHospitalAgent(
  hospitalId: string,
  payload: CreateAdminHospitalAgentPayload,
) {
  return adminPost<CreateAdminHospitalAgentResponse>(
    `/api/admin/hospitals/${hospitalId}/agents`,
    payload,
  );
}

export async function updateAdminHospitalAgent(
  hospitalId: string,
  agentId: string,
  payload: UpdateAdminHospitalAgentPayload,
) {
  return adminPatch<UpdateAdminHospitalAgentResponse>(
    `/api/admin/hospitals/${hospitalId}/agents/${agentId}`,
    payload,
  );
}

export async function getAdminHospitalFos(
  hospitalId: string,
  params?: {
    search?: string;
  },
) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return adminGet<AdminHospitalFosResponse>(
    `/api/admin/hospitals/${hospitalId}/fos${suffix}`,
  );
}

export async function createAdminHospitalFo(
  hospitalId: string,
  payload: CreateAdminHospitalFoPayload,
) {
  return adminPost<CreateAdminHospitalFoResponse>(
    `/api/admin/hospitals/${hospitalId}/fos`,
    payload,
  );
}

export async function updateAdminHospitalFo(
  hospitalId: string,
  foId: string,
  payload: UpdateAdminHospitalFoPayload,
) {
  return adminPatch<UpdateAdminHospitalFoResponse>(
    `/api/admin/hospitals/${hospitalId}/fos/${foId}`,
    payload,
  );
}

export async function getAdminHospitalDepartments(
  hospitalId: string,
  params?: {
    search?: string;
  },
) {
  const query = new URLSearchParams();

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return adminGet<AdminHospitalDepartmentsResponse>(
    `/api/admin/hospitals/${hospitalId}/departments${suffix}`,
  );
}

export async function createAdminHospitalDepartment(
  hospitalId: string,
  payload: CreateAdminHospitalDepartmentPayload,
) {
  return adminPost<CreateAdminHospitalDepartmentResponse>(
    `/api/admin/hospitals/${hospitalId}/departments`,
    payload,
  );
}

export async function updateAdminHospitalDepartment(
  hospitalId: string,
  departmentId: string,
  payload: UpdateAdminHospitalDepartmentPayload,
) {
  return adminPatch<UpdateAdminHospitalDepartmentResponse>(
    `/api/admin/hospitals/${hospitalId}/departments/${departmentId}`,
    payload,
  );
}

export async function deleteAdminHospitalDepartment(
  hospitalId: string,
  departmentId: string,
) {
  return adminDelete<DeleteAdminHospitalDepartmentResponse>(
    `/api/admin/hospitals/${hospitalId}/departments/${departmentId}`,
  );
}

export async function getAdminHospitalIncomeHeads(
  hospitalId: string,
  params?: {
    departmentId?: string;
    search?: string;
  },
) {
  const query = new URLSearchParams();

  if (params?.departmentId?.trim()) {
    query.set("department_id", params.departmentId.trim());
  }

  if (params?.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return adminGet<AdminHospitalIncomeHeadsResponse>(
    `/api/admin/hospitals/${hospitalId}/income-heads${suffix}`,
  );
}

export async function createAdminHospitalIncomeHead(
  hospitalId: string,
  payload: CreateAdminHospitalIncomeHeadPayload,
) {
  return adminPost<AdminHospitalIncomeHeadMutationResponse>(
    `/api/admin/hospitals/${hospitalId}/income-heads`,
    payload,
  );
}

export async function updateAdminHospitalIncomeHead(
  hospitalId: string,
  incomeHeadId: string,
  payload: UpdateAdminHospitalIncomeHeadPayload,
) {
  return adminPatch<AdminHospitalIncomeHeadMutationResponse>(
    `/api/admin/hospitals/${hospitalId}/income-heads/${incomeHeadId}`,
    payload,
  );
}

export async function getAdminHospitalBillItems(
  hospitalId: string,
  params?: {
    departmentId?: string;
    incomeHeadId?: string;
    search?: string;
    billName?: string;
    page?: number;
    limit?: number;
  },
) {
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

  return adminGet<AdminHospitalBillItemsResponse>(
    `/api/admin/hospitals/${hospitalId}/bill-items${suffix}`,
  );
}

export async function createAdminHospitalBillItem(
  hospitalId: string,
  payload: CreateAdminHospitalBillItemPayload,
) {
  return adminPost<AdminHospitalBillItemMutationResponse>(
    `/api/admin/hospitals/${hospitalId}/bill-items`,
    payload,
  );
}

export async function updateAdminHospitalBillItem(
  hospitalId: string,
  billItemId: string,
  payload: UpdateAdminHospitalBillItemPayload,
) {
  return adminPatch<AdminHospitalBillItemMutationResponse>(
    `/api/admin/hospitals/${hospitalId}/bill-items/${billItemId}`,
    payload,
  );
}

export async function getAdminHospitalTransactions(
  hospitalId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: "cash" | "transfer" | "pos";
    patientId?: string;
    department?: string;
    agent?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
) {
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

  return adminGet<AdminHospitalTransactionsResponse>(
    `/api/admin/hospitals/${hospitalId}/transactions${suffix}`,
  );
}

export async function getAdminHospitalPatientSearch(
  hospitalId: string,
  params: {
    query?: string;
    patientId?: string;
    limit?: number;
  },
) {
  const query = new URLSearchParams();

  if (params.query?.trim()) {
    query.set("query", params.query.trim());
  } else if (params.patientId?.trim()) {
    query.set("patient_id", params.patientId.trim());
  }

  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  return adminGet<AdminHospitalPatientSearchResponse>(
    `/api/admin/hospitals/${hospitalId}/patients/search?${query.toString()}`,
  );
}

export async function exportAdminHospitalTransactionsCsv(
  hospitalId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: "cash" | "transfer" | "pos";
    patientId?: string;
    department?: string;
    agent?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
) {
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

  return downloadAdminDocument(
    `/api/admin/hospitals/${hospitalId}/transactions?${query.toString()}`,
    "admin-hospital-transactions.csv",
  );
}

export async function getAdminHospitalActivityLogs(
  hospitalId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();

  if (params?.startDate && params?.endDate) {
    query.set("start_date", params.startDate);
    query.set("end_date", params.endDate);
  }

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  if (params?.action) {
    query.set("action", params.action);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return adminGet<AdminHospitalActivityLogsResponse>(
    `/api/admin/hospitals/${hospitalId}/activity-logs${suffix}`,
  );
}

export async function getAdminHospitalReceipts(
  hospitalId: string,
  status: AdminReceiptFilter = "all",
) {
  const query = new URLSearchParams();
  query.set("status", status);

  return adminGet<AdminHospitalReceiptsResponse>(
    `/api/admin/hospitals/${hospitalId}/receipts?${query.toString()}`,
  );
}

export async function approveAdminHospitalReceipt(
  hospitalId: string,
  payload: AdminReceiptDecisionPayload,
) {
  return adminPost<AdminReceiptDecisionResponse>(
    `/api/admin/hospitals/${hospitalId}/receipts/approve`,
    payload,
  );
}

export async function rejectAdminHospitalReceipt(
  hospitalId: string,
  payload: AdminReceiptDecisionPayload,
) {
  return adminPost<AdminReceiptDecisionResponse>(
    `/api/admin/hospitals/${hospitalId}/receipts/reject`,
    payload,
  );
}

export async function topupAdminAgent(payload: AdminAgentTopupPayload) {
  return adminPost<AdminAgentTopupResponse>("/api/admin/agents/topup", payload);
}

export async function createAdminHospital(payload: CreateAdminHospitalPayload) {
  return adminPost<CreateAdminHospitalResponse>("/api/admin/hospitals", payload);
}

export async function updateAdminHospital(
  hospitalId: string,
  payload: UpdateAdminHospitalPayload,
) {
  return adminPut<UpdateAdminHospitalResponse>(
    `/api/admin/hospitals/${hospitalId}`,
    payload,
  );
}

export async function getAdminReportsOptions() {
  const hospitalsResponse = await getAdminHospitals({
    sort: "newest",
  });

  return {
    status: hospitalsResponse.status,
    message: hospitalsResponse.message,
    data: {
      hospitals: hospitalsResponse.data.hospitals.map((hospital) => ({
        hospital_id: hospital.hospital_id,
        hospital_name: hospital.hospital_name,
        hospital_code: hospital.hospital_code,
        revenue_type: hospital.revenue_type,
        status: hospital.status,
      })),
      report_types: [
        {
          key: "revenue" as const,
          label: "Revenue Report",
          endpoint: "/api/admin/reports",
        },
        {
          key: "patient" as const,
          label: "Patient Report",
          endpoint: "/api/admin/reports/patient",
        },
        {
          key: "department" as const,
          label: "Department Report",
          endpoint: "/api/admin/reports/department",
        },
        {
          key: "agent" as const,
          label: "Agent Report",
          endpoint: "/api/admin/reports/agent",
        },
      ],
    },
  } satisfies AdminReportsOptionsResponse;
}

export async function updateAdminPassword(payload: AdminUpdatePasswordPayload) {
  return adminPost<{ status: number; message: string; data: null }>(
    "/api/auth/update",
    payload,
  );
}

export async function logoutAdmin() {
  return adminGet<{ status: number; message: string; data: null }>(
    "/api/auth/logout",
  );
}

export async function getAdminHospitalRevenueReport(
  hospitalId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    showAll?: boolean;
    departments?: string[];
    incomeHeads?: string[];
    agents?: string[];
    paymentMethod?: AdminReportPaymentType;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  applyDateRangeQuery(query, params);

  if (params?.showAll) {
    query.set("show_all", "true");
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

  return adminGet<AdminHospitalRevenueReportResponse>(
    `/api/admin/reports?${query.toString()}`,
  );
}

export async function exportAdminHospitalRevenueReportCsv(
  hospitalId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    showAll?: boolean;
    departments?: string[];
    incomeHeads?: string[];
    agents?: string[];
    paymentMethod?: AdminReportPaymentType;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  applyDateRangeQuery(query, params);

  if (params?.showAll) {
    query.set("show_all", "true");
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

  return downloadAdminDocument(
    `/api/admin/reports?${query.toString()}`,
    "admin-hospital-revenue-report.csv",
  );
}

export async function printAdminHospitalRevenueReport(
  hospitalId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    showAll?: boolean;
    departments?: string[];
    incomeHeads?: string[];
    agents?: string[];
    paymentMethod?: AdminReportPaymentType;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  applyDateRangeQuery(query, params);

  if (params?.showAll) {
    query.set("show_all", "true");
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

  return printAdminDocument(`/api/admin/reports?${query.toString()}`);
}

export async function getAdminHospitalPatientReport(
  hospitalId: string,
  params?: {
    patientId?: string;
    startDate?: string;
    endDate?: string;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  if (params?.patientId?.trim()) {
    query.set("patient_id", params.patientId.trim());
  }

  applyDateRangeQuery(query, params);

  return adminGet<AdminHospitalPatientReportResponse>(
    `/api/admin/reports/patient?${query.toString()}`,
  );
}

export async function exportAdminHospitalPatientReportCsv(
  hospitalId: string,
  params?: {
    patientId?: string;
    startDate?: string;
    endDate?: string;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  if (params?.patientId?.trim()) {
    query.set("patient_id", params.patientId.trim());
  }

  applyDateRangeQuery(query, params);

  query.set("export", "csv");

  return downloadAdminDocument(
    `/api/admin/reports/patient?${query.toString()}`,
    "admin-hospital-patient-report.csv",
  );
}

export async function printAdminHospitalPatientReport(
  hospitalId: string,
  params?: {
    patientId?: string;
    startDate?: string;
    endDate?: string;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  if (params?.patientId?.trim()) {
    query.set("patient_id", params.patientId.trim());
  }

  applyDateRangeQuery(query, params);

  query.set("print", "true");

  return printAdminDocument(`/api/admin/reports/patient?${query.toString()}`);
}

export async function getAdminHospitalDepartmentReport(
  hospitalId: string,
  params?: {
    department?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  if (params?.department?.trim()) {
    query.set("department", params.department.trim());
  }

  applyDateRangeQuery(query, params);

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  return adminGet<AdminHospitalDepartmentReportResponse>(
    `/api/admin/reports/department?${query.toString()}`,
  );
}

export async function exportAdminHospitalDepartmentReportCsv(
  hospitalId: string,
  params?: {
    department?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  if (params?.department?.trim()) {
    query.set("department", params.department.trim());
  }

  applyDateRangeQuery(query, params);

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  query.set("export", "csv");

  return downloadAdminDocument(
    `/api/admin/reports/department?${query.toString()}`,
    "admin-hospital-department-report.csv",
  );
}

export async function printAdminHospitalDepartmentReport(
  hospitalId: string,
  params?: {
    department?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  if (params?.department?.trim()) {
    query.set("department", params.department.trim());
  }

  applyDateRangeQuery(query, params);

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  query.set("print", "true");

  return printAdminDocument(
    `/api/admin/reports/department?${query.toString()}`,
  );
}

export async function getAdminHospitalAgentReport(
  hospitalId: string,
  params?: {
    agentId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  if (params?.agentId?.trim()) {
    query.set("agent_id", params.agentId.trim());
  }

  applyDateRangeQuery(query, params);

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  return adminGet<AdminHospitalAgentReportResponse>(
    `/api/admin/reports/agent?${query.toString()}`,
  );
}

export async function exportAdminHospitalAgentReportCsv(
  hospitalId: string,
  params?: {
    agentId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  if (params?.agentId?.trim()) {
    query.set("agent_id", params.agentId.trim());
  }

  applyDateRangeQuery(query, params);

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  query.set("export", "csv");

  return downloadAdminDocument(
    `/api/admin/reports/agent?${query.toString()}`,
    "admin-hospital-agent-report.csv",
  );
}

export async function printAdminHospitalAgentReport(
  hospitalId: string,
  params?: {
    agentId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  query.set("hospital", hospitalId);

  if (params?.agentId?.trim()) {
    query.set("agent_id", params.agentId.trim());
  }

  applyDateRangeQuery(query, params);

  if (params?.page) {
    query.set("page", String(params.page));
  }

  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  query.set("print", "true");

  return printAdminDocument(`/api/admin/reports/agent?${query.toString()}`);
}
