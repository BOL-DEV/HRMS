"use client";

import FoSidebar from '@/components/fo/FoSidebar';
import React from 'react';
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getFoProfile } from "@/libs/fo-auth";
import { getAccessToken } from "@/libs/auth";
import AccessDenied from "@/components/shared/AccessDenied";

interface Props {
  children: React.ReactNode;
}

export default function FoLayout({ children }: Props) {
  const pathname = usePathname();
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["fo-profile-sidebar"],
    queryFn: getFoProfile,
    enabled: Boolean(accessToken),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const activeModules = profileResponse?.data?.modules;

  // Resolve sub-module name and required key
  const moduleInfo = React.useMemo(() => {
    if (pathname.startsWith("/fo/dashboard")) {
      return { key: "dashboard", name: "Dashboard" };
    }
    if (pathname.startsWith("/fo/agents")) {
      return { key: "agents", name: "Agents" };
    }
    if (pathname.startsWith("/fo/agent-topups")) {
      return { key: "agents", name: "Agent Top-Ups" };
    }
    if (pathname.startsWith("/fo/transactions")) {
      return { key: "transactions", name: "Transactions" };
    }
    if (pathname.startsWith("/fo/departments")) {
      return { key: "departments", name: "Departments" };
    }
    if (pathname.startsWith("/fo/income-heads")) {
      return { key: "income-heads", name: "Income Heads" };
    }
    if (pathname.startsWith("/fo/bill-items")) {
      return { key: "bill-items", name: "Bill Items" };
    }
    if (pathname.startsWith("/fo/receipts")) {
      return { key: "receipts", name: "Receipts" };
    }
    if (pathname.startsWith("/fo/reports")) {
      if (pathname.startsWith("/fo/reports/department")) {
        return { key: "reports-department", name: "Department Report" };
      }
      if (pathname.startsWith("/fo/reports/agent")) {
        return { key: "reports-agent", name: "Agent Report" };
      }
      if (pathname.startsWith("/fo/reports/patient")) {
        return { key: "reports-patient", name: "Patient Report" };
      }
      return { key: "reports-general", name: "General Revenue Report" };
    }
    return null;
  }, [pathname]);

  const hasAccess = React.useMemo(() => {
    if (!moduleInfo) return true; // Settings/Profile or other general routes
    if (!activeModules) return true; // fallback if profile loading or not resolved
    return activeModules.includes(moduleInfo.key);
  }, [moduleInfo, activeModules]);

  return (
    <div className="min-h-screen bg-canvas text-slate-900 dark:text-slate-100">
      <main className="flex">
        <FoSidebar />
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex min-h-[80vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-transparent"></div>
            </div>
          ) : !hasAccess && moduleInfo ? (
            <AccessDenied moduleName={moduleInfo.name} />
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
