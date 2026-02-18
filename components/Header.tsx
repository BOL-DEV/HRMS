import React from 'react'
import { FaUser } from "react-icons/fa";

interface Props {
    title: string;
    Subtitle: string;
  actions?: React.ReactNode;
}

function Header(props: Props) {
  const { title, Subtitle, actions } = props;

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold md:pl-0 pl-12">{title}</h1>
        <p className="hidden text-sm text-gray-600 md:block">{Subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {actions}

        <div className="flex items-center">
          <h1 className="mr-2 hidden text-sm font-medium md:block">
            Habeeb Bolaji
          </h1>
          <span className="rounded-full bg-blue-200 p-3">
            <FaUser className="text-lg text-blue-500" />
          </span>
        </div>
      </div>
    </nav>
  );
}

export default Header
