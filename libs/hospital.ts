import { formatUsd } from "@/libs/helper";

export type HospitalStatus = "Active" | "Suspended";

export type HospitalTransactionStatus = "completed" | "pending" | "failed";

export type HospitalTransaction = {
  id: string;
  patient: string;
  amount: number;
  paymentMethod: string;
  status: HospitalTransactionStatus;
  date: string;
};

export type HospitalAgentStatus = "Active" | "Inactive" | "Suspended";

export type HospitalAgent = {
  id: string;
  name: string;
  email: string;
  role: string;
  sales: number;
  performance: number; // 0 - 100
  status: HospitalAgentStatus;
};

export type HospitalPatientStatus = "Active" | "Inactive";

export type HospitalPatient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  transactions: number;
  lastTransaction: string;
  status: HospitalPatientStatus;
};

export type HospitalRevenuePoint = {
  date: string;
  amount: number;
};

export type HospitalRefundStatus = "pending" | "approved" | "rejected";

export type HospitalRefundRequest = {
  id: string;
  patient: string;
  amount: number;
  reason: string;
  status: HospitalRefundStatus;
  requested: string;
};

export type HospitalActivityActor = "Admin" | "System";

export type HospitalActivityLog = {
  id: string;
  title: string;
  by: HospitalActivityActor;
  message: string;
  timestamp: string;
};

export type Hospital = {
  id: string;
  name: string;
  hospitalId: string;
  status: HospitalStatus;
  email: string;
  phone: string;
  address: string;
  revenue: number;
  transactions: number;
  agents: number;
  patients: number;
  pendingRefunds: number;
  revenueDeltaLabel?: string;
  transactionsLabel?: string;
  agentsLabel?: string;
  patientsLabel?: string;
  refundsLabel?: string;
  revenueTrend: HospitalRevenuePoint[];
  recentTransactions: HospitalTransaction[];
  transactionsList: HospitalTransaction[];
  refundRequestsList: HospitalRefundRequest[];
  activityLogsList: HospitalActivityLog[];
  agentsList: HospitalAgent[];
  patientsList: HospitalPatient[];
};

const hospitals: Hospital[] = [
  {
    id: "h1",
    name: "Metropolitan Hospital Center",
    hospitalId: "HC-001",
    status: "Active",
    email: "admin@metropolitan.com",
    phone: "+1 (555) 123-4567",
    address: "500 Park Avenue",
    revenue: 385000,
    transactions: 2450,
    agents: 45,
    patients: 8920,
    pendingRefunds: 12,
    revenueDeltaLabel: "+5.2% this month",
    transactionsLabel: "82 per day",
    agentsLabel: `${formatUsd(8555.56)} revenue per agent`,
    patientsLabel: "Active users",
    refundsLabel: "Awaiting review",
    revenueTrend: [
      { date: "Feb 1", amount: 12400 },
      { date: "Feb 5", amount: 15200 },
      { date: "Feb 10", amount: 13750 },
      { date: "Feb 15", amount: 18900 },
      { date: "Feb 20", amount: 17200 },
    ],
    recentTransactions: [
      {
        id: "TXN-001",
        patient: "John Doe",
        amount: 250,
        paymentMethod: "Credit Card",
        status: "completed",
        date: "2024-02-15",
      },
      {
        id: "TXN-002",
        patient: "Sarah Wilson",
        amount: 180,
        paymentMethod: "Bank Transfer",
        status: "completed",
        date: "2024-02-18",
      },
      {
        id: "TXN-003",
        patient: "Michael Brown",
        amount: 320,
        paymentMethod: "Credit Card",
        status: "pending",
        date: "2024-02-19",
      },
    ],
    transactionsList: [
      {
        id: "TXN-001",
        patient: "John Doe",
        amount: 250,
        paymentMethod: "Credit Card",
        status: "completed",
        date: "2024-02-15",
      },
      {
        id: "TXN-002",
        patient: "Sarah Wilson",
        amount: 180,
        paymentMethod: "Bank Transfer",
        status: "completed",
        date: "2024-02-18",
      },
      {
        id: "TXN-003",
        patient: "Michael Brown",
        amount: 320,
        paymentMethod: "Credit Card",
        status: "pending",
        date: "2024-02-19",
      },
    ],
    refundRequestsList: [
      {
        id: "REF-001",
        patient: "John Doe",
        amount: 250,
        reason: "Service not received",
        status: "pending",
        requested: "2024-02-16",
      },
      {
        id: "REF-002",
        patient: "Sarah Wilson",
        amount: 180,
        reason: "Duplicate charge",
        status: "approved",
        requested: "2024-02-18",
      },
    ],
    activityLogsList: [
      {
        id: "log-1",
        title: "Agent Activated",
        by: "Admin",
        message: "Alice Johnson status changed from suspended to active",
        timestamp: "2024-02-19 14:30",
      },
      {
        id: "log-2",
        title: "Transaction Marked as Paid",
        by: "Admin",
        message: "Transaction TXN-003 manually marked as paid",
        timestamp: "2024-02-18 11:15",
      },
      {
        id: "log-3",
        title: "Refund Processed",
        by: "System",
        message: "Refund REF-002 completed and transferred to patient account",
        timestamp: "2024-02-17 09:45",
      },
    ],
    agentsList: [
      {
        id: "a1",
        name: "Alice Johnson",
        email: "alice@metropolitan.com",
        role: "Senior Agent",
        sales: 45000,
        performance: 95,
        status: "Active",
      },
      {
        id: "a2",
        name: "Robert Smith",
        email: "robert@metropolitan.com",
        role: "Agent",
        sales: 32000,
        performance: 88,
        status: "Active",
      },
      {
        id: "a3",
        name: "Emily Chen",
        email: "emily@metropolitan.com",
        role: "Junior Agent",
        sales: 18000,
        performance: 72,
        status: "Active",
      },
    ],
    patientsList: [
      {
        id: "p1",
        name: "John Doe",
        email: "john@example.com",
        phone: "+1 (555) 444-5555",
        totalSpent: 2500,
        transactions: 8,
        lastTransaction: "2024-02-15",
        status: "Active",
      },
      {
        id: "p2",
        name: "Sarah Wilson",
        email: "sarah@example.com",
        phone: "+1 (555) 555-6666",
        totalSpent: 1800,
        transactions: 6,
        lastTransaction: "2024-02-18",
        status: "Active",
      },
      {
        id: "p3",
        name: "Michael Brown",
        email: "michael@example.com",
        phone: "+1 (555) 666-7777",
        totalSpent: 3200,
        transactions: 10,
        lastTransaction: "2024-02-10",
        status: "Active",
      },
    ],
  },
  {
    id: "h2",
    name: "City Medical Complex",
    hospitalId: "HC-002",
    status: "Active",
    email: "contact@citymedical.com",
    phone: "+1 (555) 234-5678",
    address: "1200 Main Street",
    revenue: 320000,
    transactions: 2100,
    agents: 38,
    patients: 7240,
    pendingRefunds: 7,
    revenueTrend: [
      { date: "Feb 1", amount: 9800 },
      { date: "Feb 5", amount: 12100 },
      { date: "Feb 10", amount: 11000 },
      { date: "Feb 15", amount: 14500 },
      { date: "Feb 20", amount: 13600 },
    ],
    recentTransactions: [],
    transactionsList: [],
    refundRequestsList: [],
    activityLogsList: [],
    agentsList: [],
    patientsList: [],
  },
  {
    id: "h3",
    name: "Riverside Healthcare",
    hospitalId: "HC-003",
    status: "Active",
    email: "info@riverside.com",
    phone: "+1 (555) 345-6789",
    address: "77 Riverside Blvd",
    revenue: 285000,
    transactions: 1800,
    agents: 32,
    patients: 5680,
    pendingRefunds: 4,
    revenueTrend: [
      { date: "Feb 1", amount: 8600 },
      { date: "Feb 5", amount: 9900 },
      { date: "Feb 10", amount: 9200 },
      { date: "Feb 15", amount: 11100 },
      { date: "Feb 20", amount: 10400 },
    ],
    recentTransactions: [],
    transactionsList: [],
    refundRequestsList: [],
    activityLogsList: [],
    agentsList: [],
    patientsList: [],
  },
  {
    id: "h4",
    name: "Sunset Medical Center",
    hospitalId: "HC-004",
    status: "Active",
    email: "admin@sunsetmedical.com",
    phone: "+1 (555) 456-7890",
    address: "44 Sunset Road",
    revenue: 245000,
    transactions: 1500,
    agents: 28,
    patients: 4920,
    pendingRefunds: 2,
    revenueTrend: [
      { date: "Feb 1", amount: 6200 },
      { date: "Feb 5", amount: 7100 },
      { date: "Feb 10", amount: 6900 },
      { date: "Feb 15", amount: 8200 },
      { date: "Feb 20", amount: 7700 },
    ],
    recentTransactions: [],
    transactionsList: [],
    refundRequestsList: [],
    activityLogsList: [],
    agentsList: [],
    patientsList: [],
  },
  {
    id: "h5",
    name: "Northside General Hospital",
    hospitalId: "HC-005",
    status: "Active",
    email: "contact@northside.com",
    phone: "+1 (555) 567-8901",
    address: "9 Northside Ave",
    revenue: 210000,
    transactions: 1200,
    agents: 24,
    patients: 3850,
    pendingRefunds: 1,
    revenueTrend: [
      { date: "Feb 1", amount: 5100 },
      { date: "Feb 5", amount: 5900 },
      { date: "Feb 10", amount: 5400 },
      { date: "Feb 15", amount: 6600 },
      { date: "Feb 20", amount: 6300 },
    ],
    recentTransactions: [],
    transactionsList: [],
    refundRequestsList: [],
    activityLogsList: [],
    agentsList: [],
    patientsList: [],
  },
  {
    id: "h6",
    name: "Eastside Wellness Center",
    hospitalId: "HC-006",
    status: "Suspended",
    email: "admin@eastside.com",
    phone: "+1 (555) 678-9012",
    address: "18 Eastside Way",
    revenue: 156000,
    transactions: 900,
    agents: 18,
    patients: 2100,
    pendingRefunds: 6,
    revenueTrend: [
      { date: "Feb 1", amount: 3900 },
      { date: "Feb 5", amount: 4100 },
      { date: "Feb 10", amount: 3700 },
      { date: "Feb 15", amount: 4500 },
      { date: "Feb 20", amount: 4200 },
    ],
    recentTransactions: [],
    transactionsList: [],
    refundRequestsList: [],
    activityLogsList: [],
    agentsList: [],
    patientsList: [],
  },
  {
    id: "h7",
    name: "Westview Medical",
    hospitalId: "HC-007",
    status: "Active",
    email: "info@westview.com",
    phone: "+1 (555) 789-0123",
    address: "310 Westview Drive",
    revenue: 189000,
    transactions: 1050,
    agents: 22,
    patients: 3450,
    pendingRefunds: 3,
    revenueTrend: [
      { date: "Feb 1", amount: 4400 },
      { date: "Feb 5", amount: 5000 },
      { date: "Feb 10", amount: 4700 },
      { date: "Feb 15", amount: 5600 },
      { date: "Feb 20", amount: 5200 },
    ],
    recentTransactions: [],
    transactionsList: [],
    refundRequestsList: [],
    activityLogsList: [],
    agentsList: [],
    patientsList: [],
  },
  {
    id: "h8",
    name: "Central Health Systems",
    hospitalId: "HC-008",
    status: "Active",
    email: "contact@centralhealth.com",
    phone: "+1 (555) 890-1234",
    address: "1 Central Plaza",
    revenue: 298000,
    transactions: 1980,
    agents: 35,
    patients: 6200,
    pendingRefunds: 5,
    revenueTrend: [
      { date: "Feb 1", amount: 9100 },
      { date: "Feb 5", amount: 10500 },
      { date: "Feb 10", amount: 9900 },
      { date: "Feb 15", amount: 12100 },
      { date: "Feb 20", amount: 11500 },
    ],
    recentTransactions: [],
    transactionsList: [],
    refundRequestsList: [],
    activityLogsList: [],
    agentsList: [],
    patientsList: [],
  },
];

export function getHospitalById(id: string): Hospital | undefined {
  const normalized = id.trim().toLowerCase();
  return hospitals.find(
    (h) => h.id.toLowerCase() === normalized || h.hospitalId.toLowerCase() === normalized,
  );
}

export function getHospitalDisplayId(id: string): string {
  const hospital = getHospitalById(id);
  return hospital?.hospitalId ?? id;
}

export function formatHospitalMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}
