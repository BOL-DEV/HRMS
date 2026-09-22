import { getJson } from "@/libs/api";
import { withPharmacySessionRetry } from "@/libs/pharmacy-api";
import { getAgentAccessToken } from "@/libs/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

// ==========================================
// 1. Types & Interfaces for Pharmacy Reports
// ==========================================

export interface ReportPagination {
  total_items: number;
  page: number;
  limit: number;
  total_pages: number;
}

// --- 1. Drug Sales Summary Report ---
export interface DrugSalesReportItem {
  drug_id: string;
  drug_name: string;
  generic_name?: string;
  category_name?: string;
  current_stock: number;
  current_unit_price: number;
  quantity_sold: number;
  total_price: number;
  average_price: number;
}

export interface DrugSalesReportData {
  hospital_name?: string;
  pharmacy_unit_name?: string;
  filters?: {
    start_date?: string;
    end_date?: string;
    search?: string | null;
    pharmacy_unit_id?: string;
  };
  summary?: {
    total_unique_drugs: number;
    total_quantity_sold: number;
    total_sales_amount: number;
  };
  pagination: ReportPagination;
  drugs: DrugSalesReportItem[];
}

export interface DrugSalesReportResponse {
  status: number | string;
  message: string;
  data: DrugSalesReportData;
}

// --- 2. Detailed Drug Dispense Report ---
export interface DetailedDispenseRecord {
  item_id: string;
  request_id: string;
  dispensed_at: string;
  pharmacist_name: string;
  drug_name: string;
  generic_name?: string;
  quantity: number;
  unit_price: number;
  amount_paid: number;
  patient_name: string;
  phone_number?: string;
  patient_id?: string;
  billing_code?: string;
  receipt_no?: string;
  payment_method?: string;
}

export interface DetailedDispenseReportData {
  hospital_name?: string;
  pharmacy_unit_name?: string;
  filters?: {
    start_date?: string;
    end_date?: string;
    search?: string | null;
    pharmacist_id?: string | null;
    pharmacy_unit_id?: string;
  };
  summary?: {
    total_dispense_records: number;
    total_quantity: number;
    total_amount: number;
  };
  pagination: ReportPagination;
  records: DetailedDispenseRecord[];
}

export interface DetailedDispenseReportResponse {
  status: number | string;
  message: string;
  data: DetailedDispenseReportData;
}

// --- 3. Stock & Inventory Valuation Report ---
export interface StockInventoryItem {
  id: string;
  item_name: string;
  generic_name?: string;
  category_name?: string;
  batch_number?: string;
  expiry_date?: string;
  stock: number;
  reorder_level: number;
  unit_price: number;
  stock_valuation: number;
  stock_status: "IN STOCK" | "LOW STOCK" | "OUT OF STOCK" | string;
}

export interface StockInventoryReportData {
  hospital_name?: string;
  pharmacy_unit_name?: string;
  filters?: {
    category_id?: string | null;
    stock_status?: string | null;
    search?: string | null;
    pharmacy_unit_id?: string;
  };
  summary?: {
    total_drugs: number;
    total_units_in_stock: number;
    total_inventory_valuation: number;
    out_of_stock_count: number;
    low_stock_count: number;
  };
  pagination: ReportPagination;
  items: StockInventoryItem[];
}

export interface StockInventoryReportResponse {
  status: number | string;
  message: string;
  data: StockInventoryReportData;
}

// --- 4. Expiry & Near-Expiry Alerts Report ---
export interface ExpiryReportItem {
  id: string;
  drug_name: string;
  generic_name?: string;
  batch_number: string;
  expiry_date: string;
  days_remaining: number;
  stock: number;
  unit_price: number;
  value_at_risk: number;
  risk_status: string;
}

export interface ExpiryReportData {
  hospital_name?: string;
  pharmacy_unit_name?: string;
  filters?: {
    timeframe?: string;
    search?: string | null;
    pharmacy_unit_id?: string;
  };
  summary?: {
    expired_count: number;
    expired_valuation: number;
    expiring_30d_count: number;
    expiring_30d_valuation: number;
    expiring_60d_count: number;
    expiring_60d_valuation: number;
    expiring_90d_count: number;
    expiring_90d_valuation: number;
    total_at_risk_count: number;
    total_at_risk_valuation: number;
  };
  pagination: ReportPagination;
  items: ExpiryReportItem[];
}

export interface ExpiryReportResponse {
  status: number | string;
  message: string;
  data: ExpiryReportData;
}

// --- 5. Pharmacist Shift / Performance Report ---
export interface PharmacistPerformanceItem {
  pharmacist_id: string;
  pharmacist_name: string;
  email?: string;
  requests_count: number;
  total_quantity_dispensed: number;
  total_amount: number;
  cash_amount: number;
  pos_amount: number;
  transfer_amount: number;
}

export interface PharmacistPerformanceReportData {
  hospital_name?: string;
  pharmacy_unit_name?: string;
  filters?: {
    start_date?: string;
    end_date?: string;
    pharmacy_unit_id?: string;
  };
  summary?: {
    total_pharmacists: number;
    total_requests_processed: number;
    total_quantity_dispensed: number;
    total_revenue: number;
  };
  pagination: ReportPagination;
  pharmacists: PharmacistPerformanceItem[];
}

export interface PharmacistPerformanceReportResponse {
  status: number | string;
  message: string;
  data: PharmacistPerformanceReportData;
}

// --- 6. Drug Returns & Exchanges Audit Report ---
export interface ReturnsExchangesReportItem {
  id: string;
  exchange_code: string;
  created_at: string;
  patient_id?: string;
  patient_name?: string;
  phone_number?: string;
  total_returned_amount: number;
  total_replacement_amount: number;
  net_amount: number;
  additional_amount_paid: number;
  refund_amount: number;
  status: "pending_payment" | "pending_refund" | "completed" | "cancelled" | string;
  remarks?: string;
  pharmacist_name?: string;
}

export interface ReturnsExchangesReportData {
  hospital_name?: string;
  pharmacy_unit_name?: string;
  filters?: {
    start_date?: string;
    end_date?: string;
    status?: string | null;
    search?: string | null;
    pharmacy_unit_id?: string;
  };
  summary?: {
    total_exchanges: number;
    total_returned_amount: number;
    total_replacement_amount: number;
    total_additional_paid: number;
    total_refund_amount: number;
  };
  pagination: ReportPagination;
  exchanges: ReturnsExchangesReportItem[];
}

export interface ReturnsExchangesReportResponse {
  status: number | string;
  message: string;
  data: ReturnsExchangesReportData;
}

// ==========================================
// 2. API Fetch Functions
// ==========================================

export async function getDrugSalesReport(params?: {
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<DrugSalesReportResponse> {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<DrugSalesReportResponse>(`/api/pharmacy/report/drug${queryString}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getDetailedDispenseReport(params?: {
  start_date?: string;
  end_date?: string;
  search?: string;
  pharmacist_id?: string;
  page?: number;
  limit?: number;
}): Promise<DetailedDispenseReportResponse> {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.pharmacist_id) query.set("pharmacist_id", params.pharmacist_id);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<DetailedDispenseReportResponse>(`/api/pharmacy/report/detailed-report${queryString}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getStockInventoryReport(params?: {
  category_id?: string;
  stock_status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<StockInventoryReportResponse> {
  const query = new URLSearchParams();
  if (params?.category_id) query.set("category_id", params.category_id);
  if (params?.stock_status && params.stock_status !== "all") query.set("stock_status", params.stock_status);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<StockInventoryReportResponse>(`/api/pharmacy/report/stock-inventory${queryString}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getExpiryReport(params?: {
  timeframe?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ExpiryReportResponse> {
  const query = new URLSearchParams();
  if (params?.timeframe && params.timeframe !== "all") query.set("timeframe", params.timeframe);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<ExpiryReportResponse>(`/api/pharmacy/report/expiry${queryString}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getPharmacistPerformanceReport(params?: {
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}): Promise<PharmacistPerformanceReportResponse> {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<PharmacistPerformanceReportResponse>(`/api/pharmacy/report/pharmacist-performance${queryString}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

export async function getReturnsExchangesReport(params?: {
  start_date?: string;
  end_date?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ReturnsExchangesReportResponse> {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<ReturnsExchangesReportResponse>(`/api/pharmacy/report/returns-exchanges${queryString}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
}

// ==========================================
// 3. Print and Export Handlers
// ==========================================

/**
 * Opens backend-rendered printable HTML report in a new tab (bypasses pagination automatically)
 */
export function openPharmacyReportPrint(endpoint: string, filters: Record<string, any>) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "" && val !== "all") {
      query.set(key, String(val));
    }
  });
  query.set("print", "true");

  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : "";
  if (accessToken) {
    query.set("token", accessToken);
  }

  const printUrl = `${API_BASE_URL}${endpoint}?${query.toString()}`;
  const printWindow = window.open(printUrl, "_blank");
  if (printWindow) {
    printWindow.focus();
  }
}

/**
 * Downloads full dataset CSV export from backend (bypasses pagination automatically)
 */
export async function downloadPharmacyReportCsv(
  endpoint: string,
  filters: Record<string, any>,
  fileNamePrefix: string = "pharmacy_report"
) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "" && val !== "all") {
      query.set(key, String(val));
    }
  });
  query.set("export", "csv");

  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : "";

  const response = await fetch(`${API_BASE_URL}${endpoint}?${query.toString()}`, {
    method: "GET",
    headers: {
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export report (${response.statusText})`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", `${fileNamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
