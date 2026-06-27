"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CatalogDepartment = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CatalogIncomeHead = {
  id: string;
  departmentId: string;
  departmentName: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CatalogBillItem = {
  bill_item_id: string;
  department_id: string;
  department_name: string;
  income_head_id: string;
  income_head_name: string;
  name: string;
  amount: number;
  status: "active" | "inactive" | "suspended";
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

type CatalogWorkspaceContextValue = {
  departments: CatalogDepartment[];
  incomeHeads: CatalogIncomeHead[];
  billItems: CatalogBillItem[];
  createDepartment: (name: string) => void;
  updateDepartment: (departmentId: string, name: string) => void;
  createIncomeHead: (payload: {
    departmentId: string;
    name: string;
    status: "active" | "suspended";
  }) => void;
  updateIncomeHead: (
    incomeHeadId: string,
    payload: {
      departmentId: string;
      name: string;
      status: "active" | "suspended";
    },
  ) => void;
  createBillItem: (payload: {
    departmentId: string;
    incomeHeadId: string;
    name: string;
    amount: number;
    status: "active" | "inactive" | "suspended";
  }) => void;
  updateBillItem: (
    billItemId: string,
    payload: {
      departmentId: string;
      incomeHeadId: string;
      name: string;
      amount: number;
      status: "active" | "inactive" | "suspended";
    },
  ) => void;
};

const CatalogWorkspaceContext =
  createContext<CatalogWorkspaceContextValue | null>(null);

function makeTimestamp() {
  return new Date().toISOString();
}

function CatalogWorkspaceProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<CatalogDepartment[]>(() => [
    {
      id: "general",
      name: "General",
      isActive: true,
      createdAt: makeTimestamp(),
      updatedAt: makeTimestamp(),
    },
    {
      id: "radiology",
      name: "Radiology",
      isActive: true,
      createdAt: makeTimestamp(),
      updatedAt: makeTimestamp(),
    },
  ]);

  const [incomeHeads, setIncomeHeads] = useState<CatalogIncomeHead[]>(() => [
    {
      id: "consultation",
      departmentId: "general",
      departmentName: "General",
      name: "Consultation",
      isActive: true,
      createdAt: makeTimestamp(),
      updatedAt: makeTimestamp(),
    },
  ]);

  const [billItems, setBillItems] = useState<CatalogBillItem[]>(() => [
    {
      bill_item_id: "registration-fee",
      department_id: "general",
      department_name: "General",
      income_head_id: "consultation",
      income_head_name: "Consultation",
      name: "Registration Fee",
      amount: 5000,
      status: "active",
      is_active: true,
      is_deleted: false,
      created_at: makeTimestamp(),
      updated_at: makeTimestamp(),
    },
  ]);

  const value = useMemo<CatalogWorkspaceContextValue>(
    () => ({
      departments,
      incomeHeads,
      billItems,
      createDepartment: (name) => {
        const now = makeTimestamp();

        setDepartments((current) => [
          ...current,
          {
            id: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
            name,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          },
        ]);
      },
      updateDepartment: (departmentId, name) => {
        const now = makeTimestamp();

        setDepartments((current) =>
          current.map((department) =>
            department.id === departmentId
              ? {
                  ...department,
                  name,
                  updatedAt: now,
                }
              : department,
          ),
        );

        setIncomeHeads((current) =>
          current.map((incomeHead) =>
            incomeHead.departmentId === departmentId
              ? {
                  ...incomeHead,
                  departmentName: name,
                  updatedAt: now,
                }
              : incomeHead,
          ),
        );

        setBillItems((current) =>
          current.map((billItem) =>
            billItem.department_id === departmentId
              ? {
                  ...billItem,
                  department_name: name,
                  updated_at: now,
                }
              : billItem,
          ),
        );
      },
      createIncomeHead: ({ departmentId, name, status }) => {
        const departmentName =
          departments.find((department) => department.id === departmentId)?.name ??
          "";
        const now = makeTimestamp();

        setIncomeHeads((current) => [
          ...current,
          {
            id: `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
            departmentId,
            departmentName,
            name,
            isActive: status === "active",
            createdAt: now,
            updatedAt: now,
          },
        ]);
      },
      updateIncomeHead: (incomeHeadId, payload) => {
        const departmentName =
          departments.find((department) => department.id === payload.departmentId)
            ?.name ?? "";
        const now = makeTimestamp();

        setIncomeHeads((current) =>
          current.map((incomeHead) =>
            incomeHead.id === incomeHeadId
              ? {
                  ...incomeHead,
                  departmentId: payload.departmentId,
                  departmentName,
                  name: payload.name,
                  isActive: payload.status === "active",
                  updatedAt: now,
                }
              : incomeHead,
          ),
        );
      },
      createBillItem: (payload) => {
        const departmentName =
          departments.find((department) => department.id === payload.departmentId)
            ?.name ?? "";
        const incomeHeadName =
          incomeHeads.find((incomeHead) => incomeHead.id === payload.incomeHeadId)
            ?.name ?? "";
        const now = makeTimestamp();

        setBillItems((current) => [
          ...current,
          {
            bill_item_id: `${payload.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
            department_id: payload.departmentId,
            department_name: departmentName,
            income_head_id: payload.incomeHeadId,
            income_head_name: incomeHeadName,
            name: payload.name,
            amount: payload.amount,
            status: payload.status,
            is_active: payload.status !== "inactive",
            is_deleted: false,
            created_at: now,
            updated_at: now,
          },
        ]);
      },
      updateBillItem: (billItemId, payload) => {
        const departmentName =
          departments.find((department) => department.id === payload.departmentId)
            ?.name ?? "";
        const incomeHeadName =
          incomeHeads.find((incomeHead) => incomeHead.id === payload.incomeHeadId)
            ?.name ?? "";
        const now = makeTimestamp();

        setBillItems((current) =>
          current.map((billItem) =>
            billItem.bill_item_id === billItemId
              ? {
                  ...billItem,
                  department_id: payload.departmentId,
                  department_name: departmentName,
                  income_head_id: payload.incomeHeadId,
                  income_head_name: incomeHeadName,
                  name: payload.name,
                  amount: payload.amount,
                  status: payload.status,
                  is_active: payload.status !== "inactive",
                  updated_at: now,
                }
              : billItem,
          ),
        );
      },
    }),
    [billItems, departments, incomeHeads],
  );

  return (
    <CatalogWorkspaceContext.Provider value={value}>
      {children}
    </CatalogWorkspaceContext.Provider>
  );
}

function useCatalogWorkspace() {
  const context = useContext(CatalogWorkspaceContext);

  if (!context) {
    throw new Error("useCatalogWorkspace must be used within the provider.");
  }

  return context;
}

export { CatalogWorkspaceProvider, useCatalogWorkspace };
