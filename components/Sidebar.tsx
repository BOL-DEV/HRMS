import React from 'react'

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
      className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200 bg-white shadow-sm transition-transform duration-200 ${mobileState}  md:translate-x-0 md:shadow-none md:block md:sticky md:top-0 md:h-screen md:overflow-y-auto`}
    >
      <h1 className="border-b border-gray-200 p-8 text-xl font-bold">
        {title}
      </h1>
      <ul className="flex flex-col gap-2 p-2 pt-8">
        {links.map((link) => (
          <a href={link.link} key={link.name}>
            <li
              className={`rounded-xl p-4 font-medium hover:bg-gray-100 ${link.active ? "bg-blue-800 text-white hover:bg-blue-700" : ""}`}
            >
              <span className="text-xl">{link.label}</span> {link.name}
            </li>
          </a>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar
