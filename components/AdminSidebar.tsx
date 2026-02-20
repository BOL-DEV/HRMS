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
      label: <FaRegChartBar className="inline mr-2" />,
      active: true,
    },
    {
      name: "Hospitals",
      link: "/admin/hospitals",
      label: <LuHospital className="inline mr-2" />,
      active: false,
    },
    {
      name: "Reports",
      link: "/admin/reports",
      label: <TbActivityHeartbeat className="inline mr-2" />,
      active: false,
    },
    {
      name: "System Logs",
      link: "/admin/system-logs",
      label: <MdOutlinePeopleAlt className="inline mr-2" />,
      active: false,
    },
    {
      name: "Settings",
      link: "/admin/settings",
      label: <IoSettingsOutline className="inline mr-2" />,
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
        active: pathname === link.link,
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
          className="inline-flex items-center justify-center rounded-lg bg-white p-2 text-4xl text-gray-700 shadow md:hidden fixed left-45 top-7 z-50"
        />
      ) : (
        <RxHamburgerMenu
          onClick={toggleSidebar}
          className="inline-flex items-center justify-center rounded-lg bg-white p-2 text-4xl text-gray-700 shadow md:hidden fixed left-4 top-5 z-50"
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
