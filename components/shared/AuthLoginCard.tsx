"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";
import { getAdminDashboard } from "@/libs/admin-auth";
import { ApiError } from "@/libs/api";
import { clearAuthTokens, storeAgentTokens, decodeJwt } from "@/libs/auth";
import { getAgentProfile, loginAgent, selectPharmacyUnit } from "@/libs/agent-auth";
import { getFoProfile } from "@/libs/fo-auth";
import { getPharmacyProfile, getPharmacyStoreProfile } from "@/libs/pharmacy-api";

type Props = {
  mode?: "embedded" | "page";
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function AuthLoginCard({ mode = "page" }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Pharmacy unit selection states
  const [requiresUnitSelection, setRequiresUnitSelection] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [units, setUnits] = useState<Array<{ id: string; name: string; type: "point" | "store" }>>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const handleSuccessLogin = async (accessToken: string, refreshToken: string, message?: string) => {
    storeAgentTokens({ accessToken, refreshToken });

    const decoded = decodeJwt(accessToken);
    const decodedRole = String(decoded?.role || decoded?.user?.role || decoded?.identity?.role || decoded?.data?.role || "").toUpperCase();

    if (decodedRole === "PLATFORM_ADMIN") {
      toast.success(message || "Login successful.");
      router.push("/admin/dashboard");
      return;
    }

    if (decodedRole === "FO") {
      try {
        const profile = await getFoProfile();
        const activeModules = profile?.data?.modules ?? [];
        let targetPath = "/fo/settings";
        const priority = [
          { key: "dashboard", path: "/fo/dashboard" },
          { key: "agents", path: "/fo/agents" },
          { key: "transactions", path: "/fo/transactions" },
          { key: "departments", path: "/fo/departments" },
          { key: "income-heads", path: "/fo/income-heads" },
          { key: "bill-items", path: "/fo/bill-items" },
          { key: "receipts", path: "/fo/receipts" },
          { key: "reports-general", path: "/fo/reports" },
          { key: "reports-patient", path: "/fo/reports/patient" },
          { key: "reports-department", path: "/fo/reports/department" },
          { key: "reports-agent", path: "/fo/reports/agent" },
        ];
        for (const item of priority) {
          if (activeModules.includes(item.key)) {
            targetPath = item.path;
            break;
          }
        }
        toast.success(message || "Login successful.");
        router.push(targetPath);
        return;
      } catch (err) {
        toast.success(message || "Login successful.");
        router.push("/fo/dashboard");
        return;
      }
    }

    if (decodedRole === "PHARMACY" || decodedRole === "PHARMACY_STORE") {
      try {
        const profile = decodedRole === "PHARMACY_STORE" 
          ? await getPharmacyStoreProfile() 
          : await getPharmacyProfile();
        const activeModules = profile?.data?.modules ?? [];
        let targetPath = "/pharmacy/dashboard";
        const priority = [
          { key: "dashboard", path: "/pharmacy/dashboard" },
          { key: "dispense", path: "/pharmacy/dispense" },
          { key: "prescriptions", path: "/pharmacy/prescriptions" },
          { key: "inventory", path: "/pharmacy/inventory" },
          { key: "reports", path: "/pharmacy/reports" },
        ];
        for (const item of priority) {
          if (activeModules.includes(item.key)) {
            targetPath = item.path;
            break;
          }
        }
        toast.success(message || "Login successful.");
        router.push(targetPath);
        return;
      } catch (err) {
        toast.success(message || "Login successful.");
        router.push("/pharmacy/dashboard");
        return;
      }
    }

    if (decodedRole === "AGENT") {
      try {
        const profile = await getAgentProfile();
        const activeModules = profile?.data?.modules ?? [];
        let targetPath = "/agents/settings";
        const priority = [
          { key: "dashboard", path: "/agents/dashboard" },
          { key: "transactions", path: "/agents/transactions" },
          { key: "receipts", path: "/agents/receipts" },
          { key: "topup-history", path: "/agents/topup-history" },
          { key: "reports", path: "/agents/reports" },
        ];
        for (const item of priority) {
          if (activeModules.includes(item.key)) {
            targetPath = item.path;
            break;
          }
        }
        toast.success(message || "Login successful.");
        router.push(targetPath);
        return;
      } catch (err) {
        toast.success(message || "Login successful.");
        router.push("/agents/dashboard");
        return;
      }
    }

    try {
      await getAdminDashboard();
      toast.success(message || "Login successful.");
      router.push("/admin/dashboard");
      return;
    } catch (error) {
      if (!(error instanceof ApiError) || ![401, 403, 404].includes(error.status)) {
        clearAuthTokens();
        toast.error(getErrorMessage(error));
        return;
      }
    }

    try {
      const profile = await getFoProfile();
      const role = String(profile.data.role).toUpperCase();
      const activeModules = profile?.data?.modules ?? [];
      if (role === "PHARMACY" || role === "PHARMACY_STORE") {
        let targetPath = "/pharmacy/dashboard";
        const priority = [
          { key: "dashboard", path: "/pharmacy/dashboard" },
          { key: "dispense", path: "/pharmacy/dispense" },
          { key: "prescriptions", path: "/pharmacy/prescriptions" },
          { key: "inventory", path: "/pharmacy/inventory" },
          { key: "reports", path: "/pharmacy/reports" },
        ];
        for (const item of priority) {
          if (activeModules.includes(item.key)) {
            targetPath = item.path;
            break;
          }
        }
        toast.success(message || "Login successful.");
        router.push(targetPath);
        return;
      }

      let targetPath = "/agents/settings";
      const priority = [
        { key: "dashboard", path: "/agents/dashboard" },
        { key: "transactions", path: "/agents/transactions" },
        { key: "receipts", path: "/agents/receipts" },
        { key: "topup-history", path: "/agents/topup-history" },
        { key: "reports", path: "/agents/reports" },
      ];
      for (const item of priority) {
        if (activeModules.includes(item.key)) {
          targetPath = item.path;
          break;
        }
      }
      toast.success(message || "Login successful.");
      router.push(targetPath);
      return;
    } catch (error) {
      clearAuthTokens();
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
        toast.error("Your account does not have a valid role assigned.");
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  };

  const loginMutation = useMutation({
    mutationFn: loginAgent,
    onSuccess: async (response) => {
      if (response.data?.requires_unit_selection) {
        setTempToken(response.data.tempToken || "");
        setUnits(response.data.units || []);
        if (response.data.units && response.data.units.length > 0) {
          setSelectedUnitId(response.data.units[0].id);
        }
        setRequiresUnitSelection(true);
        return;
      }

      const accessToken = response.data?.accessToken;
      const refreshToken = response.data?.refreshToken;

      if (!accessToken || !refreshToken) {
        toast.error("Login succeeded but no token was returned.");
        return;
      }

      await handleSuccessLogin(accessToken, refreshToken, response.message);
    },
    onError: (error) => {
      clearAuthTokens();
      toast.error(getErrorMessage(error));
    },
  });

  const selectUnitMutation = useMutation({
    mutationFn: () => selectPharmacyUnit(tempToken, selectedUnitId),
    onSuccess: async (response) => {
      const accessToken = response.data?.accessToken;
      const refreshToken = response.data?.refreshToken;

      if (!accessToken || !refreshToken) {
        toast.error("Selection succeeded but no token was returned.");
        return;
      }

      await handleSuccessLogin(accessToken, refreshToken, response.message);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  const isEmbedded = mode === "embedded";

  if (requiresUnitSelection) {
    return (
      <div
        className={
          isEmbedded
            ? "w-full rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_28px_90px_rgba(2,6,23,0.45)] sm:p-8"
            : "w-full max-w-xl rounded-4xl border border-line-subtle bg-panel p-6 shadow-[0_30px_80px_rgba(15,118,110,0.12)] dark:border-line-subtle dark:bg-panel sm:p-8"
        }
      >
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Assigned Units
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
            Select Pharmacy Unit
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Please choose a pharmacy point to log in and start billing.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {units.map((unit) => {
              const isSelected = selectedUnitId === unit.id;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedUnitId(unit.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition ${
                    isSelected
                      ? "border-brand-500 bg-brand-500/5 text-brand-900 dark:border-brand-400 dark:text-brand-300"
                      : "border-slate-200 hover:bg-slate-50/50 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-800/40 dark:text-slate-300"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {unit.name}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                      {unit.type}
                    </span>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-brand-500 dark:border-brand-400" : "border-slate-300 dark:border-slate-700"
                  }`}>
                    {isSelected && (
                      <div className="h-2.5 w-2.5 rounded-full bg-brand-500 dark:bg-brand-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setRequiresUnitSelection(false);
                setTempToken("");
                setUnits([]);
                setSelectedUnitId("");
              }}
              className="flex-1 rounded-2xl border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => selectUnitMutation.mutate()}
              disabled={selectUnitMutation.isPending || !selectedUnitId}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-brand-600 dark:hover:bg-brand-700"
            >
              {selectUnitMutation.isPending ? "Please wait..." : "Proceed"}
              <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isEmbedded
          ? "w-full rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_28px_90px_rgba(2,6,23,0.45)] sm:p-8"
          : "w-full max-w-xl rounded-4xl border border-line-subtle bg-panel p-6 shadow-[0_30px_80px_rgba(15,118,110,0.12)] dark:border-line-subtle dark:bg-panel sm:p-8"
      }
    >
      <div className="text-center">
        {process.env.NEXT_PUBLIC_SHOW_DEV_BANNER === "true" && (
          <p className="mb-3 inline-flex items-center rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            Welcome to the development environment
          </p>
        )}
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Sign in to continue
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
          Login
        </h2>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email address
          </span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-slate-950 outline-none transition focus:border-brand-500 focus:bg-white dark:border-line-subtle dark:bg-slate-950/70 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-950"
            type="email"
            placeholder="you@hospital.com"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
          </span>
          <div className="relative">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 pr-12 text-slate-950 outline-none transition focus:border-brand-500 focus:bg-white dark:border-line-subtle dark:bg-slate-950/70 dark:text-white dark:focus:border-brand-400 dark:focus:bg-slate-950"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          {loginMutation.isPending ? "Please wait..." : "Login"}
          <FiArrowRight />
        </button>

      </form>
    </div>
  );
}
