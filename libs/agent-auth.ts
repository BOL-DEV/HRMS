import { getJson, postJson } from "@/libs/api";
import {
  clearAgentTokens,
  getAgentAccessToken,
  getAgentRefreshToken,
  storeAgentTokens,
  decodeJwt,
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
  AgentExpressPaymentPayload,
  AgentReceiptPrintPayload,
  AgentReceiptPrintResponse,
  AgentReceiptReprintRequestPayload,
  AgentReceiptReprintRequestResponse,
  AgentReceiptSearchType,
  AgentTransactionsResponse,
  AgentTransactionsTimePeriod,
  AgentPendingPharmacyRequestsResponse,
  AgentPaymentType,
  AgentSelfTopupHistoryResponse,
  AuthRefreshResponse,
  HospitalImageUrlResponse,
  HospitalPatientSearchResponse,
  ProcessPaymentPayload,
  ProcessPaymentResponse,
  AgentReceiptsResponse,
} from "@/libs/type";
import { ApiError } from "@/libs/api";

export async function loginAgent(payload: AgentLoginPayload) {
  return postJson<AgentLoginResponse>("/api/auth/login", payload);
}

export async function selectPharmacyUnit(tempToken: string, pharmacyUnitId: string) {
  return postJson<{
    status: number;
    message: string;
    data: {
      accessToken: string;
      refreshToken: string;
    };
  }>("/api/auth/select-unit", {
    pharmacy_unit_id: pharmacyUnitId,
  }, {
    headers: {
      Authorization: `Bearer ${tempToken}`,
    },
  });
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

export async function searchAgentHospitalPatients(
  hospitalId: string,
  params?: {
    query?: string;
    patientId?: string;
    patientName?: string;
    name?: string;
    limit?: number;
  },
) {
  const searchParams = new URLSearchParams();

  if (params?.query?.trim()) {
    searchParams.set("query", params.query.trim());
  }

  if (params?.patientId?.trim()) {
    searchParams.set("patient_id", params.patientId.trim());
  }

  if (params?.patientName?.trim()) {
    searchParams.set("patient_name", params.patientName.trim());
  }

  if (params?.name?.trim()) {
    searchParams.set("name", params.name.trim());
  }

  if (params?.limit) {
    searchParams.set("limit", String(params.limit));
  }

  return withAgentSessionRetry((accessToken) =>
    getJson<HospitalPatientSearchResponse>(
      `/api/hospitals/${hospitalId}/patients/search?${searchParams.toString()}`,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}

export async function getAgentHospitalImageUrl(hospitalId: string) {
  return withAgentSessionRetry((accessToken) =>
    getJson<HospitalImageUrlResponse>(
      `/api/admin/hospitals/${hospitalId}/image-url`,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
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

export async function processAgentExpressPayment(
  payload: AgentExpressPaymentPayload,
) {
  return withAgentSessionRetry((accessToken) =>
    postJson<ProcessPaymentResponse>("/api/payments/express/process", payload, {
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

export async function getAgentTopupHistory(params?: {
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 15),
  });

  return withAgentSessionRetry((accessToken) =>
    getJson<AgentSelfTopupHistoryResponse>(
      `/api/agent/topup-history?${searchParams.toString()}`,
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

export async function getAgentPendingPharmacyRequests(params: {
  billing_code?: string;
  patient_id?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.billing_code) {
    searchParams.set("billing_code", params.billing_code);
    searchParams.set("code", params.billing_code);
  }
  if (params.patient_id) searchParams.set("patient_id", params.patient_id);

  return withAgentSessionRetry((accessToken) =>
    getJson<AgentPendingPharmacyRequestsResponse>(
      `/api/payments/pharmacy-requests?${searchParams.toString()}`,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}

export async function processAgentPharmacyPayment(payload: {
  billing_code?: string;
  patient_id?: string;
  payment_type: AgentPaymentType;
}) {
  return withAgentSessionRetry((accessToken) =>
    postJson<ProcessPaymentResponse>(
      "/api/payments/pharmacy/process",
      payload,
      {
        headers: getAgentAuthHeaders(accessToken),
      },
    ),
  );
}

export async function getPendingDrugExchanges(search?: string) {
  const cleanSearch = search?.trim() || "";
  return withAgentSessionRetry(async (accessToken) => {
    const headers = getAgentAuthHeaders(accessToken);

    // Strategy 1: Try /api/payments/drug-exchange/pending?search=...
    try {
      const q = cleanSearch ? `?search=${encodeURIComponent(cleanSearch)}` : "";
      const res = await getJson<any>(`/api/payments/drug-exchange/pending${q}`, { headers });
      const rawData = res?.data ?? res;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(rawData?.exchanges)
        ? rawData.exchanges
        : Array.isArray(rawData?.refunds)
        ? rawData.refunds
        : rawData && typeof rawData === "object" && (rawData.exchange_code || rawData.id)
        ? [rawData]
        : [];
      if (list.length > 0) {
        return { status: 200, message: "Success", data: list };
      }
    } catch {}

    // Strategy 2: Try /api/payments/drug-exchange?search=... & ?exchange_code=...
    try {
      const q = cleanSearch ? `?search=${encodeURIComponent(cleanSearch)}` : "";
      const res = await getJson<any>(`/api/payments/drug-exchange${q}`, { headers });
      const rawData = res?.data ?? res;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(rawData?.exchanges)
        ? rawData.exchanges
        : Array.isArray(rawData?.refunds)
        ? rawData.refunds
        : rawData && typeof rawData === "object" && (rawData.exchange_code || rawData.id)
        ? [rawData]
        : [];
      if (list.length > 0) {
        return { status: 200, message: "Success", data: list };
      }
    } catch {}

    // Strategy 3: Try /api/pharmacy/drug-exchange?search=... & ?exchange_code=...
    try {
      const q = cleanSearch ? `?search=${encodeURIComponent(cleanSearch)}` : "";
      const res = await getJson<any>(`/api/pharmacy/drug-exchange${q}`, { headers });
      const rawData = res?.data ?? res;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(rawData?.exchanges)
        ? rawData.exchanges
        : Array.isArray(rawData?.records)
        ? rawData.records
        : rawData && typeof rawData === "object" && (rawData.exchange_code || rawData.id)
        ? [rawData]
        : [];
      if (list.length > 0) {
        return { status: 200, message: "Success", data: list };
      }
    } catch {}

    // Strategy 4: Try /api/pharmacy/drug-exchange/${cleanSearch} (direct code/ID route)
    if (cleanSearch) {
      try {
        const res = await getJson<any>(`/api/pharmacy/drug-exchange/${encodeURIComponent(cleanSearch)}`, { headers });
        const rawData = res?.data ?? res;
        if (rawData && (rawData.exchange_code || rawData.id)) {
          return { status: 200, message: "Success", data: [rawData] };
        }
      } catch {}
    }

    // Strategy 5: Query /api/pharmacy/drug-exchange list and match in-memory
    try {
      const res = await getJson<any>(`/api/pharmacy/drug-exchange`, { headers });
      const rawData = res?.data ?? res;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(rawData?.exchanges)
        ? rawData.exchanges
        : Array.isArray(rawData?.records)
        ? rawData.records
        : [];
      if (list.length > 0) {
        if (cleanSearch) {
          const upper = cleanSearch.toUpperCase();
          const matched = list.filter(
            (e: any) =>
              (e.exchange_code && e.exchange_code.toUpperCase() === upper) ||
              (e.id && String(e.id).toUpperCase() === upper) ||
              (e.billing_code && e.billing_code.toUpperCase() === upper) ||
              (e.patient_id && e.patient_id.toUpperCase() === upper)
          );
          if (matched.length > 0) {
            return { status: 200, message: "Success", data: matched };
          }
        }
        return { status: 200, message: "Success", data: list };
      }
    } catch {}

    return { status: 200, message: "No exchanges found", data: [] };
  });
}

export async function processDrugExchangePayment(payload: {
  exchange_code: string;
  payment_type: AgentPaymentType;
}) {
  return withAgentSessionRetry(async (accessToken) => {
    const headers = getAgentAuthHeaders(accessToken);

    // 1. Try /api/payments/drug-exchange/process
    try {
      return await postJson<ProcessPaymentResponse>(
        "/api/payments/drug-exchange/process",
        payload,
        { headers }
      );
    } catch {
      // 2. Try /api/payments/drug-exchange
      try {
        return await postJson<ProcessPaymentResponse>(
          "/api/payments/drug-exchange",
          payload,
          { headers }
        );
      } catch {
        // 3. Try /api/pharmacy/drug-exchange/settle
        try {
          return await postJson<ProcessPaymentResponse>(
            "/api/pharmacy/drug-exchange/settle",
            payload,
            { headers }
          );
        } catch {
          // 4. Try /api/payments/pharmacy/process
          return await postJson<ProcessPaymentResponse>(
            "/api/payments/pharmacy/process",
            {
              billing_code: payload.exchange_code,
              code: payload.exchange_code,
              payment_type: payload.payment_type,
            },
            { headers }
          );
        }
      }
    }
  });
}

export async function refundDrugExchange(payload: {
  exchange_code: string;
  payment_type: AgentPaymentType;
  remarks?: string;
}) {
  return withAgentSessionRetry(async (accessToken) => {
    const headers = getAgentAuthHeaders(accessToken);

    try {
      return await postJson<{
        status: string | number;
        message?: string;
        data: any;
      }>("/api/payments/drug-exchange/refund", payload, { headers });
    } catch {
      try {
        return await postJson<any>(
          "/api/pharmacy/drug-exchange/refund",
          payload,
          { headers }
        );
      } catch {
        return await postJson<any>(
          "/api/pharmacy/refunds/process",
          payload,
          { headers }
        );
      }
    }
  });
}


