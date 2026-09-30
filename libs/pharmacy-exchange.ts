import { getJson, postJson } from "@/libs/api";
import { withPharmacySessionRetry } from "@/libs/pharmacy-api";

// --- Reason & Condition Constants ---

export type ReturnReason =
  | "ADVERSE_REACTION"
  | "PHYSICIAN_CHANGE"
  | "DUPLICATE_PURCHASE"
  | "DISCHARGED_EARLY"
  | "DAMAGED_PACKAGING"
  | "PATIENT_DECEASED"
  | "OTHER";

export const RETURN_REASON_LABELS: Record<string, string> = {
  ADVERSE_REACTION: "Adverse Drug Reaction / Allergy",
  PHYSICIAN_CHANGE: "Physician Changed Medication / Dosage",
  DUPLICATE_PURCHASE: "Duplicate Purchase / Wrong Drug Dispensed",
  DISCHARGED_EARLY: "Patient Discharged Early / Treatment Completed",
  DAMAGED_PACKAGING: "Damaged / Defective Packaging",
  PATIENT_DECEASED: "Patient Deceased",
  OTHER: "Other Clinical / Personal Reason",
  "Adverse drug reaction": "Adverse Drug Reaction / Allergy",
  "Physician changed": "Physician Changed Medication / Dosage",
  "Wrong prescription": "Wrong Prescription / Dispensed",
  "Damaged packaging": "Damaged / Defective Packaging",
  "Patient request": "Patient Request",
};

export type DrugCondition = "good" | "sealed" | "INTACT_RESELLABLE";

export const DRUG_CONDITION_LABELS: Record<
  string,
  { label: string; desc: string; restock: boolean; badgeColor: string }
> = {
  good: {
    label: "Good Condition",
    desc: "Clean, intact blister/strip. Restocked back to dispensary inventory.",
    restock: true,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  sealed: {
    label: "Good / Sealed",
    desc: "Unopened manufacturer package. Restocked back to dispensary inventory.",
    restock: true,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  INTACT_RESELLABLE: {
    label: "Intact / Resellable",
    desc: "Unopened packaging. Restocked back to dispensary inventory.",
    restock: true,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
};

export type ExchangeSettlementStatus =
  | "pending_payment"
  | "pending_refund"
  | "completed"
  | "cancelled"
  | "ADDITIONAL_PAID"
  | "REFUND_ISSUED"
  | "EVEN_EXCHANGE"
  | "PENDING_CASHIER";

export const SETTLEMENT_STATUS_LABELS: Record<
  string,
  { label: string; badgeClass: string }
> = {
  pending_payment: {
    label: "Pending Payment",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300",
  },
  pending_refund: {
    label: "Pending Refund",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300",
  },
  ADDITIONAL_PAID: {
    label: "Additional Paid",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  REFUND_ISSUED: {
    label: "Refund Issued",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300",
  },
  EVEN_EXCHANGE: {
    label: "Even Exchange (₦0)",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300",
  },
  PENDING_CASHIER: {
    label: "Pending Cashier",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

export type PaymentMethod =
  | "CASH"
  | "POS"
  | "TRANSFER"
  | "WALLET_CREDIT"
  | "DIRECT_REVERSAL"
  | "NONE"
  | "cash"
  | "pos"
  | "transfer";

// --- Data Models ---

export interface DrugExchangePatient {
  patient_id: string;
  patient_name: string;
  phone_number: string;
}

export interface PatientDispensedDrugItem {
  request_id: string;
  billing_code: string;
  created_at?: string;
  paid_at?: string;
  dispensed_at: string;
  patient_id: string;
  patient_name: string;
  phone_number: string;
  pharmacy_unit_id?: string;
  pharmacy_unit_name?: string;
  pharmacy_request_item_id: string;
  pharmacy_item_id: string;
  drug_name: string;
  generic_name?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity_dispensed: number;
  quantity_returned: number;
  available_to_return: number;
  unit_price: number;
  total_price: number;
  hours_since_payment?: number;
  is_within_24_hours?: boolean;
  is_eligible_for_exchange?: boolean;
  exchange_ineligible_reason?: string | null;
}

export interface ReturnedItemPayload {
  pharmacy_request_item_id?: string;
  pharmacy_item_id: string;
  quantity: number;
  reason: string;
  condition: string; // Strictly "good"
  unit_price?: number;
  restock_inventory?: boolean;
  drug_name?: string;
}

export interface ReplacementItemPayload {
  pharmacy_item_id: string;
  quantity: number;
  unit_price?: number;
  drug_name?: string;
}

export interface CreateDrugExchangePayload {
  patient_id: string;
  patient_name: string;
  phone_number?: string;
  remarks?: string;
  returned_items: ReturnedItemPayload[];
  replacement_items?: ReplacementItemPayload[];
  // Legacy / optional overrides
  original_billing_code?: string;
  hospital_number?: string;
  settlement_status?: ExchangeSettlementStatus;
  payment_method?: PaymentMethod;
  pharmacist_name?: string;
  pharmacy_unit_name?: string;
}

export interface DrugExchangeItem {
  id: string;
  item_type: "returned" | "replacement" | string;
  drug_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  reason?: string;
  condition?: string;
  is_restocked?: boolean;
}

export interface DrugExchangeRecord {
  id: string;
  exchange_code: string;
  patient_id: string;
  patient_name: string;
  phone_number?: string;
  hospital_number?: string;
  pharmacy_unit_id?: string;
  pharmacy_unit_name?: string;
  pharmacist_id?: string;
  pharmacist_name?: string;
  total_returned_amount: number;
  total_replacement_amount: number;
  net_amount: number;
  additional_amount_paid?: number;
  refund_amount?: number;
  refund_balance?: number;
  refund_approved_by?: string | null;
  refund_approved_by_name?: string | null;
  refund_approved_at?: string | null;
  refund_approval_remarks?: string | null;
  status: ExchangeSettlementStatus | string;
  remarks?: string;
  created_at: string;
  items?: DrugExchangeItem[];
  // Legacy / UI compatibility aliases
  original_billing_code?: string;
  returned_items?: any[];
  replacement_items?: any[];
  total_returned_value?: number;
  total_replacement_cost?: number;
  balance_difference?: number;
  settlement_status?: ExchangeSettlementStatus | string;
  payment_method?: PaymentMethod;
  cashier_bill_code?: string;
}

export interface DrugExchangeReportsResponse {
  summary: {
    total_exchanges: number;
    total_returned_value: number;
    total_replacement_value: number;
    total_additional_amount_due: number;
    total_refund_amount_due: number;
    completed_exchanges: number;
    pending_payment_exchanges: number;
    pending_refund_exchanges: number;
  };
  breakdown_by_condition?: Array<{
    condition: string;
    count: number;
    total_quantity: number;
    total_value: number;
    restocked_count: number;
  }>;
  top_return_reasons?: Array<{
    reason: string;
    count: number;
    total_quantity: number;
    total_value: number;
  }>;
  staff_activity?: Array<{
    pharmacist_id: string;
    pharmacist_name: string;
    total_exchanges_handled: number;
    total_returned_value: number;
    total_replacement_value: number;
  }>;
  daily_summary?: Array<any>;
}

export interface PharmacyStoreRefundsResponse {
  summary: {
    total_pending_refund_count: number;
    total_pending_refund_amount: number;
    total_approved_refund_count: number;
    total_approved_refund_amount: number;
  };
  total_items: number;
  page: number;
  limit: number;
  total_pages: number;
  refunds: DrugExchangeRecord[];
}

// Compatibility types for existing components
export type ExchangeReturnedItem = Partial<ReturnedItemPayload> & {
  pharmacy_request_item_id?: string;
  pharmacy_item_id?: string;
  returned_drug_id?: string;
  returned_drug_name?: string;
  returned_unit_price?: number;
  returned_quantity?: number;
  quantity?: number;
  unit_price?: number;
  reason?: string;
  condition?: string;
  return_subtotal?: number;
  return_reason?: ReturnReason | string;
  reason_notes?: string;
  drug_condition?: DrugCondition | string;
  restock_to_inventory?: boolean;
  restock_inventory?: boolean;
  available_to_return?: number;
};

export type ExchangeReplacementItem = Partial<ReplacementItemPayload> & {
  pharmacy_item_id?: string;
  replacement_drug_id?: string;
  replacement_drug_name?: string;
  replacement_unit_price?: number;
  replacement_quantity?: number;
  quantity?: number;
  unit_price?: number;
  replacement_subtotal?: number;
  batch_number?: string;
  expiry_date?: string;
};

export type DrugExchangePayload = CreateDrugExchangePayload;

// Helper to normalize backend DrugExchangeRecord for UI consumers
export function normalizeExchangeRecord(record: any): DrugExchangeRecord {
  if (!record || typeof record !== "object") {
    return {
      id: Math.random().toString(),
      exchange_code: "7NP7E8LZ",
      patient_id: "",
      patient_name: "Patient",
      phone_number: "",
      total_returned_amount: 0,
      total_returned_value: 0,
      total_replacement_amount: 0,
      total_replacement_cost: 0,
      net_amount: 0,
      balance_difference: 0,
      refund_amount: 0,
      refund_balance: 0,
      status: "completed",
      settlement_status: "completed",
      returned_items: [],
      replacement_items: [],
      created_at: new Date().toISOString(),
    };
  }

  let rawReturned: any[] = [];
  let rawReplacement: any[] = [];

  if (Array.isArray(record.returned_items) && record.returned_items.length > 0) {
    rawReturned = record.returned_items;
  }
  if (Array.isArray(record.replacement_items) && record.replacement_items.length > 0) {
    rawReplacement = record.replacement_items;
  }

  if (Array.isArray(record.items) && rawReturned.length === 0 && rawReplacement.length === 0) {
    for (const it of record.items) {
      if (!it || typeof it !== "object") continue;
      const itType = String(it.item_type || it.type || "").toLowerCase();
      if (itType.includes("return")) {
        rawReturned.push(it);
      } else if (itType.includes("replace")) {
        rawReplacement.push(it);
      } else {
        rawReturned.push(it);
      }
    }
  }

  const returnedItems: any[] = rawReturned
    .filter((it) => it && typeof it === "object")
    .map((it) => {
      const drugName = it.returned_drug_name || it.drug_name || it.item_name || it.name || "Returned Drug";
      const quantity = Number(it.returned_quantity ?? it.quantity ?? it.qty ?? 1);
      const unitPrice = Number(it.returned_unit_price ?? it.unit_price ?? it.unit_amount ?? it.price ?? 0);
      const subtotal = Number(it.return_subtotal ?? it.total_price ?? it.amount ?? (unitPrice * quantity));
      const reason = it.return_reason || it.reason || "Adverse drug reaction";
      const condition = it.drug_condition || it.condition || "good";
      const restock = it.restock_to_inventory ?? it.restock_inventory ?? it.is_restocked ?? true;

      return {
        ...it,
        pharmacy_item_id: it.pharmacy_item_id || it.drug_id || it.id,
        returned_drug_id: it.returned_drug_id || it.pharmacy_item_id || it.drug_id || it.id,
        drug_name: drugName,
        returned_drug_name: drugName,
        quantity: quantity,
        returned_quantity: quantity,
        unit_price: unitPrice,
        returned_unit_price: unitPrice,
        total_price: subtotal,
        return_subtotal: subtotal,
        reason: reason,
        return_reason: reason,
        condition: condition,
        drug_condition: condition,
        restock_to_inventory: restock,
        restock_inventory: restock,
      };
    });

  const replacementItems: any[] = rawReplacement
    .filter((it) => it && typeof it === "object")
    .map((it) => {
      const drugName = it.replacement_drug_name || it.drug_name || it.item_name || it.name || "Replacement Drug";
      const quantity = Number(it.replacement_quantity ?? it.quantity ?? it.qty ?? 1);
      const unitPrice = Number(it.replacement_unit_price ?? it.unit_price ?? it.unit_amount ?? it.price ?? 0);
      const subtotal = Number(it.replacement_subtotal ?? it.total_price ?? it.amount ?? (unitPrice * quantity));

      return {
        ...it,
        pharmacy_item_id: it.pharmacy_item_id || it.drug_id || it.id,
        replacement_drug_id: it.replacement_drug_id || it.pharmacy_item_id || it.drug_id || it.id,
        drug_name: drugName,
        replacement_drug_name: drugName,
        quantity: quantity,
        replacement_quantity: quantity,
        unit_price: unitPrice,
        replacement_unit_price: unitPrice,
        total_price: subtotal,
        replacement_subtotal: subtotal,
      };
    });

  const totalReturned =
    Number(record.total_returned_amount ?? record.total_returned_value) ||
    returnedItems.reduce((acc, it) => acc + (it.return_subtotal || (Number(it.returned_unit_price || 0) * Number(it.returned_quantity || 0))), 0);

  const totalReplacement =
    Number(record.total_replacement_amount ?? record.total_replacement_cost) ||
    replacementItems.reduce((acc, it) => acc + (it.replacement_subtotal || (Number(it.replacement_unit_price || 0) * Number(it.replacement_quantity || 0))), 0);

  const netAmount = Number(record.net_amount ?? record.balance_difference ?? (totalReplacement - totalReturned));

  const statusRaw = String(record.status || record.settlement_status || "").toLowerCase();
  const settlementStatus = statusRaw || (netAmount === 0 ? "completed" : netAmount > 0 ? "pending_payment" : "pending_refund");

  const refundAmt = Number(record.refund_amount ?? (netAmount < 0 ? Math.abs(netAmount) : 0));
  const refundBal = Number(record.refund_balance ?? (settlementStatus === "pending_refund" ? (netAmount < 0 ? Math.abs(netAmount) : 0) : 0));

  return {
    ...record,
    id: record.id || record._id || record.exchange_code || Math.random().toString(),
    exchange_code: record.exchange_code || record.reference_code || record.code || "7NP7E8LZ",
    patient_id: record.patient_id || "",
    patient_name: record.patient_name || record.patient?.name || "Patient",
    phone_number: record.phone_number || record.patient?.phone || "",
    pharmacy_unit_id: record.pharmacy_unit_id || "",
    pharmacy_unit_name: record.pharmacy_unit_name || "",
    pharmacist_id: record.pharmacist_id || "",
    pharmacist_name: record.pharmacist_name || "",
    total_returned_amount: totalReturned,
    total_returned_value: totalReturned,
    total_replacement_amount: totalReplacement,
    total_replacement_cost: totalReplacement,
    net_amount: netAmount,
    balance_difference: netAmount,
    refund_amount: refundAmt,
    refund_balance: refundBal,
    refund_approved_by: record.refund_approved_by || null,
    refund_approved_by_name: record.refund_approved_by_name || null,
    refund_approved_at: record.refund_approved_at || null,
    refund_approval_remarks: record.refund_approval_remarks || record.remarks || null,
    status: settlementStatus,
    settlement_status: settlementStatus,
    returned_items: returnedItems,
    replacement_items: replacementItems,
    created_at: record.created_at || record.createdAt || new Date().toISOString(),
  };
}

export function generateExchangeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return random;
}

export const generateExchangeReference = generateExchangeCode;

// --- Live Backend API Client Functions ---

/**
 * 1. Search Patients for Return
 * GET /api/pharmacy/drug-exchange/patients?search={query}&limit={limit}
 */
export async function searchDrugExchangePatients(
  search: string,
  limit: number = 10
): Promise<{ status: string | number; message?: string; data: DrugExchangePatient[] }> {
  if (!search.trim()) return { status: "success", data: [] };
  return withPharmacySessionRetry(async (accessToken) => {
    try {
      const res = await getJson<any>(
        `/api/pharmacy/drug-exchange/patients?search=${encodeURIComponent(search.trim())}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.patients)
        ? res.data.patients
        : Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res)
        ? res
        : [];

      return {
        status: res?.status ?? "success",
        message: res?.message,
        data: rawList.map((p: any) => ({
          patient_id: p.patient_id || p.id || p.hospital_number || "",
          patient_name: p.patient_name || p.name || p.full_name || p.display_value || "",
          phone_number: p.phone_number || p.phone || "",
        })),
      };
    } catch (err) {
      return { status: "error", message: err instanceof Error ? err.message : "Search failed", data: [] };
    }
  });
}

/**
 * 2. Get Patient's Previously Dispensed Drugs (With 24-Hour Eligibility Status)
 * GET /api/pharmacy/drug-exchange/dispensed-drugs?patient_id={patientId}
 */
export async function getPatientDispensedDrugs(
  patientId?: string,
  billingCode?: string,
  eligibleOnly?: boolean
): Promise<{
  status: string | number;
  message?: string;
  data: { total_items: number; items: PatientDispensedDrugItem[] };
}> {
  const query = new URLSearchParams();
  if (patientId?.trim()) query.set("patient_id", patientId.trim());
  if (billingCode?.trim()) query.set("billing_code", billingCode.trim());
  if (eligibleOnly) query.set("eligible_only", "true");

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry(async (accessToken) => {
    try {
      const res = await getJson<any>(
        `/api/pharmacy/drug-exchange/dispensed-drugs${queryString}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const rawData = res?.data ?? res;
      const rawItems = Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(rawData)
        ? rawData
        : [];

      return {
        status: res?.status ?? "success",
        message: res?.message,
        data: {
          total_items: rawData?.total_items ?? rawItems.length,
          items: rawItems.map((item: any) => {
            const available = Number(
              item.available_to_return ??
                (Number(item.quantity_dispensed ?? item.quantity ?? 1) - Number(item.quantity_returned ?? 0))
            );
            const isWithin24 = item.is_within_24_hours !== undefined ? Boolean(item.is_within_24_hours) : true;
            const isEligible = item.is_eligible_for_exchange !== undefined
              ? Boolean(item.is_eligible_for_exchange)
              : (available > 0 && isWithin24);

            return {
              request_id: item.request_id || item.pharmacy_request_id || item.id,
              billing_code: item.billing_code || item.receipt_no || item.invoice_no || "",
              created_at: item.created_at || undefined,
              paid_at: item.paid_at || undefined,
              dispensed_at: item.dispensed_at || item.created_at || new Date().toISOString(),
              patient_id: item.patient_id || patientId || "",
              patient_name: item.patient_name || "",
              phone_number: item.phone_number || "",
              pharmacy_unit_id: item.pharmacy_unit_id || "",
              pharmacy_unit_name: item.pharmacy_unit_name || "",
              pharmacy_request_item_id:
                item.pharmacy_request_item_id ||
                item.request_item_id ||
                item.prescription_item_id ||
                item.pharmacy_request_item ||
                item.id ||
                item.pharmacy_item_id ||
                item.item_id ||
                item.drug_id ||
                "",
              pharmacy_item_id: item.pharmacy_item_id || item.item_id || item.drug_id || item.id || "",
              drug_name: item.drug_name || item.item_name || item.name || "Medication",
              generic_name: item.generic_name || "",
              batch_number: item.batch_number || item.batch || "N/A",
              expiry_date: item.expiry_date || item.expiry || "",
              quantity_dispensed: Number(item.quantity_dispensed ?? item.quantity ?? 1),
              quantity_returned: Number(item.quantity_returned ?? 0),
              available_to_return: available,
              unit_price: Number(item.unit_price ?? item.unit_amount ?? item.price ?? 0),
              total_price: Number(
                item.total_price ??
                  item.amount ??
                  (Number(item.unit_price ?? 0) * Number(item.quantity_dispensed ?? item.quantity ?? 1))
              ),
              hours_since_payment: item.hours_since_payment != null ? Number(item.hours_since_payment) : undefined,
              is_within_24_hours: isWithin24,
              is_eligible_for_exchange: isEligible,
              exchange_ineligible_reason: item.exchange_ineligible_reason || (
                !isWithin24 ? "Prescription was paid more than 24 hours ago. Exchanges are only allowed within 24 hours of payment." : available <= 0 ? "Medication has already been fully returned." : null
              ),
            };
          }),
        },
      };
    } catch {
      return {
        status: "error",
        data: { total_items: 0, items: [] },
      };
    }
  });
}

/**
 * 3. Submit Drug Return & Exchange
 * POST /api/pharmacy/drug-exchange
 */
export async function submitDrugExchange(
  payload: CreateDrugExchangePayload
): Promise<{ status: string; message: string; data: DrugExchangeRecord }> {
  const formattedPayload = {
    patient_id: payload.patient_id,
    patient_name: payload.patient_name,
    phone_number: payload.phone_number || undefined,
    remarks: payload.remarks || undefined,
    returned_items: payload.returned_items.map((it) => {
      const requestItemId =
        it.pharmacy_request_item_id ||
        (it as any).request_item_id ||
        (it as any).prescription_item_id ||
        (it as any).id;
      return {
        pharmacy_request_item_id: requestItemId,
        pharmacy_item_id: it.pharmacy_item_id,
        quantity: Number(it.quantity),
        reason: it.reason || "Patient returned drug",
        condition: "good", // Strictly "good" per backend validation
        unit_price: it.unit_price != null ? Number(it.unit_price) : undefined,
        restock_inventory: true,
      };
    }),
    replacement_items: (payload.replacement_items || []).map((it) => ({
      pharmacy_item_id: it.pharmacy_item_id,
      quantity: Number(it.quantity),
      unit_price: it.unit_price != null ? Number(it.unit_price) : undefined,
    })),
  };

  return withPharmacySessionRetry(async (accessToken) => {
    const res = await postJson<{ status: string; message: string; data: any }>(
      "/api/pharmacy/drug-exchange",
      formattedPayload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return {
      ...res,
      data: normalizeExchangeRecord(res.data),
    };
  });
}

// Aliases for compatibility
export const processDrugExchange = submitDrugExchange;
export const processDrugExchangeTransaction = submitDrugExchange;

/**
 * 4. List Drug Exchange Transactions (Paginated Audit Ledger)
 * GET /api/pharmacy/drug-exchange
 */
export async function getDrugExchangesList(params?: {
  status?: string;
  patient_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  status: string | number;
  message?: string;
  data: {
    total_items: number;
    page?: number;
    limit?: number;
    total_pages?: number;
    items: DrugExchangeRecord[];
    summary?: {
      total_exchanges: number;
      total_returned_value: number;
      total_replacement_cost: number;
      net_additional_paid: number;
      net_refunds_issued: number;
    };
  };
}> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.patient_id) query.set("patient_id", params.patient_id);
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry(async (accessToken) => {
    try {
      const res = await getJson<any>(`/api/pharmacy/drug-exchange${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const rawData = res?.data ?? res;
      let rawItems: any[] = [];
      if (Array.isArray(rawData)) {
        rawItems = rawData;
      } else if (Array.isArray(rawData?.items)) {
        rawItems = rawData.items;
      } else if (Array.isArray(rawData?.exchanges)) {
        rawItems = rawData.exchanges;
      } else if (Array.isArray(rawData?.records)) {
        rawItems = rawData.records;
      } else if (Array.isArray(rawData?.data)) {
        rawItems = rawData.data;
      } else if (Array.isArray(res?.items)) {
        rawItems = res.items;
      } else if (Array.isArray(res)) {
        rawItems = res;
      }

      const normalizedItems = rawItems.map(normalizeExchangeRecord);

      const totalExchanges = rawData?.total_items ?? rawData?.total ?? normalizedItems.length;
      const totalReturned = normalizedItems.reduce(
        (sum, r) => sum + (r.total_returned_amount || r.total_returned_value || 0),
        0
      );
      const totalReplacement = normalizedItems.reduce(
        (sum, r) => sum + (r.total_replacement_amount || r.total_replacement_cost || 0),
        0
      );
      const netAdditional = normalizedItems
        .filter((r) => (r.net_amount || 0) > 0)
        .reduce((sum, r) => sum + (r.net_amount || 0), 0);
      const netRefunds = normalizedItems
        .filter((r) => (r.net_amount || 0) < 0)
        .reduce((sum, r) => sum + Math.abs(r.net_amount || 0), 0);

      return {
        status: res?.status ?? "success",
        message: res?.message,
        data: {
          total_items: totalExchanges,
          page: rawData?.page || 1,
          limit: rawData?.limit || 20,
          total_pages: rawData?.total_pages || 1,
          items: normalizedItems,
          summary: rawData?.summary || {
            total_exchanges: totalExchanges,
            total_returned_value: totalReturned,
            total_replacement_cost: totalReplacement,
            net_additional_paid: netAdditional,
            net_refunds_issued: netRefunds,
          },
        },
      };
    } catch (err) {
      console.error("[getDrugExchangesList] error:", err);
      return {
        status: "error",
        data: {
          total_items: 0,
          page: 1,
          limit: 20,
          total_pages: 1,
          items: [],
        },
      };
    }
  });
}

/**
 * 5. Get Exchange Details by ID or Code
 * GET /api/pharmacy/drug-exchange/:idOrCode
 */
export async function getDrugExchangeByIdOrCode(
  idOrCode: string
): Promise<{ status: string; data: DrugExchangeRecord }> {
  return withPharmacySessionRetry(async (accessToken) => {
    const res = await getJson<{ status: string; data: any }>(
      `/api/pharmacy/drug-exchange/${encodeURIComponent(idOrCode)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return {
      ...res,
      data: normalizeExchangeRecord(res.data),
    };
  });
}

/**
 * 6. Drug Return & Exchange Reports (Analytics & KPIs)
 * GET /api/pharmacy/drug-exchange/reports?start_date={start}&end_date={end}
 */
export async function getDrugExchangeReports(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{ status: string; message?: string; data: DrugExchangeReportsResponse }> {
  const query = new URLSearchParams();
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry((accessToken) =>
    getJson<{ status: string; message?: string; data: DrugExchangeReportsResponse }>(
      `/api/pharmacy/drug-exchange/reports${queryString}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
  );
}

/**
 * 7. Retrieve Pharmacy Store Awaiting & Processed Refunds
 * GET /api/pharmacy-store/refunds?status={status}&page={page}&limit={limit}
 * Role: PHARMACY_STORE with module "approve-refund"
 */
export async function getPharmacyStoreRefunds(params?: {
  status?: string; // "pending" | "approved" | "all"
  pharmacy_unit_id?: string;
  pharmacist_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  status: string | number;
  message?: string;
  data: PharmacyStoreRefundsResponse;
}> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.pharmacy_unit_id) query.set("pharmacy_unit_id", params.pharmacy_unit_id);
  if (params?.pharmacist_id) query.set("pharmacist_id", params.pharmacist_id);
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString() ? `?${query.toString()}` : "";

  return withPharmacySessionRetry(async (accessToken) => {
    try {
      const res = await getJson<any>(`/api/pharmacy-store/refunds${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const rawData = res?.data ?? res;
      let rawRefunds: any[] = [];
      if (Array.isArray(rawData?.refunds)) {
        rawRefunds = rawData.refunds;
      } else if (Array.isArray(rawData?.items)) {
        rawRefunds = rawData.items;
      } else if (Array.isArray(rawData)) {
        rawRefunds = rawData;
      }

      const normalizedRefunds = rawRefunds.map(normalizeExchangeRecord);

      return {
        status: res?.status ?? "success",
        message: res?.message,
        data: {
          summary: rawData?.summary || {
            total_pending_refund_count: normalizedRefunds.filter((r) => (r.refund_balance || 0) > 0).length,
            total_pending_refund_amount: normalizedRefunds
              .filter((r) => (r.refund_balance || 0) > 0)
              .reduce((sum, r) => sum + (r.refund_balance || 0), 0),
            total_approved_refund_count: normalizedRefunds.filter((r) => r.refund_approved_at || (r.refund_balance === 0 && r.refund_amount)).length,
            total_approved_refund_amount: normalizedRefunds
              .filter((r) => r.refund_approved_at || (r.refund_balance === 0 && r.refund_amount))
              .reduce((sum, r) => sum + (r.refund_amount || 0), 0),
          },
          total_items: rawData?.total_items ?? normalizedRefunds.length,
          page: rawData?.page || 1,
          limit: rawData?.limit || 20,
          total_pages: rawData?.total_pages || 1,
          refunds: normalizedRefunds,
        },
      };
    } catch (err) {
      console.error("[getPharmacyStoreRefunds] error:", err);
      return {
        status: "error",
        data: {
          summary: {
            total_pending_refund_count: 0,
            total_pending_refund_amount: 0,
            total_approved_refund_count: 0,
            total_approved_refund_amount: 0,
          },
          total_items: 0,
          page: 1,
          limit: 20,
          total_pages: 1,
          refunds: [],
        },
      };
    }
  });
}

/**
 * 8. Approve and Clear Offline Refund
 * POST /api/pharmacy-store/refunds/approve
 * Role: PHARMACY_STORE with module "approve-refund"
 */
export async function approvePharmacyStoreRefund(payload: {
  exchange_code?: string;
  exchange_id?: string;
  remarks?: string;
}): Promise<{ status: string; message: string; data: any }> {
  return withPharmacySessionRetry(async (accessToken) => {
    return postJson<{ status: string; message: string; data: any }>(
      "/api/pharmacy-store/refunds/approve",
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  });
}

/**
 * 9. Cashier Pay Additional Balance for an Exchange
 * POST /api/payments/drug-exchange/process
 * Role: AGENT / Cashier with module "transactions"
 */
export async function processDrugExchangeCashierPayment(payload: {
  exchange_code: string;
  payment_type: "cash" | "pos" | "transfer" | string;
}): Promise<{ status: string; message: string; data: any }> {
  return withPharmacySessionRetry(async (accessToken) => {
    return postJson<{ status: string; message: string; data: any }>(
      "/api/payments/drug-exchange/process",
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  });
}
