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

import { getPharmacyProfile, getPharmacyStoreProfile } from "@/libs/pharmacy-api";
import { getAgentProfile } from "@/libs/agent-auth";
import { getAgentAccessToken, decodeJwt } from "@/libs/auth";
import { useQuery } from "@tanstack/react-query";

const PharmacySidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const accessToken = typeof window !== "undefined" ? getAgentAccessToken() : null;
  const decoded = useMemo(() => (accessToken ? decodeJwt(accessToken) : null), [accessToken]);

  const { data: profileResponse } = useQuery({
    queryKey: ["pharmacy-profile-sidebar", decoded?.role],
    queryFn: async () => {
      if (decoded?.role === "PHARMACY_STORE") {
        return (await getPharmacyStoreProfile()) as any;
      }
      return (await getPharmacyProfile()) as any;
    },
    enabled: Boolean(accessToken),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const activeModules = profileResponse?.data?.modules;

  const userRole = (profileResponse?.data?.role as string) || (decoded?.role as string);

  const links = useMemo(() => {
    return sidebarData.links
      .filter((link) => {
        // Hide transfers completely for Point Pharmacists (Transfers is Central Store only)
        if (userRole !== "PHARMACY_STORE" && userRole !== "PLATFORM_ADMIN" && link.link === "/pharmacy/transfers") {
          return false;
        }

        // Hide retail dispensing and prescriptions for Central Store Managers
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
          "/pharmacy/transfers": ["transfers", "transfer-history"],
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
