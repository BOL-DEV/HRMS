"use client";

export type ReturnReason =
  | "ADVERSE_REACTION"
  | "PHYSICIAN_CHANGE"
  | "DUPLICATE_PURCHASE"
  | "DISCHARGED_EARLY"
  | "DAMAGED_PACKAGING"
  | "PATIENT_DECEASED"
  | "OTHER";

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  ADVERSE_REACTION: "Adverse Drug Reaction / Allergy",
  PHYSICIAN_CHANGE: "Physician Changed Medication / Dosage",
  DUPLICATE_PURCHASE: "Duplicate Purchase / Wrong Drug Dispensed",
  DISCHARGED_EARLY: "Patient Discharged Early / Treatment Completed",
  DAMAGED_PACKAGING: "Damaged / Defective Packaging",
  PATIENT_DECEASED: "Patient Deceased",
  OTHER: "Other Clinical / Personal Reason",
};

export type DrugCondition = "INTACT_RESELLABLE" | "OPENED_DAMAGED" | "EXPIRED";

export const DRUG_CONDITION_LABELS: Record<
  DrugCondition,
  { label: string; desc: string; restock: boolean; badgeColor: string }
> = {
  INTACT_RESELLABLE: {
    label: "Intact / Sealed / Resellable",
    desc: "Unopened packaging. Restock back to dispensary inventory.",
    restock: true,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  OPENED_DAMAGED: {
    label: "Opened / Damaged / Compromised",
    desc: "Safety seal broken. Quarantine for disposal, do NOT restock.",
    restock: false,
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  },
  EXPIRED: {
    label: "Expired / Degraded",
    desc: "Expired formulation. Log for destruction audit, do NOT restock.",
    restock: false,
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  },
};

export type ExchangeSettlementStatus =
  | "ADDITIONAL_PAID"
  | "REFUND_ISSUED"
  | "EVEN_EXCHANGE"
  | "PENDING_CASHIER";

export const SETTLEMENT_STATUS_LABELS: Record<
  ExchangeSettlementStatus,
  { label: string; badgeClass: string }
> = {
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
  | "NONE";

export interface ExchangeReturnedItem {
  returned_drug_id: string;
  returned_drug_name: string;
  returned_unit_price: number;
  returned_quantity: number;
  return_subtotal: number;
  return_reason: ReturnReason;
  reason_notes?: string;
  drug_condition: DrugCondition;
  restock_to_inventory: boolean;
}

export interface ExchangeReplacementItem {
  replacement_drug_id: string;
  replacement_drug_name: string;
  replacement_unit_price: number;
  replacement_quantity: number;
  replacement_subtotal: number;
  batch_number?: string;
  expiry_date?: string;
}

export interface DrugExchangeRecord {
  id: string;
  exchange_code: string;
  original_billing_code?: string;
  patient_id?: string;
  patient_name: string;
  phone_number: string;
  hospital_number?: string;
  returned_items: ExchangeReturnedItem[];
  replacement_items: ExchangeReplacementItem[];
  total_returned_value: number;
  total_replacement_cost: number;
  balance_difference: number; // >0: additional due, <0: refund due, 0: even
  settlement_status: ExchangeSettlementStatus;
  payment_method?: PaymentMethod;
  cashier_bill_code?: string;
  pharmacist_name: string;
  pharmacist_id?: string;
  pharmacy_unit_name: string;
  remarks?: string;
  created_at: string;
}

const STORAGE_KEY = "swiftrev.pharmacy.exchanges";

const INITIAL_DEMO_EXCHANGES: DrugExchangeRecord[] = [];

export function getStoredExchanges(): DrugExchangeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out old demo seed IDs if present
    const cleaned = parsed.filter(
      (r: DrugExchangeRecord) => !["exc-001", "exc-002", "exc-003"].includes(r.id)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveStoredExchanges(records: DrugExchangeRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error("Failed to save exchanges in storage", err);
  }
}

export function generateExchangeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EXC-${random}`;
}

export interface CreateDrugExchangePayload {
  original_billing_code?: string;
  patient_id?: string;
  patient_name: string;
  phone_number: string;
  hospital_number?: string;
  returned_items: ExchangeReturnedItem[];
  replacement_items: ExchangeReplacementItem[];
  settlement_status?: ExchangeSettlementStatus;
  payment_method?: PaymentMethod;
  remarks?: string;
  pharmacist_name?: string;
  pharmacy_unit_name?: string;
}

// API Wrapper Functions (Mock with Async Contract ready for backend URL swap)
export async function getDrugExchangesList(params?: {
  search?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}): Promise<{
  status: number;
  message: string;
  data: {
    total_items: number;
    items: DrugExchangeRecord[];
    summary: {
      total_exchanges: number;
      total_returned_value: number;
      total_replacement_cost: number;
      net_additional_paid: number;
      net_refunds_issued: number;
    };
  };
}> {
  // Simulate network delay for snappy async feel
  await new Promise((resolve) => setTimeout(resolve, 150));

  let list = getStoredExchanges();

  if (params?.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    list = list.filter(
      (r) =>
        r.exchange_code.toLowerCase().includes(q) ||
        r.patient_name.toLowerCase().includes(q) ||
        (r.phone_number && r.phone_number.includes(q)) ||
        (r.patient_id && r.patient_id.toLowerCase().includes(q)) ||
        (r.original_billing_code && r.original_billing_code.toLowerCase().includes(q)) ||
        r.returned_items.some((it) => it.returned_drug_name.toLowerCase().includes(q)) ||
        r.replacement_items.some((it) => it.replacement_drug_name.toLowerCase().includes(q))
    );
  }

  if (params?.status && params.status !== "all") {
    list = list.filter((r) => r.settlement_status === params.status);
  }

  if (params?.start_date) {
    const start = new Date(params.start_date).getTime();
    list = list.filter((r) => new Date(r.created_at).getTime() >= start);
  }

  if (params?.end_date) {
    const end = new Date(params.end_date).getTime() + 24 * 3600 * 1000;
    list = list.filter((r) => new Date(r.created_at).getTime() <= end);
  }

  // Calculate Aggregates
  const total_exchanges = list.length;
  const total_returned_value = list.reduce((sum, r) => sum + r.total_returned_value, 0);
  const total_replacement_cost = list.reduce((sum, r) => sum + r.total_replacement_cost, 0);
  const net_additional_paid = list
    .filter((r) => r.balance_difference > 0)
    .reduce((sum, r) => sum + r.balance_difference, 0);
  const net_refunds_issued = list
    .filter((r) => r.balance_difference < 0)
    .reduce((sum, r) => sum + Math.abs(r.balance_difference), 0);

  return {
    status: 200,
    message: "Drug exchanges retrieved successfully",
    data: {
      total_items: list.length,
      items: list,
      summary: {
        total_exchanges,
        total_returned_value,
        total_replacement_cost,
        net_additional_paid,
        net_refunds_issued,
      },
    },
  };
}

export async function processDrugExchange(
  payload: CreateDrugExchangePayload
): Promise<{ status: number; message: string; data: DrugExchangeRecord }> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const total_returned_value = payload.returned_items.reduce(
    (sum, item) => sum + item.return_subtotal,
    0
  );
  const total_replacement_cost = payload.replacement_items.reduce(
    (sum, item) => sum + item.replacement_subtotal,
    0
  );
  const balance_difference = total_replacement_cost - total_returned_value;

  let settlement_status: ExchangeSettlementStatus = "EVEN_EXCHANGE";
  if (balance_difference > 0) {
    settlement_status = payload.settlement_status || "ADDITIONAL_PAID";
  } else if (balance_difference < 0) {
    settlement_status = "REFUND_ISSUED";
  }

  const newRecord: DrugExchangeRecord = {
    id: `exc-${Date.now()}`,
    exchange_code: generateExchangeCode(),
    original_billing_code: payload.original_billing_code || undefined,
    patient_id: payload.patient_id || undefined,
    patient_name: payload.patient_name,
    phone_number: payload.phone_number,
    hospital_number: payload.hospital_number || undefined,
    returned_items: payload.returned_items,
    replacement_items: payload.replacement_items,
    total_returned_value,
    total_replacement_cost,
    balance_difference,
    settlement_status,
    payment_method: payload.payment_method || (balance_difference > 0 ? "CASH" : "NONE"),
    cashier_bill_code: balance_difference > 0 ? `BILL-${Math.random().toString(36).substring(2, 7).toUpperCase()}` : undefined,
    pharmacist_name: payload.pharmacist_name || "Dispensing Pharmacist",
    pharmacy_unit_name: payload.pharmacy_unit_name || "Pharmacy Main",
    remarks: payload.remarks || undefined,
    created_at: new Date().toISOString(),
  };

  const existing = getStoredExchanges();
  saveStoredExchanges([newRecord, ...existing]);

  return {
    status: 201,
    message: `Exchange transaction ${newRecord.exchange_code} processed successfully`,
    data: newRecord,
  };
}

export type DrugExchangePayload = CreateDrugExchangePayload;
export const processDrugExchangeTransaction = processDrugExchange;
export const generateExchangeReference = generateExchangeCode;
