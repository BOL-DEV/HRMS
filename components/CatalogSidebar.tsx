"use client";

import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { FiGrid, FiLayers, FiTag } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import { RxHamburgerMenu } from "react-icons/rx";

const sidebarData = {
  title: "CATALOG",
  links: [
    {
      name: "Departments",
      link: "/catalog/departments",
      label: <FiGrid className="inline" />,
      active: true,
    },
    {
      name: "Income Heads",
      link: "/catalog/income-heads",
      label: <FiLayers className="inline" />,
      active: false,
    },
    {
      name: "Bill Items",
      link: "/catalog/bill-items",
      label: <FiTag className="inline" />,
      active: false,
    },
  ],
};

function CatalogSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = useMemo(
    () =>
      sidebarData.links.map((link) => ({
        ...link,
        active: pathname === link.link || pathname.startsWith(`${link.link}/`),
      })),
    [pathname],
  );

  const toggleSidebar = () => setIsOpen((current) => !current);
  const closeSidebar = () => setIsOpen(false);

  return (
    <div className="relative">
      {isOpen ? (
        <IoMdClose
          onClick={toggleSidebar}
          className="fixed left-45 top-7 z-50 inline-flex items-center justify-center rounded-xl bg-white p-2 text-4xl text-gray-700 shadow md:hidden dark:bg-panel-strong dark:text-slate-100"
        />
      ) : (
        <RxHamburgerMenu
          onClick={toggleSidebar}
          className="fixed left-4 top-5 z-50 inline-flex items-center justify-center rounded-xl bg-white p-2 text-4xl text-gray-700 shadow md:hidden dark:bg-panel-strong dark:text-slate-100"
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
}

export default CatalogSidebar;
