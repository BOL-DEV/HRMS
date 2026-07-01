import React from "react";
import HeaderAgentProfile from "@/components/shared/HeaderAgentProfile";
import HeaderHospitalBrand from "@/components/shared/HeaderHospitalBrand";

interface Props {
  title: string;
  Subtitle: string;
  actions?: React.ReactNode;
}

function Header(props: Props) {
  const { title, Subtitle, actions } = props;

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line-subtle bg-panel/95 px-5 py-4 backdrop-blur-sm dark:bg-panel/92">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-bold text-gray-900 md:pl-0 pl-12 dark:text-slate-100">
          {title}
        </h1>
        <p className="hidden text-sm text-gray-600 md:block dark:text-slate-400">
          {Subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <HeaderHospitalBrand />
        <HeaderAgentProfile />
      </div>
    </nav>
  );
}

export default Header;
