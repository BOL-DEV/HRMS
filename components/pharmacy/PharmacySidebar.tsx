"use client";

import { usePathname } from "next/navigation";
import { FaRegChartBar } from "react-icons/fa";
import { FiPlusCircle, FiPackage, FiFileText, FiTrendingUp, FiSettings, FiRefreshCw } from "react-icons/fi";
import Sidebar from "@/components/shared/Sidebar";
import { RxHamburgerMenu } from "react-icons/rx";
import { useMemo, useState } from "react";
import { IoMdClose as CloseIcon } from "react-icons/io";

const sidebarData = {
  title: "Pharmacy",
  links: [
    {
      name: "Dashboard",
      link: "/pharmacy/dashboard",
      label: <FaRegChartBar className="inline" />,
      active: true,
    },
    {
      name: "Dispense",
      link: "/pharmacy/dispense",
      label: <FiPlusCircle className="inline" />,
      active: false,
    },
    {
      name: "Prescriptions",
      link: "/pharmacy/prescriptions",
      label: <FiFileText className="inline" />,
      active: false,
    },
    {
      name: "Inventory",
      link: "/pharmacy/inventory",
      label: <FiPackage className="inline" />,
      active: false,
    },
    {
      name: "Transfers",
      link: "/pharmacy/transfers",
      label: <FiRefreshCw className="inline" />,
      active: false,
    },
    {
      name: "Reports",
      link: "/pharmacy/reports",
      label: <FiTrendingUp className="inline" />,
      active: false,
    },
    {
      name: "Settings",
      link: "/pharmacy/settings",
      label: <FiSettings className="inline" />,
      active: false,
    },
  ],
};

import { getPharmacyProfile } from "@/libs/pharmacy-api";
import { getAgentProfile } from "@/libs/agent-auth";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";

const PharmacySidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;
  const decoded = useMemo(() => (accessToken ? decodeJwt(accessToken) : null), [accessToken]);

  const { data: profileResponse } = useQuery({
    queryKey: ["pharmacy-profile-sidebar"],
    queryFn: async () => {
      try {
        return await getPharmacyProfile();
      } catch (err) {
        console.warn("[PharmacySidebar] getPharmacyProfile failed, fallback to getAgentProfile:", err);
        const agentProfile = await getAgentProfile();
        return {
          status: agentProfile.status,
          message: agentProfile.message,
          data: {
            ...agentProfile.data,
            role: (decoded?.role as any) || "PHARMACY_STORE",
            hospital_modules: {
              has_pharmacy_module: true,
              allow_pharmacy_self_pay: true,
              allow_agent_pharmacy_pay: true,
              allow_pharmacy_walk_in: true,
            },
            modules: agentProfile.data.modules,
          },
        } as any;
      }
    },
    enabled: Boolean(accessToken),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const activeModules = profileResponse?.data?.modules;

  const userRole = decoded?.role as string;

  const links = useMemo(() => {
    return sidebarData.links
      .filter((link) => {
        // Fast-path: Hide point-only modules for Store Managers instantly
        if (userRole === "PHARMACY_STORE") {
          if (link.link === "/pharmacy/dispense" || link.link === "/pharmacy/prescriptions") {
            return false;
          }
        }

        if (!activeModules) return true; // fallback if profile not loaded
        const isPlatformAdmin = (profileResponse?.data?.role as string) === "PLATFORM_ADMIN";
        if (isPlatformAdmin) return true;

        const keyMap: Record<string, string | string[]> = {
          "/pharmacy/dashboard": "dashboard",
          "/pharmacy/dispense": "dispense",
          "/pharmacy/prescriptions": "prescriptions",
          "/pharmacy/inventory": ["inventory", "inventory-edit", "inventory-history"],
          "/pharmacy/reports": "reports",
        };
        const val = keyMap[link.link];
        if (!val) return true;
        if (Array.isArray(val)) {
          return val.some((k) => activeModules.includes(k));
        }
        return activeModules.includes(val);
      })
      .map((link) => ({
        ...link,
        active: pathname === link.link,
      }));
  }, [pathname, activeModules, profileResponse, userRole]);

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const closeSidebar = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-5 z-50 inline-flex items-center justify-center rounded-xl bg-white p-2 text-4xl text-gray-700 shadow md:hidden dark:bg-panel-strong dark:text-slate-100"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
      >
        {isOpen ? <CloseIcon /> : <RxHamburgerMenu />}
      </button>

      <Sidebar title={sidebarData.title} links={links} isOpen={isOpen} />

      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
};

export default PharmacySidebar;
