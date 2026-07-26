"use client";

import React from 'react';
import AgentSidebar from '../../components/agent/AgentSidebar';
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAgentProfile } from "@/libs/agent-auth";
import { getAgentAccessToken } from "@/libs/auth";
import AccessDenied from "@/components/shared/AccessDenied";

interface Props {
  children: React.ReactNode;
}

export default function AgentLayout({ children }: Props) {
  const pathname = usePathname();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["agent-profile-sidebar"],
    queryFn: getAgentProfile,
    enabled: Boolean(accessToken),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const activeModules = profileResponse?.data?.modules;

  // Resolve sub-module name and required key
  const moduleInfo = React.useMemo(() => {
    if (pathname.startsWith("/agents/dashboard")) {
      return { key: "dashboard", name: "Dashboard" };
    }
    if (pathname.startsWith("/agents/transactions")) {
      return { key: "transactions", name: "Transactions" };
    }
    if (pathname.startsWith("/agents/receipts")) {
      return { key: "receipts", name: "Receipts" };
    }
    if (pathname.startsWith("/agents/topup-history")) {
      return { key: "topup-history", name: "Top-Up History" };
    }
    if (pathname.startsWith("/agents/reports")) {
      return { key: "reports", name: "Reports" };
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
        <AgentSidebar />
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
