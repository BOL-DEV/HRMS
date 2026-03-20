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

export interface NewTransactionForm {
  patient: string;
  phoneNo: string;
  department: string;
  paymentMethod: PaymentMethod;
  amount: string;
  notes: string;
}
