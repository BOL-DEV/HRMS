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

export interface RevenueChartDatum {
  name: string;
  value: number;
}

export interface AgentPerformanceRow {
  id: string;
  name: string;
  totalTransactions: number;
  totalRevenue: number;
  pending: number;
  refunds: number;
  lastActive: string;
  status: "Active" | "Inactive";
}

export interface RecentTransactionDisplayRow {
  id: string;
  patientName: string;
  phoneNumber: string;
  billDescription: string;
  departmentName: string;
  amount: number;
  status: string;
  createdAt: string;
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
  // pending: number;
  // refunds: number;
  lastActive: string;
  status: AgentStatus;
}

export type SortOption = "newest" | "oldest" | "revenue";

export interface AgentsTableProps {
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

export type FoDashboardResponse = {
  status: number;
  message: string;
  data: {
    hospital_id: string;
    periods: {
      today: {
        total_revenue: number;
        transaction_count: number;
      };
      this_month: {
        total_revenue: number;
        transaction_count: number;
      };
      last_month: {
        total_revenue: number;
        transaction_count: number;
      };
      this_year: {
        total_revenue: number;
        transaction_count: number;
      };
    };
  };
};

export type FoProfileResponse = {
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
    role: "FO";
    is_active: boolean;
    last_activity: string;
    created_at: string;
  };
};

export type AdminDashboardResponse = {
  status: number;
  message: string;
  data: {
    summary: {
      active_hospitals: number;
      total_agents_across_hospitals: number;
      total_hospitals: number;
      total_platform_revenue: number;
      total_transactions_made_by_agents: number;
    };
    revenueTrend: Array<{
      month_key: string;
      month_label: string;
      revenue: number;
      transaction_count: number;
    }>;
    transactionCountByPaymentMethod: Array<{
      payment_type: string;
      revenue: number;
      transaction_count: number;
    }>;
    hospitalsByRevenueGenerated: Array<{
      hospital_id: string;
      hospital_name: string;
      revenue: number;
      transaction_count: number;
    }>;
    highestPerformingHospitals: Array<{
      hospital_id: string;
      hospital_name: string;
      revenue: number;
      transaction_count: number;
      agent_count: number;
      status: string;
    }>;
  };
};

export type AdminSystemLogsResponse = {
  status: number;
  message: string;
  data: {
    filters: {
      start_date: string | null;
      end_date: string | null;
      page: number;
      limit: number;
    };
    pagination: {
      current_page: number;
      total_pages: number;
      total_logs: number;
      has_next: boolean;
      has_previous: boolean;
      logs_per_page: number;
    };
    logs: Array<{
      log_id: string;
      event: string;
      status: string;
      user: {
        user_id: string;
        name: string;
        email: string;
        role: string;
      };
      metadata: Record<string, unknown>;
      created_at: string;
    }>;
  };
};

export type AdminHospitalStatus = "active" | "suspended";

export type AdminHospitalSummary = {
  total_hospitals: number;
  suspended_hospitals: number;
  total_platform_revenue: number;
};

export type AdminHospitalsFilters = {
  search: string | null;
  hospital_name: string | null;
  hospital_code: string | null;
  hospital_status: AdminHospitalStatus | null;
  sort: "newest" | "oldest" | null;
};

export type AdminHospitalListItem = {
  hospital_id: string;
  hospital_name: string;
  hospital_code: string;
  hospital_email: string;
  phone: string;
  agents: number;
  fos: number;
  transaction_count: number;
  total_revenue: number;
  status: AdminHospitalStatus;
};

export type AdminHospitalsResponse = {
  status: number;
  message: string;
  data: {
    summary: AdminHospitalSummary;
    filters: AdminHospitalsFilters;
    hospitals: AdminHospitalListItem[];
  };
};

export type AdminHospitalOverviewResponse = {
  status: number;
  message: string;
  data: {
    hospital: {
      hospital_id: string;
      hospital_name: string;
      hospital_code: string;
      hospital_email: string;
      hospital_phone: string;
      address: string;
      status: AdminHospitalStatus;
    };
    overview: {
      total_revenue: number;
      total_transactions: number;
      total_agents: number;
      total_departments: number;
      pending_receipt_reprint: number;
    };
    revenue_trend: Array<{
      date: string;
      revenue: number;
    }>;
  };
};

export type AdminHospitalAgentStatus = "active" | "suspended";

export type AdminHospitalAgentNameOption = {
  agent_id: string;
  agent_name: string;
};

export type AdminHospitalAgentListItem = {
  agent_id: string;
  agent_name: string;
  email: string;
  balance: number;
  total_revenue_made: number;
  status: AdminHospitalAgentStatus;
};

export type AdminHospitalAgentsResponse = {
  status: number;
  message: string;
  data: {
    hospital_id: string;
    filters: {
      search: string | null;
    };
    total_agents: number;
    agent_name_list: AdminHospitalAgentNameOption[];
    agents: AdminHospitalAgentListItem[];
  };
};

export type CreateAdminHospitalAgentPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
};

export type CreateAdminHospitalAgentResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: "AGENT";
    hospital_id: string;
    is_active: boolean;
  };
};

export type UpdateAdminHospitalAgentPayload = Partial<
  CreateAdminHospitalAgentPayload & {
    status: AdminHospitalAgentStatus;
  }
>;

export type UpdateAdminHospitalAgentResponse = {
  status: number;
  message: string;
  data: {
    agent_id: string;
    first_name: string;
    last_name: string;
    agent_name: string;
    email: string;
    phone: string;
    hospital_id: string;
    status: AdminHospitalAgentStatus;
    updated_at: string;
  };
};

export type AdminHospitalFoStatus = "active" | "suspended";

export type AdminHospitalFoNameOption = {
  fo_id: string;
  fo_name: string;
};

export type AdminHospitalFoListItem = {
  fo_id: string;
  fo_name: string;
  email: string;
  phone: string;
  status: AdminHospitalFoStatus;
};

export type AdminHospitalFosResponse = {
  status: number;
  message: string;
  data: {
    hospital_id: string;
    filters: {
      search: string | null;
    };
    total_fos: number;
    fo_name_list: AdminHospitalFoNameOption[];
    fos: AdminHospitalFoListItem[];
  };
};

export type CreateAdminHospitalFoPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
};

export type CreateAdminHospitalFoResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: "FO";
    hospital_id: string;
    is_active: boolean;
  };
};

export type UpdateAdminHospitalFoPayload = Partial<
  CreateAdminHospitalFoPayload & {
    status: AdminHospitalFoStatus;
  }
>;

export type UpdateAdminHospitalFoResponse = {
  status: number;
  message: string;
  data: {
    fo_id: string;
    first_name: string;
    last_name: string;
    fo_name: string;
    email: string;
    phone: string;
    hospital_id: string;
    status: AdminHospitalFoStatus;
    updated_at: string;
  };
};

export type AdminHospitalDepartmentItem =
  | string
  | {
      id?: string;
      department_id?: string;
      hospital_id?: string;
      name: string;
      is_active?: boolean;
      is_deleted?: boolean;
      created_at?: string;
      updated_at?: string;
    };

export type AdminHospitalDepartmentsResponse = {
  status: number;
  message: string;
  data: {
    hospital_id: string;
    filters: {
      search: string | null;
    };
    total_departments: number;
    departments: AdminHospitalDepartmentItem[];
  };
};

export type CreateAdminHospitalDepartmentPayload = {
  name: string;
};

export type CreateAdminHospitalDepartmentResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    hospital_id: string;
    name: string;
    is_active: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  };
};

export type UpdateAdminHospitalDepartmentPayload = {
  name: string;
};

export type UpdateAdminHospitalDepartmentResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    hospital_id: string;
    name: string;
    is_active: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  };
};

export type DeleteAdminHospitalDepartmentResponse =
  UpdateAdminHospitalDepartmentResponse;

export type AdminHospitalTransactionsResponse = {
  status: number;
  message: string;
  data: {
    hospital_id: string;
    filters: {
      start_date: string | null;
      end_date: string | null;
      search: string | null;
      page: number;
      limit: number;
    };
    summary: {
      total_revenue: number;
      transaction_count: number;
    };
    pagination: {
      current_page: number;
      total_pages: number;
      total_transactions: number;
      has_next: boolean;
      has_previous: boolean;
      transactions_per_page: number;
    };
    transactions: Array<{
      date_time: string;
      receipt_id: string;
      patient_name: string;
      revenue_head: string;
      amount: number;
      agent: string;
    }>;
  };
};

export type AdminHospitalActivityLogsResponse = {
  status: number;
  message: string;
  data: {
    hospital_id: string;
    filters: {
      start_date: string | null;
      end_date: string | null;
      page: number;
      limit: number;
    };
    pagination: {
      current_page: number;
      total_pages: number;
      total_logs: number;
      has_next: boolean;
      has_previous: boolean;
      logs_per_page: number;
    };
    logs: Array<{
      log_id: string;
      action: string;
      actor: {
        user_id: string;
        name: string;
        email: string;
        role: string;
      };
      target: {
        type: string;
        id: string;
        label: string;
      };
      metadata: Record<string, unknown>;
      created_at: string;
    }>;
  };
};

export type AdminReceiptFilter = "all" | "pending" | "approved" | "rejected";

export type AdminReceiptRequestStatus = "pending" | "approved" | "rejected";

export type AdminReceiptActionUser = {
  user_id: string;
  name: string;
  email: string;
  role: string;
};

export type AdminHospitalReceiptItem = {
  request_id: string;
  transaction_id: string;
  receipt_no: string;
  patient_name: string;
  reason: string;
  amount: number;
  requested_at: string;
  action_at: string | null;
  agent_name: string;
  agent_email: string;
  status: AdminReceiptRequestStatus;
  action_by: AdminReceiptActionUser | null;
  approved_by: AdminReceiptActionUser | null;
  rejected_by: AdminReceiptActionUser | null;
};

export type AdminHospitalReceiptsResponse = {
  status: number;
  message: string;
  data: {
    summary: {
      total_receipt_count: number;
      pending_request: number;
      approved: number;
      rejected: number;
    };
    filter: AdminReceiptFilter;
    receipts: AdminHospitalReceiptItem[];
  };
};

export type AdminReceiptDecisionPayload = {
  request_id: string;
};

export type AdminReceiptDecisionResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    transaction_id: string;
    agent_id: string;
    status: AdminReceiptRequestStatus;
    approved_at: string;
  };
};

export type AdminAgentTopupPayload = {
  agent_id: string;
  hospital_id: string;
  amount: number;
};

export type AdminAgentTopupResponse = {
  status: number;
  message: string;
  data: {
    updated_balance: number;
  };
};

export type CreateAdminHospitalPayload = {
  name: string;
  logo_url: string;
  address: string;
  contact_email: string;
  contact_phone: string;
};

export type CreateAdminHospitalResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    hospital_code: string;
    name: string;
    logo_url: string | null;
    address: string;
    contact_email: string;
    contact_phone: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
};

export type UpdateAdminHospitalPayload = Partial<
  CreateAdminHospitalPayload & {
    status: AdminHospitalStatus;
  }
>;

export type UpdateAdminHospitalResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    hospital_code: string;
    name: string;
    logo_url: string | null;
    address: string;
    contact_email: string;
    contact_phone: string;
    is_active: boolean;
    updated_at: string;
  };
};

export type FoAgentStatus = "active" | "suspended";

export type FoAgentsSummary = {
  total_agents: number;
  active_agents: number;
  suspended_agents: number;
};

export type FoAgentsFilters = {
  search: string | null;
  status: FoAgentStatus | null;
};

export type FoAgentListItem = {
  agent_id: string;
  agent_name: string;
  email: string;
  phone_number: string;
  transaction_count: number;
  revenue_made: number;
  last_active: string;
  status: FoAgentStatus;
};

export type FoAgentsResponse = {
  status: number;
  message: string;
  data: {
    hospital_id: string;
    summary: FoAgentsSummary;
    filters: FoAgentsFilters;
    agents: FoAgentListItem[];
  };
};

export type UpdateFoAgentStatusPayload = {
  status: FoAgentStatus;
};

export type UpdateFoAgentStatusResponse = {
  status: number;
  message: string;
  data: {
    agent_id: string;
    agent_name: string;
    email: string;
    phone_number: string;
    hospital_id: string;
    status: FoAgentStatus;
  };
};

export type FoReportPaymentType = "cash" | "transfer" | "pos";

export type FoReportDepartmentBreakdownItem = {
  department_id: string;
  department_name: string;
  transaction_count: number;
  total_revenue: number;
};

export type FoReportPaymentMethodBreakdownItem = {
  payment_type: FoReportPaymentType;
  transaction_count: number;
  total_revenue: number;
};

export type FoReportAgentBreakdownItem = {
  agent_id: string;
  agent_name: string;
  transaction_count: number;
  total_revenue: number;
};

export type FoDetailedReportItem = {
  transaction_id: string;
  receipt_no: string;
  patient_name: string;
  phone_number: string;
  bill_description: string;
  amount: number;
  payment_type: FoReportPaymentType;
  department_name: string;
  agent_name: string;
  created_at: string;
};

export type FoReportsResponse = {
  status: number;
  message: string;
  data: {
    hospital_id: string;
    filters: {
      start_date: string | null;
      end_date: string | null;
      departments: string[];
      agents: string[];
    };
    summary_report: {
      total_revenue: number;
      transaction_count: number;
      active_agents: number;
      departments_count: number;
      average_transaction_value: number;
      lowest_transaction_value: number;
      highest_transaction_value: number;
    };
    breakdowns: {
      by_department: FoReportDepartmentBreakdownItem[];
      by_payment_method: FoReportPaymentMethodBreakdownItem[];
      by_agent: FoReportAgentBreakdownItem[];
    };
    detailed_report: FoDetailedReportItem[];
  };
};

export type FoStatsTimePeriod =
  | "today"
  | "this_week"
  | "this_month"
  | "this_year";

export type FoStatsResponse = {
  status: number;
  message: string;
  data: {
    hospital_id: string;
    time_period: FoStatsTimePeriod;
    summary: {
      total_revenue: number;
      transaction_count: number;
    };
    leaderboard: Array<{
      agent_id: string;
      agent_name: string;
      trxn_count: number;
      revenue: number;
    }>;
    revenue_by_departments: Array<{
      department_id: string;
      department_name: string;
      trxn_count: number;
      revenue: number;
    }>;
    payment_methods: Array<{
      payment_type: FoReportPaymentType;
      trxn_count: number;
      total_value: number;
    }>;
  };
};

export type FoReceiptFilter = "all" | "pending" | "approved" | "rejected";

export type FoReceiptRequestStatus = "pending" | "approved" | "rejected";

export type FoReceiptSummary = {
  total_receipt_count: number;
  pending_request: number;
  approved: number;
  rejected: number;
};

export type FoReceiptItem = {
  receipt_no: string;
  request_id: string;
  patient_name: string;
  reason: string;
  amount: number;
  agent_email: string;
  status: FoReceiptRequestStatus;
};

export type FoReceiptsResponse = {
  status: number;
  message: string;
  data: {
    summary: FoReceiptSummary;
    filter: FoReceiptFilter;
    receipts: FoReceiptItem[];
  };
};

export type FoReceiptDecisionPayload = {
  request_id: string;
};

export type FoReceiptDecisionResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    transaction_id: string;
    agent_id: string;
    status: FoReceiptRequestStatus;
    approved_at: string;
  };
};

export type CreateFoAgentPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
};

export type CreateFoAgentResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: "AGENT";
    hospital_id: string;
    is_active: boolean;
  };
};

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type UpdatePasswordResponse = {
  status: number;
  message: string;
  data: null;
};
