"use client";

import AdminSearchField from "@/components/admin/AdminSearchField";
import FoBillItemFormModal from "@/components/fo/FoBillItemFormModal";
import FoBillItemsTable from "@/components/fo/FoBillItemsTable";
import Header from "@/components/shared/Header";
import { useCatalogWorkspace } from "@/components/catalog/CatalogWorkspaceProvider";
import { formatNaira } from "@/libs/helper";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

export default function CatalogBillItemsPage() {
  const { departments, incomeHeads, billItems, createBillItem, updateBillItem } =
    useCatalogWorkspace();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("All");
  const [incomeHeadId, setIncomeHeadId] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [modalDepartmentId, setModalDepartmentId] = useState("");
  const [editingBillItem, setEditingBillItem] = useState<{
    bill_item_id: string;
    department_id: string;
    income_head_id: string;
    name: string;
    amount: number;
    status: "active" | "inactive" | "suspended";
  } | null>(null);

  const departmentOptions = useMemo(
    () => departments.map((item) => ({ id: item.id, name: item.name })),
    [departments],
  );

  const incomeHeadOptions = useMemo(
    () =>
      incomeHeads
        .filter((item) =>
          departmentId === "All" ? true : item.departmentId === departmentId,
        )
        .map((item) => ({ id: item.id, name: item.name })),
    [departmentId, incomeHeads],
  );

  const modalIncomeHeadOptions = useMemo(
    () =>
      incomeHeads
        .filter((item) =>
          modalDepartmentId
            ? item.departmentId === modalDepartmentId
            : true,
        )
        .map((item) => ({ id: item.id, name: item.name })),
    [incomeHeads, modalDepartmentId],
  );

  const rows = useMemo(
    () =>
      billItems.filter((item) => {
        const matchesDepartment =
          departmentId === "All" ? true : item.department_id === departmentId;
        const matchesIncomeHead =
          incomeHeadId === "All" ? true : item.income_head_id === incomeHeadId;
        const matchesSearch = item.name
          .toLowerCase()
          .includes(search.trim().toLowerCase());

        return matchesDepartment && matchesIncomeHead && matchesSearch;
      }),
    [billItems, departmentId, incomeHeadId, search],
  );

  const totalValue = useMemo(
    () => rows.reduce((sum, item) => sum + item.amount, 0),
    [rows],
  );

  return (
    <div className="min-h-screen w-full bg-canvas">
      <Header
        title="Bill Items"
        Subtitle="Browse and manage catalog bill items"
          actions={
            <button
              type="button"
              onClick={() => {
                setModalDepartmentId("");
                setIsCreateOpen(true);
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Add Bill Item
          </button>
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Total Bill Items
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {rows.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Active On This View
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {rows.filter((item) => item.is_active).length}
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
              Total Listed Value
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              {formatNaira(totalValue)}
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] dark:border-line-subtle dark:bg-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <AdminSearchField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bill items"
            />

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={departmentId}
                onChange={(event) => {
                  const nextDepartmentId = event.target.value;
                  setDepartmentId(nextDepartmentId);
                  setIncomeHeadId("All");
                }}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100"
              >
                <option value="All">All Departments</option>
                {departmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>

              <select
                value={incomeHeadId}
                onChange={(event) => setIncomeHeadId(event.target.value)}
                disabled={departmentId === "All"}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-line-subtle dark:bg-canvas-alt dark:text-slate-100 dark:disabled:bg-panel-strong"
              >
                <option value="All">
                  {departmentId === "All"
                    ? "Select department first"
                    : "All Income Heads"}
                </option>
                {incomeHeadOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <FoBillItemsTable
          rows={rows}
          onEdit={(item) =>
            {
              setModalDepartmentId(item.department_id);
              setEditingBillItem({
                bill_item_id: item.bill_item_id,
                department_id: item.department_id,
                income_head_id: item.income_head_id,
                name: item.name,
                amount: item.amount,
                status: item.status ?? "active",
              });
            }
          }
        />
      </div>

      {isCreateOpen ? (
        <FoBillItemFormModal
          key="create-bill-item"
          mode="create"
          departmentOptions={departmentOptions}
          incomeHeadOptions={modalIncomeHeadOptions}
          onClose={() => setIsCreateOpen(false)}
          onDepartmentChange={setModalDepartmentId}
          onSubmit={(values) => {
            if (!values.departmentId || !values.incomeHeadId || !values.name) {
              toast.error("Complete the bill item form first.");
              return;
            }

            createBillItem({
              departmentId: values.departmentId,
              incomeHeadId: values.incomeHeadId,
              name: values.name,
              amount: Number(values.amount),
              status: values.status,
            });
            toast.success("Bill item saved.");
            setIsCreateOpen(false);
          }}
        />
      ) : null}

      {editingBillItem ? (
        <FoBillItemFormModal
          key={editingBillItem.bill_item_id}
          mode="edit"
          departmentOptions={departmentOptions}
          incomeHeadOptions={modalIncomeHeadOptions}
          initialValues={{
            departmentId: editingBillItem.department_id,
            incomeHeadId: editingBillItem.income_head_id,
            name: editingBillItem.name,
            amount: String(editingBillItem.amount),
            status: editingBillItem.status,
          }}
          onClose={() => setEditingBillItem(null)}
          onDepartmentChange={setModalDepartmentId}
          onSubmit={(values) => {
            if (!values.departmentId || !values.incomeHeadId || !values.name) {
              toast.error("Complete the bill item form first.");
              return;
            }

            updateBillItem(editingBillItem.bill_item_id, {
              departmentId: values.departmentId,
              incomeHeadId: values.incomeHeadId,
              name: values.name,
              amount: Number(values.amount),
              status: values.status,
            });
            toast.success("Bill item updated.");
            setEditingBillItem(null);
          }}
        />
      ) : null}
    </div>
  );
}
