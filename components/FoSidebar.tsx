"use client";

import { usePathname } from "next/navigation";
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { GrDocumentCloud } from "react-icons/gr";
import { BsReceipt } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import Sidebar from "./Sidebar";
import { RxHamburgerMenu } from "react-icons/rx";
import { useMemo, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { TbReportMedical } from "react-icons/tb";
import { RiRefundLine } from "react-icons/ri";

const sidebarData = {
  title: "FO",
  links: [
    {
      name: "Dashboard",
      link: "/fo/dashboard",
      label: <FaRegChartBar className="inline mr-2" />,
      active: true,
    },
    {
      name: "Agents",
      link: "/fo/agents",
      label: <MdOutlinePeopleAlt className="inline mr-2" />,
      active: false,
    },
    {
      name: "Patients",
      link: "/fo/patients",
      label: <MdOutlinePeopleAlt className="inline mr-2" />,
      active: false,
    },
    {
      name: "Transactions",
      link: "/fo/transactions",
      label: <GrDocumentCloud className="inline mr-2" />,
      active: false,
    },
    {
      name: "Receipts",
      link: "/fo/receipts",
      label: <BsReceipt className="inline mr-2" />,
      active: false,
    },
    {
      name: "Reports",
      link: "/fo/reports",
      label: <TbReportMedical className="inline mr-2" />,
      active: false,
    },
    {
      name: "Refunds",
      link: "/fo/refunds",
      label: <RiRefundLine className="inline mr-2" />,
      active: false,
    },
    {
      name: "Settings",
      link: "/fo/settings",
      label: <IoSettingsOutline className="inline mr-2" />,
      active: false,
    },
  ],
};

const FoSidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = useMemo(
    () =>
      sidebarData.links.map((link) => ({
        ...link,
        active: pathname === link.link,
      })),
    [pathname]
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

export default FoSidebar