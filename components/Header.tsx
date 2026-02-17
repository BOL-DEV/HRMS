import React from 'react'
import { FaUser } from "react-icons/fa";

interface Props {
    title: string;
    Subtitle: string;
  actions?: React.ReactNode;
}

function Header(props: Props) {
  const { title, Subtitle, actions } = props

    return (
      <nav className="bg-white p-5 flex justify-between items-center border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p>{Subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          {actions}

          <div className="flex items-center">
            <h1 className="mr-2 text-sm font-medium">Habeeb Bolaji</h1>
            <span className="p-3 bg-blue-200 rounded-full">
              <FaUser className="text-blue-500 text-lg" />
            </span>
          </div>
        </div>
      </nav>
    );
}

export default Header
