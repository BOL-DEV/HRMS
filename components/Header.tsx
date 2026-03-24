import React from "react";
import HeaderAgentProfile from "@/components/HeaderAgentProfile";

interface Props {
  title: string;
  Subtitle: string;
  actions?: React.ReactNode;
}

function Header(props: Props) {
  const { title, Subtitle, actions } = props;

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold text-gray-900 md:pl-0 pl-12 dark:text-slate-100">
          {title}
        </h1>
        <p className="hidden text-sm text-gray-600 md:block dark:text-slate-400">
          {Subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {actions}

        <HeaderAgentProfile />
      </div>
    </nav>
  );
}

export default Header;
