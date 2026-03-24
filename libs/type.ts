export interface Transaction {
  id: string;
  patient: string;
  invoiceNo: string;
  revenueHead: string;
  amount: number;
  dateTime: string;
}

type PatientStatus = "Active" | "Inactive";

export interface PatientRow {
  id: string;
  name: string;
  patientId: string;
  phone: string;
  gender: "Male" | "Female";
  age: number;
  lastVisit: string;
  transactions: number;
  totalPaid: number;
  status: PatientStatus;
}

type ReceiptStatus = "Not Requested" | "Pending" | "Approved" | "Rejected";
type ReceiptPaymentMethod = "Cash" | "Transfer" | "POS" | "Insurance";

export interface ReceiptRow {
  id: string;
  receiptId?: string;
  invoiceNo: string;
  patientName: string;
  amount: number;
  paymentMethod: ReceiptPaymentMethod;
  status: ReceiptStatus;
  requestedAt?: string;
  issuedAt?: string;
  lastRequestReason?: string;
}

type PaymentMethod = "Cash" | "Transfer" | "POS";

export interface TransactionRow {
  id: string;
  patient: string;
  phone: string;
  invoiceNo: string;
  revenueHead: string;
  despcription?: string;
  amount: number;
  payment: PaymentMethod;
  dateTime: string;
}

interface PaymentSlice {
  name: string;
  value: number;
  color: string;
}

export interface paymentMethodProps {
  title?: string;
  subtitle?: string;
  data?: PaymentSlice[];
}

export interface RefundRequest {
  id: string;
  patient: string;
  agent: string;
  reason: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
}

export type AgentStatus = "Active" | "Inactive" | "Suspended";

export interface AgentRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  transactions: number;
  revenue: number;
  pending: number;
  refunds: number;
  lastActive: string;
  status: AgentStatus;
}

export type SortOption = "newest" | "oldest" | "revenue";

export interface AgentProfile {
  rows: AgentRow[];
  onViewProfile?: (row: AgentRow) => void;
  onRequestSuspension?: (row: AgentRow) => void;
}

export type AgentPaymentType = "cash" | "transfer" | "pos";

export interface NewTransactionForm {
  patientName: string;
  phoneNumber: string;
  departmentId: string;
  departmentName: string;
  billDescription: string;
  amount: string;
  paymentType: AgentPaymentType;
}

export type AgentTokens = {
  accessToken: string;
  refreshToken: string;
};

export type ApiErrorPayload = {
  message?: string;
  error?: string;
  success?: boolean;
};

export type ApiRequestOptions = {
  headers?: HeadersInit;
};

export type AgentLoginPayload = {
  email: string;
  password: string;
};

export type AgentLoginResponse = {
  status: number;
  message: string;
  data?: AgentTokens;
};

export type AgentDashboardPeriod = "today" | "yesterday" | "current_week";

export type AgentDashboardStats = {
  agent_id: string;
  balance: number;
  last_wallet_topup: number;
  revenue_made: number;
  transaction_count: number;
  time_period: AgentDashboardPeriod;
};

export type AgentRecentTransaction = {
  id: string;
  patient_name: string;
  phone_number: string;
  bill_description: string;
  department_name: string;
  amount: string | number;
  status: string;
  balance_before: string | number;
  balance_after: string | number;
  created_at: string;
};

export type AgentDashboardResponse = {
  status: number;
  message: string;
  data: {
    stats: AgentDashboardStats;
    recent_transactions: AgentRecentTransaction[];
  };
};

export type AgentDepartment = {
  id: string;
  hospital_id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AgentDepartmentsResponse = {
  status: number;
  message: string;
  data: AgentDepartment[];
};

export type AgentTransactionsTimePeriod =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days";

export type AgentTransactionsSummary = {
  time_period: AgentTransactionsTimePeriod;
  disbursed_amount: number;
  transaction_count: number;
};

export type AgentTransactionsPagination = {
  current_page: number;
  total_pages: number;
  total_transactions: number;
  has_next: boolean;
  has_previous: boolean;
  transactions_per_page: number;
};

export type AgentTransactionHistoryItem = {
  id: string;
  receipt_no: string;
  patient_name: string;
  phone_number: string;
  revenue_head: string;
  bill_description: string;
  amount: string | number;
  payment_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AgentTransactionsResponse = {
  status: number;
  message: string;
  data: {
    agent_id: string;
    balance: number;
    last_wallet_credit: number;
    summary: AgentTransactionsSummary;
    pagination: AgentTransactionsPagination;
    payment_type_filter: string;
    revenue_head_filter: string;
    transactions: AgentTransactionHistoryItem[];
  };
};

export type ProcessPaymentPayload = {
  department_id: string;
  patient_name: string;
  phone_number: string;
  bill_description: string;
  amount: number;
  payment_type: AgentPaymentType;
};

export type ProcessPaymentResponse = {
  status: number;
  message: string;
  data: {
    transaction: {
      id: string;
      receipt_no: string;
      patient_name: string;
      phone_number: string;
      bill_description: string;
      amount: string | number;
      balance_before: string | number;
      balance_after: string | number;
      payment_type: string;
      status: string;
      created_at: string;
    };
    updated_balance: number;
    receipt: {
      receiptNo: string;
      receiptData: Record<string, unknown>;
      receiptHTML: string;
      printInstructions: string;
    };
  };
};

export type AgentReceiptSearchType =
  | "receipt_no"
  | "patient_name"
  | "patient_phone";

export type AgentReceiptReprintStatus =
  | "no_request"
  | "pending"
  | "approved"
  | "rejected";

export type AgentReceiptPrintFlag = "yes" | "no";

export type AgentReceiptItem = {
  id: string;
  receipt_no: string;
  patient_name: string;
  phone_number: string;
  revenue_head: string;
  bill_description: string;
  amount: number | string;
  payment_type: string;
  status: string;
  agent_name: string;
  date_time: string;
  reprint_status: AgentReceiptReprintStatus;
  reprint_request_id: string | null;
  reprint: AgentReceiptPrintFlag;
};

export type AgentReceiptsResponse = {
  status: number;
  message: string;
  data: {
    agent_id: string;
    balance: number;
    last_wallet_credit: number;
    search_filter: {
      search_type: AgentReceiptSearchType;
      search_value: string;
    };
    time_period: AgentTransactionsTimePeriod;
    pagination: {
      current_page: number;
      total_pages: number;
      total_receipts: number;
      has_next: boolean;
      has_previous: boolean;
      receipts_per_page: number;
    };
    receipts: AgentReceiptItem[];
  };
};

export type AgentReceiptReprintRequestPayload = {
  transaction_id: string;
  reason: string;
};

export type AgentReceiptReprintRequestResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    transaction_id: string;
    agent_id: string;
    hospital_id: string;
    status: string;
    requested_at: string;
    reason: string;
  };
};

export type AgentReceiptPrintPayload = {
  transaction_id: string;
};

export type AgentReceiptPrintResponse = {
  status: number;
  message: string;
  data: {
    transaction_id: string;
    reprint: AgentReceiptPrintFlag;
    receipt: {
      receiptNo: string;
      receiptData: Record<string, unknown>;
      receiptHTML: string;
      printInstructions: string;
    };
  };
};

export type AgentProfileResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    hospital_id: string;
    hospital_code: string;
    hospital_name: string;
    role: "AGENT";
    is_active: boolean;
    created_at: string;
    balance: number;
    last_wallet_topup: number;
    balance_created_at: string;
    balance_updated_at: string;
  };
};
