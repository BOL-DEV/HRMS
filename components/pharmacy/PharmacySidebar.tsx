"use client";

import { usePathname } from "next/navigation";
import { FaRegChartBar } from "react-icons/fa";
import { FiPlusCircle, FiPackage, FiFileText, FiTrendingUp } from "react-icons/fi";
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
      name: "Reports",
      link: "/pharmacy/reports",
      label: <FiTrendingUp className="inline" />,
      active: false,
    },
  ],
};

const PharmacySidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = useMemo(
    () =>
      sidebarData.links.map((link) => ({
        ...link,
        active: pathname === link.link,
      })),
    [pathname],
  );

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
