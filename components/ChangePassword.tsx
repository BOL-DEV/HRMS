"use client";

import { updateAccountPassword } from "@/libs/account-auth";
import { clearAuthTokens } from "@/libs/auth";
import type { UpdatePasswordPayload } from "@/libs/type";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";

type Props = {
  workspaceLabel?: string;
};

function ChangePassword({ workspaceLabel = "account" }: Props) {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const passwordMutation = useMutation({
    mutationFn: (payload: UpdatePasswordPayload) =>
      updateAccountPassword(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      clearAuthTokens();
      router.replace("/login");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update password.",
      );
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirm password must match.");
      return;
    }

    passwordMutation.mutate({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          Change Password
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Update your {workspaceLabel} password. You’ll be logged out after a
          successful change.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <PasswordField
          label="Current Password"
          value={form.currentPassword}
          visible={showCurrentPassword}
          onToggleVisibility={() =>
            setShowCurrentPassword((previous) => !previous)
          }
          onChange={(value) =>
            setForm((previous) => ({ ...previous, currentPassword: value }))
          }
        />

        <PasswordField
          label="New Password"
          value={form.newPassword}
          visible={showNewPassword}
          onToggleVisibility={() =>
            setShowNewPassword((previous) => !previous)
          }
          onChange={(value) =>
            setForm((previous) => ({ ...previous, newPassword: value }))
          }
        />

        <PasswordField
          label="Confirm New Password"
          value={form.confirmPassword}
          visible={showConfirmPassword}
          onToggleVisibility={() =>
            setShowConfirmPassword((previous) => !previous)
          }
          onChange={(value) =>
            setForm((previous) => ({ ...previous, confirmPassword: value }))
          }
        />

        <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-slate-700">
          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordMutation.isPending ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onToggleVisibility,
  onChange,
}: {
  label: string;
  value: string;
  visible: boolean;
  onToggleVisibility: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
        {label}
      </span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-11 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          required
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </label>
  );
}

export default ChangePassword;
