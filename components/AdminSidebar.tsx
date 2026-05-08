"use client";

import { usePathname } from "next/navigation";
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import Sidebar from "./Sidebar";
import { RxHamburgerMenu } from "react-icons/rx";
import { useMemo, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { TbActivityHeartbeat } from "react-icons/tb";
import { LuHospital } from "react-icons/lu";
import { IoSettingsOutline } from "react-icons/io5";

const sidebarData = {
  title: "Admin",
  links: [
    {
      name: "Dashboard",
      link: "/admin/dashboard",
      label: <FaRegChartBar className="inline" />,
      active: true,
    },
    {
      name: "Hospitals",
      link: "/admin/hospitals",
      label: <LuHospital className="inline" />,
      active: false,
    },
    {
      name: "Reports",
      link: "/admin/reports",
      label: <TbActivityHeartbeat className="inline" />,
      active: false,
      children: [
        {
          name: "Revenue Report",
          link: "/admin/reports/revenue",
          active: false,
        },
        {
          name: "Department Report",
          link: "/admin/reports/department",
          active: false,
        },
        {
          name: "Agent Report",
          link: "/admin/reports/agent",
          active: false,
        },
        {
          name: "Patient Report",
          link: "/admin/reports/patient",
          active: false,
        },
      ],
    },
    {
      name: "System Logs",
      link: "/admin/system-logs",
      label: <MdOutlinePeopleAlt className="inline" />,
      active: false,
    },
    {
      name: "Settings",
      link: "/admin/settings",
      label: <IoSettingsOutline className="inline" />,
      active: false,
    },
  ],
};

const AdminSidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = useMemo(
    () =>
      sidebarData.links.map((link) => ({
        ...link,
        active:
          link.link === "/admin/reports"
            ? pathname === "/admin/reports" || pathname.startsWith("/admin/reports/")
            : pathname === link.link ||
              (link.link !== "/admin/dashboard" && pathname.startsWith(`${link.link}/`)) ||
              (link.link === "/admin/hospitals" &&
                pathname.startsWith("/admin/hospitals/")),
        children: link.children?.map((child) => ({
          ...child,
          active: pathname === child.link,
        })),
      })),
    [pathname],
  );

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const closeSidebar = () => setIsOpen(false);

  return (
    <div className="relative">
      {isOpen ? (
        <IoMdClose
          onClick={toggleSidebar}
          className="fixed left-45 top-7 z-50 inline-flex items-center justify-center rounded-xl border border-line-subtle bg-panel p-2 text-4xl text-gray-700 shadow md:hidden dark:bg-panel-strong dark:text-slate-100"
        />
      ) : (
        <RxHamburgerMenu
          onClick={toggleSidebar}
          className="fixed left-4 top-5 z-50 inline-flex items-center justify-center rounded-xl border border-line-subtle bg-panel p-2 text-4xl text-gray-700 shadow md:hidden dark:bg-panel-strong dark:text-slate-100"
        />
      )}

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

export default AdminSidebar;
