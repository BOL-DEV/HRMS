"use client";

import React from "react";
import { FiLock, FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { clearAuthTokens } from "@/libs/auth";

interface AccessDeniedProps {
  moduleName: string;
}

export default function AccessDenied({ moduleName }: AccessDeniedProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearAuthTokens();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-sm dark:bg-red-500/10 dark:text-red-400">
        <FiLock className="h-10 w-10 animate-pulse" />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
        Access Restricted
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        You do not have permission to access the <span className="font-semibold text-slate-800 dark:text-slate-200">"{moduleName}"</span> sub-module. Please request module permissions from your administrator.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center rounded-xl border border-gray-250 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Go Back
        </button>
        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none"
        >
          <FiLogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
