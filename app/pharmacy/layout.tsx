"use client";

import React from "react";
import PharmacySidebar from "@/components/pharmacy/PharmacySidebar";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPharmacyProfile } from "@/libs/pharmacy-api";
import { getAgentAccessToken } from "@/libs/auth";
import AccessDenied from "@/components/shared/AccessDenied";

interface Props {
  children: React.ReactNode;
}

export default function PharmacyLayout({ children }: Props) {
  const pathname = usePathname();
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["pharmacy-profile-sidebar"],
    queryFn: getPharmacyProfile,
    enabled: Boolean(accessToken),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const activeModules = profileResponse?.data?.modules;

  // Resolve sub-module name and required key
  const moduleInfo = React.useMemo(() => {
    if (pathname.startsWith("/pharmacy/dashboard")) {
      return { key: "dashboard", name: "Dashboard" };
    }
    if (pathname.startsWith("/pharmacy/dispense")) {
      return { key: "dispense", name: "Dispense" };
    }
    if (pathname.startsWith("/pharmacy/prescriptions")) {
      return { key: "prescriptions", name: "Prescriptions" };
    }
    if (pathname.startsWith("/pharmacy/inventory")) {
      return { key: "inventory", name: "Inventory" };
    }
    if (pathname.startsWith("/pharmacy/reports")) {
      return { key: "reports", name: "Reports" };
    }
    return null;
  }, [pathname]);

  const hasAccess = React.useMemo(() => {
    const isPlatformAdmin = (profileResponse?.data?.role as string) === "PLATFORM_ADMIN";
    if (isPlatformAdmin) return true;

    const userRole = profileResponse?.data?.role as string;
    if (userRole === "PHARMACY_STORE") {
      if (pathname.startsWith("/pharmacy/dispense") || pathname.startsWith("/pharmacy/prescriptions")) {
        return false;
      }
    }

    if (!moduleInfo) return true; // Settings/Profile or other general routes
    if (!activeModules) return true; // fallback if profile loading or not resolved
    if (moduleInfo.key === "inventory") {
      return (
        activeModules.includes("inventory") ||
        activeModules.includes("inventory-edit") ||
        activeModules.includes("inventory-history")
      );
    }
    return activeModules.includes(moduleInfo.key);
  }, [moduleInfo, activeModules, profileResponse, pathname]);

  return (
    <div className="min-h-screen bg-canvas text-slate-900 dark:text-slate-100">
      <main className="flex">
        <PharmacySidebar />
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
