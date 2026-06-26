import type { Dispatch, RefObject, SetStateAction } from "react";
import type {
  AgentBillItem,
  AgentDepartment,
  AgentIncomeHead,
  HospitalPatientSearchItem,
  NewTransactionForm,
} from "@/libs/type";

export type TransactionMode = "patient" | "express";

export type SelectedAutomaticItem = {
  billItemId: string;
  billItemName: string;
  incomeHeadId: string;
  incomeHeadName: string;
  unitAmount: number;
  quantity: number;
  amount: number;
};

export type SelectedManualItem = {
  id: string;
  incomeHeadId: string;
  incomeHeadName: string;
  billName: string;
  amount: number;
};

export type ExpressPaymentForm = {
  departmentId: string;
  fullName: string;
  phoneNumber: string;
  service: string;
  amount: string;
  paymentType: NewTransactionForm["paymentType"];
};

export type CreateTransactionSharedProps = {
  departments: AgentDepartment[];
  departmentsError: string | null;
  paymentMode: "manual" | "automatic" | "";
};

export type ExpressTransactionSectionProps = {
  departments: AgentDepartment[];
  departmentsError: string | null;
  expressForm: ExpressPaymentForm;
  setExpressForm: Dispatch<SetStateAction<ExpressPaymentForm>>;
  expressStepReady: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

export type PatientTransactionSectionProps = {
  transactionMode: TransactionMode;
  onModeChange: (mode: TransactionMode) => void;
  configError: string | null;
  departmentsError: string | null;
  incomeHeadsError: string | null;
  billItemsError: string | null;
  patientSearchError: string | null;
  departments: AgentDepartment[];
  incomeHeads: AgentIncomeHead[];
  billItems: AgentBillItem[];
  patientSuggestions: HospitalPatientSearchItem[];
  patientSearchQueryLoading: boolean;
  billItemsQueryLoading: boolean;
  billItemFieldRef: RefObject<HTMLDivElement | null>;
  patientFieldRef: RefObject<HTMLDivElement | null>;
  form: NewTransactionForm;
  setForm: Dispatch<SetStateAction<NewTransactionForm>>;
  patientSearchInput: string;
  setPatientSearchInput: Dispatch<SetStateAction<string>>;
  showPatientSuggestions: boolean;
  setShowPatientSuggestions: Dispatch<SetStateAction<boolean>>;
  showBillItemList: boolean;
  setShowBillItemList: Dispatch<SetStateAction<boolean>>;
  selectedBillItems: SelectedAutomaticItem[];
  setSelectedBillItems: Dispatch<SetStateAction<SelectedAutomaticItem[]>>;
  selectedManualItems: SelectedManualItem[];
  setSelectedManualItems: Dispatch<SetStateAction<SelectedManualItem[]>>;
  billSearch: string;
  setBillSearch: Dispatch<SetStateAction<string>>;
  totalAmount: number;
  patientStepReady: boolean;
  paymentStepReady: boolean;
  isSubmitting: boolean;
  onPatientLookup: () => void;
  onDepartmentChange: (value: string) => void;
  onIncomeHeadChange: (value: string) => void;
  onBillItemChange: (billItem: AgentBillItem) => void;
  onAddItem: () => void;
  onRemoveAutomaticItem: (billItemId: string) => void;
  onRemoveManualItem: (id: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};
