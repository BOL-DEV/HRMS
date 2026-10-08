import { getJson } from "@/libs/api";
import { withPharmacySessionRetry, unwrapPharmacyData } from "@/libs/pharmacy-api";
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
// 2. API Fetch Functions & Dynamic Fallbacks
// ==========================================

async function fetchDispensedRequestsFallback(params?: {
  start_date?: string;
  end_date?: string;
  search?: string;
}) {
  let list: any[] = [];

  // 1. Try report/dispensed endpoints
  try {
    const reportRes = await withPharmacySessionRetry((token) =>
      getJson<any>(`/api/pharmacy/report/dispensed`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).catch(() => null);

    const logs = reportRes?.data?.logs || reportRes?.data?.requests || reportRes?.logs || reportRes?.requests;
    if (Array.isArray(logs) && logs.length > 0) {
      list = logs;
    }
  } catch {
    // ignore
  }

  // 2. Try pharmacy request endpoints
  if (list.length === 0) {
    const endpoints = [
      `/api/pharmacy/request?status=dispensed&limit=200`,
      `/api/pharmacy/request?status=dispensed`,
      `/api/pharmacy/requests?status=dispensed&limit=200`,
      `/api/pharmacy/requests?status=dispensed`,
      `/api/pharmacy/request?limit=200`,
      `/api/pharmacy/requests?limit=200`,
    ];

    for (const ep of endpoints) {
      try {
        const reqRes = await withPharmacySessionRetry((token) =>
          getJson<any>(ep, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ).catch(() => null);

        const unwrap = unwrapPharmacyData<any>(reqRes, []);
        const epList = Array.isArray(unwrap) ? unwrap : unwrap?.requests ?? unwrap?.items ?? unwrap?.data ?? [];
        if (Array.isArray(epList) && epList.length > 0) {
          const dispensedOnly = epList.filter((r: any) => !r.status || r.status.toLowerCase() === "dispensed");
          list = dispensedOnly.length > 0 ? dispensedOnly : epList;
          break;
        }
      } catch {
        // ignore and try next
      }
    }
  }

  // Filter fallback records by start_date and end_date if provided
  if (list.length > 0 && (params?.start_date || params?.end_date)) {
    const sDate = params.start_date || "1970-01-01";
    const eDate = params.end_date || "2099-12-31";
    list = list.filter((r: any) => {
      const dateStr = r.dispensed_at || r.created_at || r.updated_at || "";
      if (!dateStr) return true;
      const formatted = dateStr.slice(0, 10);
      return formatted >= sDate && formatted <= eDate;
    });
  }

  return list;
}

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

  const queryString = query.toString() ? `?${query.toString()}` : "";

  let primaryRes: DrugSalesReportResponse | null = null;
  try {
    primaryRes = await withPharmacySessionRetry((accessToken) =>
      getJson<DrugSalesReportResponse>(`/api/pharmacy/report/drug${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );
  } catch {
    primaryRes = null;
  }

  if (primaryRes && (primaryRes.data || (primaryRes as any).status === 200 || (primaryRes as any).drugs)) {
    return primaryRes;
  }

  // Fallback: build from dispensed requests
  const dispensedRequests = await fetchDispensedRequestsFallback(params);
  if (dispensedRequests.length > 0) {
    const searchLower = params?.search?.trim().toLowerCase();
    const drugMap = new Map<string, DrugSalesReportItem>();

    for (const req of dispensedRequests) {
      const items = req.items || [];
      for (const item of items) {
        const drugName = item.item_name || item.name || "Medication";
        const genericName = item.generic_name || "";
        if (searchLower && !drugName.toLowerCase().includes(searchLower) && !genericName.toLowerCase().includes(searchLower)) {
          continue;
        }

        const id = item.pharmacy_item_id || item.id || drugName;
        const qty = Number(item.quantity || 0);
        const unitPrice = Number(item.unit_price || 0);
        const totalPrice = Number(item.total_price || item.amount || (unitPrice * qty));

        if (drugMap.has(id)) {
          const existing = drugMap.get(id)!;
          existing.quantity_sold += qty;
          existing.total_price += totalPrice;
          existing.average_price = existing.quantity_sold > 0 ? existing.total_price / existing.quantity_sold : unitPrice;
        } else {
          drugMap.set(id, {
            drug_id: id,
            drug_name: drugName,
            generic_name: genericName || undefined,
            category_name: item.category_name || "General",
            current_stock: Number(item.stock || 0),
            current_unit_price: unitPrice,
            quantity_sold: qty,
            total_price: totalPrice,
            average_price: unitPrice,
          });
        }
      }
    }

    const drugs = Array.from(drugMap.values());
    const total_unique_drugs = drugs.length;
    const total_quantity_sold = drugs.reduce((acc, d) => acc + d.quantity_sold, 0);
    const total_sales_amount = drugs.reduce((acc, d) => acc + d.total_price, 0);

    return {
      status: 200,
      message: "Pharmacy drug sales report retrieved successfully",
      data: {
        hospital_name: "Hospital Pharmacy",
        pharmacy_unit_name: "Main Dispensary",
        filters: {
          start_date: params?.start_date,
          end_date: params?.end_date,
          search: params?.search,
        },
        summary: {
          total_unique_drugs,
          total_quantity_sold,
          total_sales_amount,
        },
        pagination: {
          total_items: drugs.length,
          page: params?.page || 1,
          limit: params?.limit || 20,
          total_pages: Math.ceil(drugs.length / (params?.limit || 20)) || 1,
        },
        drugs,
      },
    };
  }

  return (
    primaryRes || {
      status: 200,
      message: "No sales data found",
      data: {
        summary: { total_unique_drugs: 0, total_quantity_sold: 0, total_sales_amount: 0 },
        pagination: { total_items: 0, page: 1, limit: 20, total_pages: 1 },
        drugs: [],
      },
    }
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

  const queryString = query.toString() ? `?${query.toString()}` : "";

  let primaryRes: DetailedDispenseReportResponse | null = null;
  try {
    primaryRes = await withPharmacySessionRetry((accessToken) =>
      getJson<DetailedDispenseReportResponse>(`/api/pharmacy/report/detailed-report${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );
  } catch {
    primaryRes = null;
  }

  if (primaryRes && (primaryRes.data || (primaryRes as any).status === 200 || (primaryRes as any).records)) {
    return primaryRes;
  }

  // Fallback: build from dispensed requests
  const dispensedRequests = await fetchDispensedRequestsFallback(params);
  if (dispensedRequests.length > 0) {
    const searchLower = params?.search?.trim().toLowerCase();
    const records: DetailedDispenseRecord[] = [];

    for (const req of dispensedRequests) {
      const items = req.items || [];
      const patientName = req.patient_name || "Walk-in Patient";
      const billingCode = req.billing_code || "";
      const patientId = req.patient_id || "";
      const phone = req.phone_number || "";

      for (const item of items) {
        const drugName = item.item_name || item.name || "Medication";
        const genericName = item.generic_name || "";

        if (
          searchLower &&
          !drugName.toLowerCase().includes(searchLower) &&
          !genericName.toLowerCase().includes(searchLower) &&
          !patientName.toLowerCase().includes(searchLower) &&
          !billingCode.toLowerCase().includes(searchLower) &&
          !patientId.toLowerCase().includes(searchLower) &&
          !phone.toLowerCase().includes(searchLower)
        ) {
          continue;
        }

        const qty = Number(item.quantity || 0);
        const unitPrice = Number(item.unit_price || 0);
        const amountPaid = Number(item.total_price || item.amount || (unitPrice * qty));

        records.push({
          item_id: item.id || `${req.id}-${records.length}`,
          request_id: req.id,
          dispensed_at: req.dispensed_at || req.created_at,
          pharmacist_name: req.pharmacist_name || "Pharmacist",
          drug_name: drugName,
          generic_name: genericName || undefined,
          quantity: qty,
          unit_price: unitPrice,
          amount_paid: amountPaid,
          patient_name: patientName,
          phone_number: phone,
          patient_id: patientId,
          billing_code: billingCode,
          receipt_no: req.receipt_no || billingCode,
          payment_method: req.payment_type || req.payment_method || "cash",
        });
      }
    }

    const total_quantity = records.reduce((acc, r) => acc + r.quantity, 0);
    const total_amount = records.reduce((acc, r) => acc + r.amount_paid, 0);

    return {
      status: 200,
      message: "Detailed pharmacy dispense report retrieved successfully",
      data: {
        hospital_name: "Hospital Pharmacy",
        pharmacy_unit_name: "Main Dispensary",
        filters: {
          start_date: params?.start_date,
          end_date: params?.end_date,
          search: params?.search,
          pharmacist_id: params?.pharmacist_id,
        },
        summary: {
          total_dispense_records: records.length,
          total_quantity,
          total_amount,
        },
        pagination: {
          total_items: records.length,
          page: params?.page || 1,
          limit: params?.limit || 20,
          total_pages: Math.ceil(records.length / (params?.limit || 20)) || 1,
        },
        records,
      },
    };
  }

  return (
    primaryRes || {
      status: 200,
      message: "No dispense records found",
      data: {
        summary: { total_dispense_records: 0, total_quantity: 0, total_amount: 0 },
        pagination: { total_items: 0, page: 1, limit: 20, total_pages: 1 },
        records: [],
      },
    }
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

  const queryString = query.toString() ? `?${query.toString()}` : "";

  let primaryRes: StockInventoryReportResponse | null = null;
  try {
    primaryRes = await withPharmacySessionRetry((accessToken) =>
      getJson<StockInventoryReportResponse>(`/api/pharmacy/report/stock-inventory${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );
  } catch {
    primaryRes = null;
  }

  if (primaryRes && (primaryRes.data || (primaryRes as any).status === 200 || (primaryRes as any).items)) {
    return primaryRes;
  }

  // Fallback to /api/pharmacy/inventory
  try {
    const invRes = await withPharmacySessionRetry((token) =>
      getJson<any>(`/api/pharmacy/inventory?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).catch(() => null);

    const invData = unwrapPharmacyData<any>(invRes, null);
    const invItems = invData?.items ?? invData ?? [];
    if (Array.isArray(invItems) && invItems.length > 0) {
      const items: StockInventoryItem[] = invItems.map((it: any) => {
        const stock = Number(it.stock || 0);
        const unitPrice = Number(it.unit_price || 0);
        const reorderLevel = Number(it.reorder_level || 10);
        let stockStatus = "IN STOCK";
        if (stock <= 0) stockStatus = "OUT OF STOCK";
        else if (stock <= reorderLevel) stockStatus = "LOW STOCK";

        return {
          id: it.id,
          item_name: it.name || it.item_name || "Medication",
          generic_name: it.generic_name,
          category_name: it.category_name || "General",
          batch_number: it.batch_number,
          expiry_date: it.expiry_date,
          stock,
          reorder_level: reorderLevel,
          unit_price: unitPrice,
          stock_valuation: stock * unitPrice,
          stock_status: stockStatus,
        };
      });

      return {
        status: 200,
        message: "Stock inventory report retrieved successfully",
        data: {
          summary: {
            total_drugs: items.length,
            total_units_in_stock: items.reduce((acc, it) => acc + it.stock, 0),
            total_inventory_valuation: items.reduce((acc, it) => acc + it.stock_valuation, 0),
            out_of_stock_count: items.filter((it) => it.stock <= 0).length,
            low_stock_count: items.filter((it) => it.stock > 0 && it.stock <= it.reorder_level).length,
          },
          pagination: {
            total_items: items.length,
            page: 1,
            limit: 100,
            total_pages: 1,
          },
          items,
        },
      };
    }
  } catch {
    // ignore
  }

  return (
    primaryRes || {
      status: 200,
      message: "No inventory data found",
      data: {
        summary: { total_drugs: 0, total_units_in_stock: 0, total_inventory_valuation: 0, out_of_stock_count: 0, low_stock_count: 0 },
        pagination: { total_items: 0, page: 1, limit: 20, total_pages: 1 },
        items: [],
      },
    }
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

  const queryString = query.toString() ? `?${query.toString()}` : "";

  let primaryRes: ExpiryReportResponse | null = null;
  try {
    primaryRes = await withPharmacySessionRetry((accessToken) =>
      getJson<ExpiryReportResponse>(`/api/pharmacy/report/expiry${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );
  } catch {
    primaryRes = null;
  }

  if (primaryRes && (primaryRes.data || (primaryRes as any).status === 200 || (primaryRes as any).items)) {
    return primaryRes;
  }

  // Fallback to /api/pharmacy/inventory
  try {
    const invRes = await withPharmacySessionRetry((token) =>
      getJson<any>(`/api/pharmacy/inventory?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).catch(() => null);

    const invData = unwrapPharmacyData<any>(invRes, null);
    const invItems = invData?.items ?? invData ?? [];
    if (Array.isArray(invItems) && invItems.length > 0) {
      const now = Date.now();
      const items: ExpiryReportItem[] = [];

      for (const it of invItems) {
        if (!it.expiry_date) continue;
        const expTime = new Date(it.expiry_date).getTime();
        const daysToExpiry = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        const stock = Number(it.stock || 0);
        const unitPrice = Number(it.unit_price || 0);

        let riskStatus = "LOW RISK";
        if (daysToExpiry <= 0) riskStatus = "EXPIRED";
        else if (daysToExpiry <= 30) riskStatus = "CRITICAL (30d)";
        else if (daysToExpiry <= 60) riskStatus = "MODERATE (60d)";
        else if (daysToExpiry <= 90) riskStatus = "LOW RISK (90d)";
        else continue; // More than 90 days

        items.push({
          id: it.id,
          drug_name: it.name || it.item_name || "Medication",
          generic_name: it.generic_name,
          batch_number: it.batch_number || "BATCH-001",
          expiry_date: it.expiry_date,
          days_remaining: daysToExpiry,
          stock: stock,
          unit_price: unitPrice,
          value_at_risk: stock * unitPrice,
          risk_status: riskStatus,
        });
      }

      return {
        status: 200,
        message: "Expiry report retrieved successfully",
        data: {
          summary: {
            expired_count: items.filter((it) => it.days_remaining <= 0).length,
            expired_valuation: items.filter((it) => it.days_remaining <= 0).reduce((acc, it) => acc + it.value_at_risk, 0),
            expiring_30d_count: items.filter((it) => it.days_remaining > 0 && it.days_remaining <= 30).length,
            expiring_30d_valuation: items.filter((it) => it.days_remaining > 0 && it.days_remaining <= 30).reduce((acc, it) => acc + it.value_at_risk, 0),
            expiring_60d_count: items.filter((it) => it.days_remaining > 30 && it.days_remaining <= 60).length,
            expiring_60d_valuation: items.filter((it) => it.days_remaining > 30 && it.days_remaining <= 60).reduce((acc, it) => acc + it.value_at_risk, 0),
            expiring_90d_count: items.filter((it) => it.days_remaining > 60 && it.days_remaining <= 90).length,
            expiring_90d_valuation: items.filter((it) => it.days_remaining > 60 && it.days_remaining <= 90).reduce((acc, it) => acc + it.value_at_risk, 0),
            total_at_risk_count: items.length,
            total_at_risk_valuation: items.reduce((acc, it) => acc + it.value_at_risk, 0),
          },
          pagination: {
            total_items: items.length,
            page: 1,
            limit: 100,
            total_pages: 1,
          },
          items,
        },
      };
    }
  } catch {
    // ignore
  }

  return (
    primaryRes || {
      status: 200,
      message: "No expiry data found",
      data: {
        summary: {
          expired_count: 0,
          expired_valuation: 0,
          expiring_30d_count: 0,
          expiring_30d_valuation: 0,
          expiring_60d_count: 0,
          expiring_60d_valuation: 0,
          expiring_90d_count: 0,
          expiring_90d_valuation: 0,
          total_at_risk_count: 0,
          total_at_risk_valuation: 0,
        },
        pagination: { total_items: 0, page: 1, limit: 20, total_pages: 1 },
        items: [],
      },
    }
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

  const queryString = query.toString() ? `?${query.toString()}` : "";

  let primaryRes: PharmacistPerformanceReportResponse | null = null;
  try {
    primaryRes = await withPharmacySessionRetry((accessToken) =>
      getJson<PharmacistPerformanceReportResponse>(`/api/pharmacy/report/pharmacist-performance${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );
  } catch {
    primaryRes = null;
  }

  if (primaryRes && (primaryRes.data || (primaryRes as any).status === 200 || (primaryRes as any).pharmacists)) {
    return primaryRes;
  }

  // Fallback: build from dispensed requests
  const dispensedRequests = await fetchDispensedRequestsFallback(params);
  if (dispensedRequests.length > 0) {
    const staffMap = new Map<string, PharmacistPerformanceItem>();

    for (const req of dispensedRequests) {
      const pName = req.pharmacist_name || "Duty Pharmacist";
      const pId = req.pharmacist_id || pName;
      const payType = (req.payment_type || req.payment_method || "cash").toLowerCase();
      const reqAmount = Number(req.total_amount || 0);
      const reqQty = (req.items || []).reduce((acc: number, it: any) => acc + Number(it.quantity || 0), 0);

      if (staffMap.has(pId)) {
        const p = staffMap.get(pId)!;
        p.requests_count += 1;
        p.total_quantity_dispensed += reqQty;
        p.total_amount += reqAmount;
        if (payType === "cash") p.cash_amount += reqAmount;
        else if (payType === "pos") p.pos_amount += reqAmount;
        else if (payType === "transfer") p.transfer_amount += reqAmount;
      } else {
        staffMap.set(pId, {
          pharmacist_id: pId,
          pharmacist_name: pName,
          requests_count: 1,
          total_quantity_dispensed: reqQty,
          total_amount: reqAmount,
          cash_amount: payType === "cash" ? reqAmount : 0,
          pos_amount: payType === "pos" ? reqAmount : 0,
          transfer_amount: payType === "transfer" ? reqAmount : 0,
        });
      }
    }

    const pharmacists = Array.from(staffMap.values());
    const total_requests_processed = pharmacists.reduce((acc, p) => acc + p.requests_count, 0);
    const total_quantity_dispensed = pharmacists.reduce((acc, p) => acc + p.total_quantity_dispensed, 0);
    const total_revenue = pharmacists.reduce((acc, p) => acc + p.total_amount, 0);

    return {
      status: 200,
      message: "Pharmacist performance report retrieved successfully",
      data: {
        hospital_name: "Hospital Pharmacy",
        pharmacy_unit_name: "Main Dispensary",
        filters: {
          start_date: params?.start_date,
          end_date: params?.end_date,
        },
        summary: {
          total_pharmacists: pharmacists.length,
          total_requests_processed,
          total_quantity_dispensed,
          total_revenue,
        },
        pagination: {
          total_items: pharmacists.length,
          page: params?.page || 1,
          limit: params?.limit || 20,
          total_pages: Math.ceil(pharmacists.length / (params?.limit || 20)) || 1,
        },
        pharmacists,
      },
    };
  }

  return (
    primaryRes || {
      status: 200,
      message: "No staff performance data found",
      data: {
        summary: { total_pharmacists: 0, total_requests_processed: 0, total_quantity_dispensed: 0, total_revenue: 0 },
        pagination: { total_items: 0, page: 1, limit: 20, total_pages: 1 },
        pharmacists: [],
      },
    }
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

function escapeCsvField(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function generateClientReportCsv(
  tabKey: string,
  reportData: any
): string {
  const unwrapped = (reportData as any)?.data ?? reportData ?? {};

  if (tabKey === "drug-report") {
    const rawList: DrugSalesReportItem[] =
      unwrapped?.drugs ?? unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const headers = [
      "Drug Name",
      "Generic Name",
      "Category",
      "Current Stock",
      "Unit Price (NGN)",
      "Quantity Sold",
      "Total Sales (NGN)",
      "Average Price (NGN)",
    ];
    const rows = rawList.map((d) => [
      escapeCsvField(d.drug_name),
      escapeCsvField(d.generic_name || ""),
      escapeCsvField(d.category_name || "General"),
      escapeCsvField(d.current_stock || 0),
      escapeCsvField(d.current_unit_price || 0),
      escapeCsvField(d.quantity_sold || 0),
      escapeCsvField(d.total_price || 0),
      escapeCsvField(d.average_price || 0),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  if (tabKey === "detailed-drug-report") {
    const rawList: DetailedDispenseRecord[] =
      unwrapped?.records ?? unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const headers = [
      "Dispensed Date",
      "Pharmacist",
      "Drug Name",
      "Generic Name",
      "Quantity",
      "Unit Price (NGN)",
      "Amount Paid (NGN)",
      "Patient Name",
      "Patient ID",
      "Phone Number",
      "Billing Code",
      "Receipt No",
      "Payment Method",
    ];
    const rows = rawList.map((r) => [
      escapeCsvField(r.dispensed_at ? new Date(r.dispensed_at).toLocaleString() : ""),
      escapeCsvField(r.pharmacist_name || "Duty Pharmacist"),
      escapeCsvField(r.drug_name),
      escapeCsvField(r.generic_name || ""),
      escapeCsvField(r.quantity || 1),
      escapeCsvField(r.unit_price || 0),
      escapeCsvField(r.amount_paid || 0),
      escapeCsvField(r.patient_name || "Walk-In"),
      escapeCsvField(r.patient_id || ""),
      escapeCsvField(r.phone_number || ""),
      escapeCsvField(r.billing_code || ""),
      escapeCsvField(r.receipt_no || ""),
      escapeCsvField((r.payment_method || "CASH").toUpperCase()),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  if (tabKey === "stock-inventory-report") {
    const rawList: StockInventoryItem[] =
      unwrapped?.items ?? unwrapped?.records ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const headers = [
      "Item Name",
      "Generic Name",
      "Category",
      "Batch Number",
      "Expiry Date",
      "Stock Units",
      "Reorder Level",
      "Unit Price (NGN)",
      "Stock Valuation (NGN)",
      "Stock Status",
    ];
    const rows = rawList.map((it) => [
      escapeCsvField(it.item_name),
      escapeCsvField(it.generic_name || ""),
      escapeCsvField(it.category_name || "General"),
      escapeCsvField(it.batch_number || "N/A"),
      escapeCsvField(it.expiry_date || "N/A"),
      escapeCsvField(it.stock || 0),
      escapeCsvField(it.reorder_level || 0),
      escapeCsvField(it.unit_price || 0),
      escapeCsvField(it.stock_valuation || (Number(it.stock || 0) * Number(it.unit_price || 0))),
      escapeCsvField(it.stock_status || "IN STOCK"),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  if (tabKey === "expiry-report") {
    const rawList: ExpiryReportItem[] =
      unwrapped?.items ?? unwrapped?.records ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const headers = [
      "Drug Name",
      "Generic Name",
      "Batch Number",
      "Expiry Date",
      "Days Remaining",
      "Stock Units",
      "Unit Price (NGN)",
      "Value at Risk (NGN)",
      "Risk Status",
    ];
    const rows = rawList.map((it) => [
      escapeCsvField(it.drug_name),
      escapeCsvField(it.generic_name || ""),
      escapeCsvField(it.batch_number || "N/A"),
      escapeCsvField(it.expiry_date || ""),
      escapeCsvField(it.days_remaining ?? 0),
      escapeCsvField(it.stock || 0),
      escapeCsvField(it.unit_price || 0),
      escapeCsvField(it.value_at_risk || (Number(it.stock || 0) * Number(it.unit_price || 0))),
      escapeCsvField(it.risk_status || "ALERT"),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  if (tabKey === "pharmacist-performance-report") {
    const rawList: PharmacistPerformanceItem[] =
      unwrapped?.pharmacists ?? unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const headers = [
      "Pharmacist Name",
      "Email",
      "Requests Processed",
      "Units Dispensed",
      "Cash Revenue (NGN)",
      "POS Revenue (NGN)",
      "Transfer Revenue (NGN)",
      "Total Revenue (NGN)",
    ];
    const rows = rawList.map((p) => [
      escapeCsvField(p.pharmacist_name || "Duty Pharmacist"),
      escapeCsvField(p.email || ""),
      escapeCsvField(p.requests_count || 0),
      escapeCsvField(p.total_quantity_dispensed || 0),
      escapeCsvField(p.cash_amount || 0),
      escapeCsvField(p.pos_amount || 0),
      escapeCsvField(p.transfer_amount || 0),
      escapeCsvField(p.total_amount || 0),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  if (tabKey === "returns-exchanges-report") {
    const rawList: ReturnsExchangesReportItem[] =
      unwrapped?.exchanges ?? unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const headers = [
      "Exchange Code",
      "Date",
      "Patient Name",
      "Patient ID",
      "Phone Number",
      "Returned Value (NGN)",
      "Replacement Cost (NGN)",
      "Net Amount (NGN)",
      "Status",
      "Pharmacist",
    ];
    const rows = rawList.map((ex) => [
      escapeCsvField(ex.exchange_code),
      escapeCsvField(ex.created_at ? new Date(ex.created_at).toLocaleString() : ""),
      escapeCsvField(ex.patient_name || "Patient"),
      escapeCsvField(ex.patient_id || ""),
      escapeCsvField(ex.phone_number || ""),
      escapeCsvField(ex.total_returned_amount || 0),
      escapeCsvField(ex.total_replacement_amount || 0),
      escapeCsvField(ex.net_amount || 0),
      escapeCsvField(ex.status || "COMPLETED"),
      escapeCsvField(ex.pharmacist_name || "Pharmacist"),
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  return "No records available";
}

export function generatePrintReportHtml(
  title: string,
  tabKey: string,
  reportData: any,
  filters: Record<string, any>
): string {
  const unwrapped = (reportData as any)?.data ?? reportData ?? {};
  const hospitalName = unwrapped?.hospital_name || "Hospital Management System";
  const unitName = unwrapped?.pharmacy_unit_name || "Pharmacy Department";
  const nowStr = new Date().toLocaleString();

  const filterSummaryList: string[] = [];
  if (filters.start_date && filters.end_date) {
    filterSummaryList.push(`<strong>Period:</strong> ${filters.start_date} to ${filters.end_date}`);
  }
  if (filters.search) {
    filterSummaryList.push(`<strong>Search:</strong> "${filters.search}"`);
  }
  if (filters.stock_status && filters.stock_status !== "all") {
    filterSummaryList.push(`<strong>Status:</strong> ${filters.stock_status.toUpperCase()}`);
  }
  if (filters.timeframe && filters.timeframe !== "all") {
    filterSummaryList.push(`<strong>Timeframe:</strong> ${filters.timeframe}`);
  }
  if (filters.status && filters.status !== "all") {
    filterSummaryList.push(`<strong>Status:</strong> ${filters.status.toUpperCase()}`);
  }

  let tableHeaderHtml = "";
  let tableRowsHtml = "";
  let summaryCardsHtml = "";

  if (tabKey === "drug-report") {
    const list: DrugSalesReportItem[] =
      unwrapped?.drugs ?? unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const sum = unwrapped?.summary || {};
    const totalQty = sum.total_quantity_sold ?? list.reduce((a, d) => a + Number(d.quantity_sold || 0), 0);
    const totalRev = sum.total_sales_amount ?? list.reduce((a, d) => a + Number(d.total_price || 0), 0);

    summaryCardsHtml = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Unique Drugs</div>
          <div class="summary-value">${list.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Units Sold</div>
          <div class="summary-value">${totalQty.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Sales Revenue</div>
          <div class="summary-value">NGN ${totalRev.toLocaleString()}</div>
        </div>
      </div>
    `;

    tableHeaderHtml = `
      <tr>
        <th style="width: 5%;">#</th>
        <th>Drug Name</th>
        <th>Generic Name</th>
        <th>Category</th>
        <th style="text-align: right;">Current Stock</th>
        <th style="text-align: right;">Unit Price (NGN)</th>
        <th style="text-align: right;">Qty Sold</th>
        <th style="text-align: right;">Total Revenue (NGN)</th>
      </tr>
    `;

    tableRowsHtml = list.length === 0
      ? `<tr><td colspan="8" style="text-align: center; color: #888; padding: 20px;">No drug sales records found for this period.</td></tr>`
      : list.map((d, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight: 600;">${d.drug_name}</td>
          <td>${d.generic_name || "—"}</td>
          <td>${d.category_name || "General"}</td>
          <td style="text-align: right;">${Number(d.current_stock || 0).toLocaleString()}</td>
          <td style="text-align: right;">${Number(d.current_unit_price || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 600;">${Number(d.quantity_sold || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: #047857;">${Number(d.total_price || 0).toLocaleString()}</td>
        </tr>
      `).join("");
  } else if (tabKey === "detailed-drug-report") {
    const list: DetailedDispenseRecord[] =
      unwrapped?.records ?? unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const sum = unwrapped?.summary || {};
    const totalRec = sum.total_dispense_records ?? list.length;
    const totalAmt = sum.total_amount ?? list.reduce((a, r) => a + Number(r.amount_paid || 0), 0);

    summaryCardsHtml = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Dispense Events</div>
          <div class="summary-value">${totalRec.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Amount Paid</div>
          <div class="summary-value">NGN ${totalAmt.toLocaleString()}</div>
        </div>
      </div>
    `;

    tableHeaderHtml = `
      <tr>
        <th style="width: 4%;">#</th>
        <th>Date / Time</th>
        <th>Pharmacist</th>
        <th>Medication</th>
        <th style="text-align: right;">Qty</th>
        <th style="text-align: right;">Amount (NGN)</th>
        <th>Patient Name</th>
        <th>Patient ID</th>
        <th>Billing Code</th>
        <th>Method</th>
      </tr>
    `;

    tableRowsHtml = list.length === 0
      ? `<tr><td colspan="10" style="text-align: center; color: #888; padding: 20px;">No detailed dispense records found.</td></tr>`
      : list.map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="white-space: nowrap;">${r.dispensed_at ? new Date(r.dispensed_at).toLocaleDateString() : "—"}</td>
          <td>${r.pharmacist_name || "Duty Pharmacist"}</td>
          <td style="font-weight: 600;">${r.drug_name}</td>
          <td style="text-align: right;">${Number(r.quantity || 1).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: #047857;">${Number(r.amount_paid || 0).toLocaleString()}</td>
          <td>${r.patient_name || "Walk-In"}</td>
          <td>${r.patient_id || "—"}</td>
          <td style="font-family: monospace;">${r.billing_code || "—"}</td>
          <td style="text-transform: uppercase; font-size: 11px;">${r.payment_method || "CASH"}</td>
        </tr>
      `).join("");
  } else if (tabKey === "stock-inventory-report") {
    const list: StockInventoryItem[] =
      unwrapped?.items ?? unwrapped?.records ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const sum = unwrapped?.summary || {};
    const totalVal = sum.total_inventory_valuation ?? list.reduce((a, it) => a + Number(it.stock_valuation || (Number(it.stock || 0) * Number(it.unit_price || 0))), 0);

    summaryCardsHtml = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Catalog Drug Lines</div>
          <div class="summary-value">${list.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Stock Valuation</div>
          <div class="summary-value">NGN ${totalVal.toLocaleString()}</div>
        </div>
      </div>
    `;

    tableHeaderHtml = `
      <tr>
        <th style="width: 5%;">#</th>
        <th>Item Name</th>
        <th>Generic Name</th>
        <th>Category</th>
        <th>Batch No</th>
        <th>Expiry Date</th>
        <th style="text-align: right;">Stock Units</th>
        <th style="text-align: right;">Unit Price (NGN)</th>
        <th style="text-align: right;">Stock Valuation (NGN)</th>
        <th>Status</th>
      </tr>
    `;

    tableRowsHtml = list.length === 0
      ? `<tr><td colspan="10" style="text-align: center; color: #888; padding: 20px;">No inventory items found.</td></tr>`
      : list.map((it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight: 600;">${it.item_name}</td>
          <td>${it.generic_name || "—"}</td>
          <td>${it.category_name || "General"}</td>
          <td>${it.batch_number || "—"}</td>
          <td>${it.expiry_date || "—"}</td>
          <td style="text-align: right; font-weight: 600;">${Number(it.stock || 0).toLocaleString()}</td>
          <td style="text-align: right;">${Number(it.unit_price || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700;">${Number(it.stock_valuation || (Number(it.stock || 0) * Number(it.unit_price || 0))).toLocaleString()}</td>
          <td style="font-weight: 600; font-size: 11px;">${it.stock_status || "IN STOCK"}</td>
        </tr>
      `).join("");
  } else if (tabKey === "expiry-report") {
    const list: ExpiryReportItem[] =
      unwrapped?.items ?? unwrapped?.records ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const sum = unwrapped?.summary || {};
    const totalRisk = sum.total_at_risk_valuation ?? list.reduce((a, it) => a + Number(it.value_at_risk || (Number(it.stock || 0) * Number(it.unit_price || 0))), 0);

    summaryCardsHtml = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">At-Risk Drug Batches</div>
          <div class="summary-value">${list.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Value at Risk</div>
          <div class="summary-value" style="color: #b91c1c;">NGN ${totalRisk.toLocaleString()}</div>
        </div>
      </div>
    `;

    tableHeaderHtml = `
      <tr>
        <th style="width: 5%;">#</th>
        <th>Drug Name</th>
        <th>Batch Number</th>
        <th>Expiry Date</th>
        <th style="text-align: right;">Days Remaining</th>
        <th style="text-align: right;">Stock Units</th>
        <th style="text-align: right;">Unit Price (NGN)</th>
        <th style="text-align: right;">Value at Risk (NGN)</th>
        <th>Risk Level</th>
      </tr>
    `;

    tableRowsHtml = list.length === 0
      ? `<tr><td colspan="9" style="text-align: center; color: #888; padding: 20px;">No expiring medications detected.</td></tr>`
      : list.map((it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight: 600;">${it.drug_name}</td>
          <td>${it.batch_number || "—"}</td>
          <td style="font-weight: 600; color: #b91c1c;">${it.expiry_date}</td>
          <td style="text-align: right; font-weight: 700;">${it.days_remaining} d</td>
          <td style="text-align: right;">${Number(it.stock || 0).toLocaleString()}</td>
          <td style="text-align: right;">${Number(it.unit_price || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: #b91c1c;">${Number(it.value_at_risk || (Number(it.stock || 0) * Number(it.unit_price || 0))).toLocaleString()}</td>
          <td style="font-weight: 600; font-size: 11px;">${it.risk_status || "ALERT"}</td>
        </tr>
      `).join("");
  } else if (tabKey === "pharmacist-performance-report") {
    const list: PharmacistPerformanceItem[] =
      unwrapped?.pharmacists ?? unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);
    const sum = unwrapped?.summary || {};
    const totalRev = sum.total_revenue ?? list.reduce((a, p) => a + Number(p.total_amount || 0), 0);

    summaryCardsHtml = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Pharmacists On Shift</div>
          <div class="summary-value">${list.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Shift Dispense Revenue</div>
          <div class="summary-value">NGN ${totalRev.toLocaleString()}</div>
        </div>
      </div>
    `;

    tableHeaderHtml = `
      <tr>
        <th style="width: 5%;">#</th>
        <th>Pharmacist Name</th>
        <th>Email</th>
        <th style="text-align: right;">Prescriptions</th>
        <th style="text-align: right;">Units Dispensed</th>
        <th style="text-align: right;">Cash (NGN)</th>
        <th style="text-align: right;">POS (NGN)</th>
        <th style="text-align: right;">Transfer (NGN)</th>
        <th style="text-align: right;">Total Sales (NGN)</th>
      </tr>
    `;

    tableRowsHtml = list.length === 0
      ? `<tr><td colspan="9" style="text-align: center; color: #888; padding: 20px;">No pharmacist shift activity recorded.</td></tr>`
      : list.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight: 600;">${p.pharmacist_name || "Duty Pharmacist"}</td>
          <td>${p.email || "—"}</td>
          <td style="text-align: right;">${Number(p.requests_count || 0).toLocaleString()}</td>
          <td style="text-align: right;">${Number(p.total_quantity_dispensed || 0).toLocaleString()}</td>
          <td style="text-align: right;">${Number(p.cash_amount || 0).toLocaleString()}</td>
          <td style="text-align: right;">${Number(p.pos_amount || 0).toLocaleString()}</td>
          <td style="text-align: right;">${Number(p.transfer_amount || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: #047857;">${Number(p.total_amount || 0).toLocaleString()}</td>
        </tr>
      `).join("");
  } else if (tabKey === "returns-exchanges-report") {
    const list: ReturnsExchangesReportItem[] =
      unwrapped?.exchanges ?? unwrapped?.items ?? (Array.isArray(unwrapped) ? unwrapped : []);

    tableHeaderHtml = `
      <tr>
        <th style="width: 5%;">#</th>
        <th>Code</th>
        <th>Date</th>
        <th>Patient Name</th>
        <th>Patient ID</th>
        <th style="text-align: right;">Returned (NGN)</th>
        <th style="text-align: right;">Replacement (NGN)</th>
        <th style="text-align: right;">Net Balance (NGN)</th>
        <th>Status</th>
      </tr>
    `;

    tableRowsHtml = list.length === 0
      ? `<tr><td colspan="9" style="text-align: center; color: #888; padding: 20px;">No returns or exchanges recorded.</td></tr>`
      : list.map((ex, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-family: monospace; font-weight: 700;">${ex.exchange_code}</td>
          <td>${ex.created_at ? new Date(ex.created_at).toLocaleDateString() : "—"}</td>
          <td style="font-weight: 600;">${ex.patient_name || "Patient"}</td>
          <td>${ex.patient_id || "—"}</td>
          <td style="text-align: right;">${Number(ex.total_returned_amount || 0).toLocaleString()}</td>
          <td style="text-align: right;">${Number(ex.total_replacement_amount || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700;">${Number(ex.net_amount || 0).toLocaleString()}</td>
          <td style="font-size: 11px; text-transform: uppercase; font-weight: 600;">${ex.status || "COMPLETED"}</td>
        </tr>
      `).join("");
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} - ${hospitalName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1e293b;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.4;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    .hospital-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .unit-subtitle {
      font-size: 13px;
      font-weight: 600;
      color: #0284c7;
      margin: 0 0 4px 0;
    }
    .report-name {
      font-size: 15px;
      font-weight: 700;
      color: #334155;
      margin: 6px 0 0 0;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .filters-bar {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 11px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .summary-card {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .summary-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
    }
    .summary-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #0f172a;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      font-size: 11px;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .footer-sign {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #475569;
      page-break-inside: avoid;
    }
    .sign-line {
      border-top: 1px dashed #94a3b8;
      width: 200px;
      padding-top: 4px;
      margin-top: 36px;
    }
    @media print {
      body {
        padding: 0;
      }
      th {
        background: #0f172a !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      tr {
        page-break-inside: avoid;
      }
      .filters-bar, .summary-card {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div>
      <h1 class="hospital-title">${hospitalName}</h1>
      <div class="unit-subtitle">${unitName}</div>
      <div class="report-name">${title}</div>
    </div>
    <div class="meta-box">
      <div><strong>Generated:</strong> ${nowStr}</div>
      <div><strong>Report Code:</strong> PHAR-REP-${Math.floor(100000 + Math.random() * 900000)}</div>
      <div><strong>Classification:</strong> Confidential Audit Document</div>
    </div>
  </div>

  ${filterSummaryList.length > 0 ? `<div class="filters-bar">${filterSummaryList.join(" | ")}</div>` : ""}
  ${summaryCardsHtml}

  <table>
    <thead>
      ${tableHeaderHtml}
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <div class="footer-sign">
    <div>
      <div>Generated By: Pharmacy Officer</div>
      <div class="sign-line">Duty Pharmacist Signature</div>
    </div>
    <div>
      <div>Verified By: Internal Audit / HOD</div>
      <div class="sign-line">Supervising Pharmacist Signature</div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Opens backend-rendered printable HTML report or renders clean client fallback
 */
export async function openPharmacyReportPrint(
  endpoint: string,
  filters: Record<string, any>,
  reportTitle: string = "Pharmacy Report",
  reportData?: any,
  tabKey?: string
) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(
      "<html><head><title>Loading Print Preview...</title></head><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;'><p style='color:#666;font-size:15px;'>Preparing printable report, please wait...</p></body></html>"
    );
  }

  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "" && val !== "all") {
      query.set(key, String(val));
    }
  });
  query.set("print", "true");

  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : "";

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}?${query.toString()}`, {
      method: "GET",
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
      },
    });

    const contentType = response.headers.get("content-type") || "";

    if (response.ok && contentType.includes("text/html")) {
      const html = await response.text();
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
      return;
    }
  } catch (err) {
    console.warn("Backend print HTML fetch failed, using client generator:", err);
  }

  // Client-side fallback report generator
  if (printWindow && reportData && tabKey) {
    const html = generatePrintReportHtml(reportTitle, tabKey, reportData, filters);
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  } else if (printWindow) {
    printWindow.document.open();
    printWindow.document.write("<p style='padding:20px;color:red;'>Unable to generate printable report.</p>");
    printWindow.document.close();
  }
}

/**
 * Downloads full dataset CSV export from backend with client-side fallback
 */
export async function downloadPharmacyReportCsv(
  endpoint: string,
  filters: Record<string, any>,
  fileNamePrefix: string = "pharmacy_report",
  reportData?: any,
  tabKey?: string
) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "" && val !== "all") {
      query.set(key, String(val));
    }
  });
  query.set("export", "csv");

  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : "";

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}?${query.toString()}`, {
      method: "GET",
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
      },
    });

    const contentType = response.headers.get("content-type") || "";

    if (response.ok && (contentType.includes("text/csv") || contentType.includes("application/octet-stream"))) {
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
      return;
    }
  } catch (err) {
    console.warn("Backend CSV export failed, falling back to client CSV:", err);
  }

  // Client-side CSV generator fallback
  if (reportData && tabKey) {
    const csvContent = generateClientReportCsv(tabKey, reportData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `${fileNamePrefix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } else {
    throw new Error("Unable to export CSV: no report records available.");
  }
}
