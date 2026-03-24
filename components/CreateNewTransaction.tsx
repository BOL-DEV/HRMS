"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import type { NewTransactionForm } from "@/libs/type";
import ConfirmNewTransaction from "./ConfirmNewTransaction";
import NewTransactionModal from "./NewTransactionModal";
import {
  getAgentDepartments,
  processAgentPayment,
} from "@/libs/agent-auth";

interface Props {
  open: boolean;
  onClose: () => void;
}

function getInitialForm(): NewTransactionForm {
  return {
    patientName: "",
    phoneNumber: "",
    departmentId: "",
    departmentName: "",
    billDescription: "",
    amount: "",
    paymentType: "cash",
  };
}

function printReceipt(receiptHTML: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    toast.error("Popup blocked. Please allow popups to print the receipt.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function CreateNewTransaction({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewTransactionForm>(getInitialForm);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const departmentsQuery = useQuery({
    queryKey: ["agent-departments"],
    queryFn: getAgentDepartments,
    enabled: open,
  });

  const departments = useMemo(
    () => departmentsQuery.data?.data ?? [],
    [departmentsQuery.data],
  );

  const paymentMethods = useMemo(() => ["cash", "transfer", "pos"] as const, []);

  const paymentMutation = useMutation({
    mutationFn: processAgentPayment,
    onSuccess: (response) => {
      toast.success(response.message || "Payment processed successfully.");
      queryClient.invalidateQueries({ queryKey: ["agent-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["agent-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["agent-receipts"] });
      printReceipt(response.data.receipt.receiptHTML);
      setConfirmOpen(false);
      setForm(getInitialForm());
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to process payment.");
    },
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    name: keyof NewTransactionForm,
  ) => {
    const value = e.target.value;

    if (name === "departmentId") {
      const selectedDepartment = departments.find(
        (department) => department.id === value,
      );

      setForm((prev) => ({
        ...prev,
        departmentId: value,
        departmentName: selectedDepartment?.name ?? "",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    paymentMutation.mutate({
      department_id: form.departmentId,
      patient_name: form.patientName.trim(),
      phone_number: form.phoneNumber.trim(),
      bill_description: form.billDescription.trim(),
      amount: Number(form.amount),
      payment_type: form.paymentType,
    });
  };

  const handleClose = () => {
    if (paymentMutation.isPending) {
      return;
    }

    setConfirmOpen(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => (confirmOpen ? setConfirmOpen(false) : handleClose())}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        {confirmOpen ? (
          <ConfirmNewTransaction
            form={form}
            isSubmitting={paymentMutation.isPending}
            onEdit={() => setConfirmOpen(false)}
            onConfirm={handleConfirm}
          />
        ) : (
          <NewTransactionModal
            open
            onClose={handleClose}
            form={form}
            departments={departments.map((department) => ({
              id: department.id,
              name: department.name,
            }))}
            paymentMethods={[...paymentMethods]}
            onChange={handleChange}
            onSubmit={handleSubmit}
            isLoadingDepartments={departmentsQuery.isLoading}
            isSubmitting={paymentMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

export default CreateNewTransaction;
