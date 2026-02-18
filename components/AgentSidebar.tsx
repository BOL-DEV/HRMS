"use client";

import { usePathname } from "next/navigation";
import { FaRegChartBar } from "react-icons/fa";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { GrDocumentCloud } from "react-icons/gr";
import { GrDocumentStore } from "react-icons/gr";
import { BsReceipt } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import Sidebar from "./Sidebar";

const sidebarData = {
  title: "Agents",
  links: [
    {
      name: "Dashboard",
      link: "/agents/dashboard",
      label: <FaRegChartBar className="inline mr-2" />,
      active: true,
    },
    {
      name: "Patients",
      link: "/agents/patients",
      label: <MdOutlinePeopleAlt className="inline mr-2" />,
      active: false,
    },
    {
      name: "Transactions",
      link: "/agents/transactions",
      label: <GrDocumentCloud className="inline mr-2" />,
      active: false,
    },
    {
      name: "Receipts",
      link: "/agents/receipts",
      label: <BsReceipt className="inline mr-2" />,
      active: false,
    },
    // {
    //   name: "Reports",
    //   link: "/agents/reports",
    //   label: <GrDocumentStore className="inline mr-2" />,
    //   active: false,
    // },
    {
      name: "Settings",
      link: "/agents/settings",
      label: <IoSettingsOutline className="inline mr-2" />,
      active: false,
    },
  ],
};


const AgentSidebar = () => {
    const { title, links } = sidebarData;
   const pathname = usePathname();

    links.forEach((link) => {
        if (pathname === link.link) {
            link.active = true;
        } else {
            link.active = false;
        }
    });


    return (
        <Sidebar title={title} links={links}/>
    )
}

export default AgentSidebar