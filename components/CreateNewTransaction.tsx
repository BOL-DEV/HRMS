"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type { NewTransactionForm } from "@/libs/type";
import ConfirmNewTransaction from "./ConfirmNewTransaction";
import NewTransactionModal from "./NewTransactionModal";

interface Props {
  open: boolean;
  onClose: () => void;
}

function CreateNewTransaction({ open, onClose }: Props) {
  const initialForm = useMemo<NewTransactionForm>(
    () => ({
      patient: "",
      phoneNo: "",
      department: "General Medicine",
      amount: "",
      paymentMethod: "Cash",
      notes: "",
    }),
    [],
  );

  const departments = useMemo(
    () => ["General Medicine", "Pathology", "Surgery", "Radiology", "Pharmacy"],
    [],
  );

  const paymentMethods = useMemo(() => ["Cash", "Transfer", "POS"], []);

  const [form, setForm] = useState(initialForm);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    name: keyof NewTransactionForm,
  ) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // Native HTML validation (required/min/etc.) runs before this fires.
    e.preventDefault();
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    toast.success("Transaction created successfully");
    setConfirmOpen(false);
    setForm(initialForm);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => (confirmOpen ? setConfirmOpen(false) : onClose())}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        {confirmOpen ? (
          <ConfirmNewTransaction
            form={form}
            onEdit={() => setConfirmOpen(false)}
            onConfirm={handleConfirm}
          />
        ) : (
          <NewTransactionModal
            open
            onClose={onClose}
            form={form}
            departments={departments}
            paymentMethods={paymentMethods as Array<NewTransactionForm["paymentMethod"]>}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default CreateNewTransaction;
