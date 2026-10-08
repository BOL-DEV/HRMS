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
  const code = params.billing_code?.trim() || "";
  const patientId = params.patient_id?.trim() || "";

  return withAgentSessionRetry(async (accessToken) => {
    const headers = getAgentAuthHeaders(accessToken);

    const searchParams = new URLSearchParams();
    if (code) {
      searchParams.set("billing_code", code);
      searchParams.set("code", code);
      searchParams.set("search", code);
    }
    if (patientId) searchParams.set("patient_id", patientId);

    // Strategy 1: /api/payments/pharmacy-requests
    try {
      const res = await getJson<AgentPendingPharmacyRequestsResponse>(
        `/api/payments/pharmacy-requests?${searchParams.toString()}`,
        { headers }
      );
      const rawData = (res as any)?.data ?? res;
      if (Array.isArray(rawData) && rawData.length > 0) return res;
      if (Array.isArray((rawData as any)?.requests) && (rawData as any).requests.length > 0) return res;
      if (Array.isArray((rawData as any)?.items) && (rawData as any).items.length > 0) return res;
      if (rawData && typeof rawData === "object" && ((rawData as any).billing_code || (rawData as any).id)) return res;
    } catch {}

    // Strategy 2: /api/pharmacy/request
    if (code) {
      try {
        const res = await getJson<any>(
          `/api/pharmacy/request?search=${encodeURIComponent(code)}&status=all`,
          { headers }
        );
        if (res) return res;
      } catch {}

      try {
        const res = await getJson<any>(
          `/api/pharmacy/request/${encodeURIComponent(code)}`,
          { headers }
        );
        if (res) return res;
      } catch {}
    }

    return getJson<AgentPendingPharmacyRequestsResponse>(
      `/api/payments/pharmacy-requests?${searchParams.toString()}`,
      { headers }
    );
  });
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

    const parseList = (res: any): any[] => {
      if (!res) return [];
      const rawData = res.data ?? res;
      if (Array.isArray(rawData)) return rawData;

      // Single exchange object at top level
      if (
        rawData &&
        typeof rawData === "object" &&
        (rawData.exchange_code ||
          rawData.exchangeCode ||
          rawData.code ||
          rawData.exchange_id ||
          rawData.exchangeId ||
          (rawData.id && (rawData.net_amount !== undefined || rawData.total_returned_amount !== undefined || rawData.returned_items || rawData.replacement_items)))
      ) {
        return [rawData];
      }

      if (Array.isArray(rawData?.exchanges)) return rawData.exchanges;
      if (Array.isArray(rawData?.pending_exchanges)) return rawData.pending_exchanges;
      if (Array.isArray(rawData?.pendingExchanges)) return rawData.pendingExchanges;
      if (Array.isArray(rawData?.records)) return rawData.records;
      if (Array.isArray(rawData?.refunds)) return rawData.refunds;
      if (Array.isArray(rawData?.rows)) return rawData.rows;
      if (Array.isArray(rawData?.list)) return rawData.list;
      if (Array.isArray(rawData?.results)) return rawData.results;
      if (Array.isArray(rawData?.data)) return rawData.data;

      if (Array.isArray(rawData?.items)) {
        const first = rawData.items[0];
        if (first && (first.exchange_code || first.exchangeCode || first.code || first.net_amount !== undefined)) {
          return rawData.items;
        }
      }

      if (rawData?.exchange && typeof rawData.exchange === "object") return [rawData.exchange];
      if (rawData?.record && typeof rawData.record === "object") return [rawData.record];
      if (rawData?.item && typeof rawData.item === "object") return [rawData.item];

      if (rawData && typeof rawData === "object") {
        if (
          rawData.exchange_code ||
          rawData.exchangeCode ||
          rawData.code ||
          rawData.id ||
          rawData._id ||
          rawData.billing_code ||
          rawData.billingCode ||
          rawData.reference_code ||
          rawData.referenceCode ||
          rawData.patient_name ||
          rawData.net_amount !== undefined ||
          rawData.total_returned_amount !== undefined
        ) {
          return [rawData];
        }
      }
      return [];
    };

    const isMatch = (item: any, target: string) => {
      if (!item || typeof item !== "object") return false;
      const t = target.trim().toUpperCase();
      const candidates = [
        item.exchange_code,
        item.exchangeCode,
        item.code,
        item.id,
        item._id,
        item.exchange_id,
        item.exchangeId,
        item.exchange_number,
        item.exchangeNumber,
        item.billing_code,
        item.billingCode,
        item.bill_code,
        item.billCode,
        item.receipt_no,
        item.receiptNo,
        item.original_billing_code,
        item.originalBillingCode,
        item.original_receipt_no,
        item.originalReceiptNo,
        item.reference_code,
        item.referenceCode,
        item.reference,
        item.reference_no,
        item.referenceNo,
        item.cashier_bill_code,
        item.patient_id,
        item.patientId,
        item.exchange?.exchange_code,
        item.exchange?.exchangeCode,
        item.exchange?.code,
        item.exchange?.id,
      ]
        .filter(Boolean)
        .map((s) => String(s).trim().toUpperCase());

      return candidates.some((c) => c === t || c.includes(t) || t.includes(c));
    };

    if (cleanSearch) {
      const upperSearch = cleanSearch.toUpperCase();

      // Official documented Cashier Pending Exchange search endpoint (DRUG_EXCHANGE_FRONTEND_GUIDE.md §4)
      const searchEndpoints = [
        `/api/payments/drug-exchange/pending?search=${encodeURIComponent(cleanSearch)}&status=pending_payment`,
        `/api/payments/drug-exchange/pending?search=${encodeURIComponent(cleanSearch)}`,
        `/api/payments/drug-exchange/pending`,
      ];

      for (const endpoint of searchEndpoints) {
        try {
          const res = await getJson<any>(endpoint, { headers });
          const list = parseList(res);
          if (list.length > 0) {
            const matched = list.filter((it) => isMatch(it, upperSearch));
            if (matched.length > 0) {
              return { status: 200, message: "Success", data: matched };
            }
            if (list.length === 1 && endpoint.includes("search=")) {
              return { status: 200, message: "Success", data: list };
            }
          }
        } catch {}
      }

      return { status: 200, message: "No exchanges found", data: [] };
    }

    // Default when no search query: return pending list (DRUG_EXCHANGE_FRONTEND_GUIDE.md §4)
    try {
      const res = await getJson<any>("/api/payments/drug-exchange/pending?status=pending_payment", { headers });
      const list = parseList(res);
      if (list.length > 0) {
        return { status: 200, message: "Success", data: list };
      }
    } catch {}

    try {
      const res = await getJson<any>("/api/payments/drug-exchange/pending", { headers });
      const list = parseList(res);
      return { status: 200, message: "Success", data: list };
    } catch {
      return { status: 200, message: "No exchanges found", data: [] };
    }
  });
}

export async function processDrugExchangePayment(payload: {
  exchange_code: string;
  payment_type: AgentPaymentType;
  exchange_id?: string;
  code?: string;
  id?: string;
  patient_id?: string;
  patient_name?: string;
  amount?: number;
  net_amount?: number;
  payment_method?: string;
  remarks?: string;
}) {
  return withAgentSessionRetry(async (accessToken) => {
    const headers = getAgentAuthHeaders(accessToken);
    const code = (payload.exchange_code || payload.code || "").trim().toUpperCase();
    const paymentTypeLower = String(payload.payment_type || "cash").toLowerCase();

    return await postJson<ProcessPaymentResponse>(
      "/api/payments/drug-exchange/process",
      {
        exchange_code: code,
        exchangeCode: code,
        code: code,
        payment_type: paymentTypeLower,
        paymentType: paymentTypeLower,
        payment_method: paymentTypeLower.toUpperCase(),
      },
      { headers }
    );
  });
}

export async function refundDrugExchange(payload: {
  exchange_code: string;
  payment_type: AgentPaymentType;
  exchange_id?: string;
  code?: string;
  id?: string;
  patient_id?: string;
  patient_name?: string;
  amount?: number;
  net_amount?: number;
  payment_method?: string;
  remarks?: string;
}) {
  return withAgentSessionRetry(async (accessToken) => {
    const headers = getAgentAuthHeaders(accessToken);
    const code = payload.exchange_code || payload.code || "";
    const paymentTypeLower = String(payload.payment_type || "cash").toLowerCase();
    const paymentTypeUpper = paymentTypeLower.toUpperCase();

    // Strategy 1: POST /api/payments/drug-exchange/refund
    try {
      return await postJson<{
        status: string | number;
        message?: string;
        data: any;
      }>(
        "/api/payments/drug-exchange/refund",
        {
          exchange_code: code,
          payment_type: paymentTypeLower,
          remarks: payload.remarks || "Cashier refund disbursement",
        },
        { headers }
      );
    } catch (err: any) {
      // Strategy 2: POST /api/pharmacy-store/refunds/approve
      try {
        return await postJson<any>(
          "/api/pharmacy-store/refunds/approve",
          {
            exchange_code: code,
            remarks: payload.remarks || "Store refund approval",
          },
          { headers }
        );
      } catch (err2: any) {
        throw new Error(
          err?.message ||
            err2?.message ||
            `Unable to process refund for exchange "${code}".`
        );
      }
    }
  });
}


