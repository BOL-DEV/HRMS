type TransactionStatus = "Paid" | "Pending" | "Refund" | "Failed";

export interface Transaction {
  id: string;
  patient: string;
  invoiceNo: string;
  revenueHead: string;
  amount: number;
  status: TransactionStatus;
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

type ReceiptStatus = "Paid" | "Pending" | "Refunded";
type ReceiptPaymentMethod = "Cash" | "Transfer" | "POS" | "Insurance";

export interface ReceiptRow {
  id: string;
  receiptId: string;
  invoiceNo: string;
  patientName: string;
  amount: number;
  paymentMethod: ReceiptPaymentMethod;
  status: ReceiptStatus;
  dateIssued: string;
}

type PaymentMethod = "Cash" | "Transfer" | "POS";

export interface TransactionRow {
  id: string;
  patient: string;
  phone: string;
  invoiceNo: string;
  revenueHead: string;
  department: string;
  amount: number;
  payment: PaymentMethod;
  status: TransactionStatus;
  dateTime: string;
}