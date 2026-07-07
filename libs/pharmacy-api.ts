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

export interface PharmacyDashboardStats {
  revenue_today: number;
  total_count_dispensed: number;
  pending_requests_count: number;
  low_stock_count: number;
  total_inventory_value: number;
  pending_requests: {
    id: string;
    patient_id: string;
    patient_name: string;
    phone_number: string;
    billing_code: string;
    total_amount: number;
    status: "pending";
    created_at: string;
  }[];
  low_stock_items: {
    id: string;
    name: string;
    category_name: string;
    stock: number;
    reorder_level: number;
    status: "Low stock";
  }[];
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

export async function addPharmacyDrug(drug: {
  name: string;
  generic_name?: string;
  category_id: string;
  batch_number?: string;
  expiry_date: string;
  stock: number;
  reorder_level: number;
  unit_price: number;
}) {
  return withPharmacySessionRetry((accessToken) =>
    postJson<BackendDrugItem>("/api/pharmacy/inventory", drug, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function updatePharmacyDrug(itemId: string, drug: Partial<{
  name: string;
  generic_name?: string;
  category_id: string;
  batch_number?: string;
  expiry_date: string;
  stock: number;
  reorder_level: number;
  unit_price: number;
}>) {
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
    getJson<{ items: PharmacyBillingRequest[] } | PharmacyBillingRequest[]>(endpoint, {
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

export async function updatePharmacyRequest(requestId: string, request: Partial<{
  patient_id: string;
  patient_name: string;
  phone_number: string;
  items: { pharmacy_item_id: string; quantity: number }[];
}>) {
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
        hospital_id: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
    }>("/api/pharmacy/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}
