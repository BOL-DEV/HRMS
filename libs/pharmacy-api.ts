import { getJson, postJson, patchJson, deleteJson } from "@/libs/api";
import { getAccessToken, getAgentRefreshToken, storeAgentTokens, clearAgentTokens } from "@/libs/auth";
import { ApiError } from "@/libs/api";

// --- Types ---

export interface PharmacyCategory {
  id: string;
  hospital_id: string;
  name: string;
  is_active: boolean;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface BackendDrugItem {
  id: string;
  name: string;
  generic_name?: string;
  category_id: string;
  category_name: string;
  batch_number?: string;
  expiry_date: string; // YYYY-MM-DD
  stock: number;
  reorder_level: number;
  unit_price: number;
  status: "In stock" | "Low stock" | "Expired";
  is_active: boolean;
}

export interface GetPharmacyInventoryResponse {
  total_items: number;
  page: number;
  limit: number;
  total_pages: number;
  items: BackendDrugItem[];
}

export interface GetPharmacyInventoryParams {
  category_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export type PharmacyDrugPayload = {
  name: string;
  generic_name?: string;
  category_id: string;
  batch_number?: string;
  expiry_date: string;
  stock: number;
  reorder_level: number;
  unit_price: number;
  status?: string;
};

export type PharmacyRequestUpdatePayload = Partial<{
  patient_id: string;
  patient_name: string;
  phone_number: string;
  items: { pharmacy_item_id: string; quantity: number }[];
}>;

export interface PatientMatchItem {
  patient_id: string;
  patient_name: string;
  phone_number: string;
}

export interface PharmacyRequestItem {
  pharmacy_item_id: string;
  quantity: number;
  name?: string;
  unit_price?: number;
  amount?: number;
}

export interface PharmacyBillingRequest {
  id: string;
  patient_id: string;
  patient_name: string;
  phone_number: string;
  billing_code: string;
  total_amount: number;
  status: "pending" | "dispensed" | "cancelled";
  created_at: string;
  items?: {
    id: string;
    pharmacy_item_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }[];
}

export interface GetPharmacyRequestsParams {
  status?: "pending" | "dispensed" | "cancelled";
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface GetPharmacyRequestsResponse {
  total_items?: number;
  page?: number;
  limit?: number;
  total_pages?: number;
  requests?: PharmacyBillingRequest[];
  items?: PharmacyBillingRequest[];
}

export interface PharmacyDashboardStats {
  summary?: {
    total_inventory_items: number;
    total_categories: number;
    low_stock_items: number;
    expired_items: number;
    pending_billing_requests: number;
  };
  sales?: {
    today_total_revenue: number;
    today_dispensed_count: number;
  };
  low_stock_alerts?: Array<{
    id: string;
    name: string;
    generic_name?: string;
    stock: number;
    reorder_level: number;
    status: string;
  }>;
  expiry_alerts?: Array<{
    id: string;
    name: string;
    generic_name?: string;
    expiry_date: string;
    status: string;
  }>;

  // Live backend fields
  revenue_today?: number;
  total_count_dispensed?: number;
  pending_requests_count?: number;
  low_stock_count?: number;
  total_inventory_value?: number;
  pending_requests?: Array<{
    id: string;
    patient_id: string;
    patient_name: string;
    phone_number: string;
    billing_code: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  low_stock_items?: Array<{
    id: string;
    name: string;
    generic_name?: string;
    stock: number;
    reorder_level: number;
    status: string;
  }>;
  expired_items?: number;
  expiry_items?: Array<{
    id: string;
    name: string;
    generic_name?: string;
    expiry_date: string;
    status: string;
  }>;
}

export function unwrapPharmacyData<T>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && "data" in value) {
    const data = (value as { data?: unknown }).data;
    return (data ?? fallback) as T;
  }

  return (value ?? fallback) as T;
}

// --- Session Retry Helpers ---

async function refreshPharmacySession() {
  const refreshToken = getAgentRefreshToken();
  if (!refreshToken) {
    throw new Error("Your session has expired. Please login again.");
  }

  const response = await postJson<{ data: { accessToken: string; refreshToken: string } }>("/api/auth/refresh", {
    refreshToken,
  });

  const tokens = response.data;
  if (!tokens?.accessToken || !tokens.refreshToken) {
    throw new Error("Unable to refresh your session. Please login again.");
  }

  storeAgentTokens(tokens);
  return tokens.accessToken;
}

export async function withPharmacySessionRetry<T>(request: (accessToken: string) => Promise<T>) {
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
      const nextAccessToken = await refreshPharmacySession();
      return await request(nextAccessToken);
    } catch (refreshError) {
      clearAgentTokens();
      throw refreshError;
    }
  }
}

// --- Category APIs ---

export async function getPharmacyCategories() {
  return withPharmacySessionRetry((accessToken) =>
    getJson<PharmacyCategory[]>("/api/pharmacy/categories", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function createPharmacyCategory(name: string) {
  return withPharmacySessionRetry((accessToken) =>
    postJson<PharmacyCategory>("/api/pharmacy/categories", { name }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function updatePharmacyCategory(categoryId: string, name: string, isActive: boolean) {
  return withPharmacySessionRetry((accessToken) =>
    patchJson<PharmacyCategory>(`/api/pharmacy/categories/${categoryId}`, { name, is_active: isActive }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function deletePharmacyCategory(categoryId: string) {
  return withPharmacySessionRetry((accessToken) =>
    deleteJson<void>(`/api/pharmacy/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

// --- Inventory APIs ---

export async function getPharmacyInventory(params?: GetPharmacyInventoryParams) {
  const searchParams = new URLSearchParams();
  if (params?.category_id) searchParams.append("category_id", params.category_id);
  if (params?.status) searchParams.append("status", params.status);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));

  const queryStr = searchParams.toString();
  const endpoint = `/api/pharmacy/inventory${queryStr ? `?${queryStr}` : ""}`;

  return withPharmacySessionRetry((accessToken) =>
    getJson<GetPharmacyInventoryResponse>(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function addPharmacyDrug(drug: PharmacyDrugPayload) {
  return withPharmacySessionRetry((accessToken) =>
    postJson<BackendDrugItem>("/api/pharmacy/inventory", drug, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function updatePharmacyDrug(itemId: string, drug: Partial<PharmacyDrugPayload>) {
  return withPharmacySessionRetry((accessToken) =>
    patchJson<BackendDrugItem>(`/api/pharmacy/inventory/${itemId}`, drug, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function deletePharmacyDrug(itemId: string) {
  return withPharmacySessionRetry((accessToken) =>
    deleteJson<void>(`/api/pharmacy/inventory/${itemId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

// --- Patient Match API ---

export async function searchPatientsForPharmacy(query: string) {
  return withPharmacySessionRetry((accessToken) =>
    getJson<PatientMatchItem[]>(`/api/pharmacy/patient-match?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

// --- Billing Requests Workflow APIs ---

export async function createPharmacyRequest(request: {
  patient_id: string;
  patient_name: string;
  phone_number: string;
  items: { pharmacy_item_id: string; quantity: number }[];
}) {
  return withPharmacySessionRetry((accessToken) =>
    postJson<PharmacyBillingRequest>("/api/pharmacy/request", request, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getPharmacyRequests(params?: GetPharmacyRequestsParams) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.start_date) searchParams.append("start_date", params.start_date);
  if (params?.end_date) searchParams.append("end_date", params.end_date);
  if (params?.page) searchParams.append("page", String(params.page));
  if (params?.limit) searchParams.append("limit", String(params.limit));

  const queryStr = searchParams.toString();
  const endpoint = `/api/pharmacy/request${queryStr ? `?${queryStr}` : ""}`;

  return withPharmacySessionRetry((accessToken) =>
    getJson<GetPharmacyRequestsResponse | PharmacyBillingRequest[]>(endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getPharmacyRequestById(requestId: string) {
  return withPharmacySessionRetry((accessToken) =>
    getJson<PharmacyBillingRequest>(`/api/pharmacy/request/${requestId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function updatePharmacyRequest(requestId: string, request: PharmacyRequestUpdatePayload) {
  return withPharmacySessionRetry((accessToken) =>
    patchJson<PharmacyBillingRequest>(`/api/pharmacy/request/${requestId}`, request, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function cancelPharmacyRequest(requestId: string) {
  return withPharmacySessionRetry((accessToken) =>
    patchJson<PharmacyBillingRequest>(`/api/pharmacy/request/${requestId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function payPharmacyRequestSelf(requestId: string, paymentType: "cash" | "transfer" | "pos") {
  return withPharmacySessionRetry((accessToken) =>
    postJson<{ message: string }>(`/api/pharmacy/request/${requestId}/pay`, { payment_type: paymentType }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

// --- Dashboard Stats APIs ---

export async function getPharmacyDashboardStats() {
  return withPharmacySessionRetry((accessToken) =>
    getJson<PharmacyDashboardStats>("/api/pharmacy/dashboard", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getPharmacyProfile() {
  return withPharmacySessionRetry((accessToken) =>
    getJson<{
      status: number;
      message: string;
      data: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        role: "PHARMACY";
        is_active: boolean;
        created_at: string;
        hospital_id: string;
        hospital_name: string;
        hospital_code: string;
        hospital_modules: {
          has_pharmacy_module: boolean;
          allow_pharmacy_self_pay: boolean;
          allow_agent_pharmacy_pay: boolean;
          allow_pharmacy_walk_in: boolean;
        };
        modules?: string[];
      };
    }>("/api/pharmacy/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function lookupPatientForPharmacy(patientId: string) {
  const response = await withPharmacySessionRetry((accessToken) =>
    getJson<{
      status: number;
      message: string;
      data: {
        exists: boolean;
        patient: {
          patient_id: string;
          patient_name: string;
          phone_number: string;
        } | null;
      };
    }>(`/api/pharmacy/patients/${patientId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
  return response.data;
}

export async function searchPharmacyHospitalPatients(
  hospitalId: string,
  params: { query: string; limit?: number },
) {
  const searchParams = new URLSearchParams();
  searchParams.set("query", params.query);
  if (params.limit) searchParams.set("limit", String(params.limit));

  return withPharmacySessionRetry((accessToken) =>
    getJson<{
      status: number;
      message: string;
      data: {
        patients: Array<{
          patient_id: string;
          patient_name: string;
          phone_number: string;
          display_value: string;
        }>;
      };
    }>(
      `/api/hospitals/${hospitalId}/patients/search?${searchParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    ),
  );
}


// --- Reports APIs and Interfaces ---

export interface PharmacyReportOverviewResponse {
  status: number;
  message: string;
  data: {
    summary?: {
      total_revenue: number;
      dispensed_count: number;
      unique_patients_served: number;
    };
    sales_by_payment_type?: Array<{
      payment_type: string;
      amount: number;
      count: number;
    }>;
    top_selling_items?: Array<{
      pharmacy_item_id: string;
      item_name: string;
      generic_name?: string;
      quantity_sold: number;
      revenue_generated: number;
    }>;
    financial_summary?: {
      total_revenue: number;
      payment_breakdown: {
        cash: number;
        pos: number;
        transfer: number;
      };
    };
    top_dispensed_drugs?: Array<{
      item_name: string;
      generic_name: string;
      total_quantity: number;
      total_revenue: number;
    }>;
    dispensed_summary?: Array<{
      date: string;
      pharmacist_name: string;
      requests_count: number;
      total_amount: number;
    }>;
  };
}

export interface PharmacyReportDispensedResponse {
  status: number;
  message: string;
  data: {
    date_range: {
      start_date: string;
      end_date: string;
    };
    total_items: number;
    page: number;
    limit: number;
    total_pages: number;
    logs?: Array<{
      id: string;
      billing_code: string;
      patient_id: string;
      patient_name: string;
      phone_number: string;
      total_amount: number;
      dispensed_at: string;
      pharmacist_name: string;
      payment_type: string;
      items: Array<{
        pharmacy_item_id: string;
        item_name: string;
        generic_name?: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>;
    }>;
    requests?: Array<{
      id: string;
      billing_code: string;
      patient_id: string;
      patient_name: string;
      phone_number: string;
      total_amount: number;
      dispensed_at: string;
      pharmacist_name: string;
      payment_type: string;
      items: Array<{
        pharmacy_item_id: string;
        item_name: string;
        generic_name?: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>;
    }>;
  };
}

export interface PharmacyReportStockAdditionsResponse {
  status: number;
  message: string;
  data: {
    date_range: {
      start_date: string;
      end_date: string;
    };
    total_items: number;
    page: number;
    limit: number;
    total_pages: number;
    logs: Array<{
      id: string;
      action_type: string;
      quantity_changed: number;
      old_stock: number;
      new_stock: number;
      old_batch: string;
      new_batch: string;
      old_expiry: string;
      new_expiry: string;
      created_at: string;
      item_name: string;
      generic_name: string;
      pharmacist_name: string;
    }>;
  };
}

export async function getPharmacyReportOverview(params?: { start_date?: string; end_date?: string }) {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<PharmacyReportOverviewResponse>(`/api/pharmacy/report/overview${suffix}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getPharmacyReportDispensed(params?: { start_date?: string; end_date?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<PharmacyReportDispensedResponse>(`/api/pharmacy/report/dispensed${suffix}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getPharmacyReportStockAdditions(params?: { start_date?: string; end_date?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<PharmacyReportStockAdditionsResponse>(`/api/pharmacy/report/stock-additions${suffix}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getPharmacyWalkInPatient(phoneNumber: string) {
  return withPharmacySessionRetry((accessToken) =>
    getJson<{
      status: number;
      message: string;
      data: {
        patient_id: "MANUAL";
        patient_name: string;
        phone_number: string;
      } | null;
    }>('/api/pharmacy/walk-in/' + phoneNumber, {
      headers: { Authorization: 'Bearer ' + accessToken },
    })
  );
}

export async function getPharmacyInventoryStockAddition(params?: {
  search?: string;
  category_id?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.category_id) searchParams.set("category_id", params.category_id);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const queryStr = searchParams.toString();
  const endpoint = '/api/pharmacy/inventory/stock-addition' + (queryStr ? '?' + queryStr : '');

  return withPharmacySessionRetry((accessToken) =>
    getJson<GetPharmacyInventoryResponse>(endpoint, {
      headers: { Authorization: 'Bearer ' + accessToken },
    })
  );
}

export async function restockPharmacyItem(payload: {
  pharmacy_item_id: string;
  quantity: number;
  batch_number?: string;
  expiry_date?: string;
}) {
  return withPharmacySessionRetry((accessToken) =>
    postJson<{
      status: number;
      message: string;
      data: BackendDrugItem;
    }>("/api/pharmacy/inventory/stock-addition", payload, {
      headers: { Authorization: 'Bearer ' + accessToken },
    })
  );
}

export async function getPharmacyInventoryItemById(itemId: string) {
  return withPharmacySessionRetry((accessToken) =>
    getJson<{
      status: number;
      message: string;
      data: BackendDrugItem;
    }>('/api/pharmacy/inventory/' + itemId, {
      headers: { Authorization: 'Bearer ' + accessToken },
    })
  );
}
