import React from 'react'
import ThemeToggle from "./ThemeToggle";

interface Props {
  title: string;
  links: {
    name: string;
    link: string;
    label: React.ReactNode;
    active?: boolean;
  }[];
  isOpen?: boolean;
}

function Sidebar({ title, links, isOpen }: Props) {
  const mobileState = isOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200 bg-white shadow-sm transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 ${mobileState}  md:translate-x-0 md:shadow-none md:block md:sticky md:top-0 md:h-screen md:overflow-y-auto`}
    >
      <div className="flex h-full flex-col">
        <h1 className="border-b border-gray-200 p-8 text-xl font-bold text-gray-900 dark:border-slate-800 dark:text-slate-100">
          {title}
        </h1>

        <ul className="flex flex-col gap-2 p-2 pt-8">
          {links.map((link) => (
            <a href={link.link} key={link.name}>
              <li
                className={`rounded-xl p-4 font-medium transition ${
                  link.active
                    ? "bg-blue-800 text-white hover:bg-blue-700"
                    : "text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <span className="text-xl">{link.label}</span> {link.name}
              </li>
            </a>
          ))}
        </ul>

        <div className="mt-auto border-t border-gray-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar
