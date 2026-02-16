import React from 'react'

interface Props {

    title: string;
    links: {
        name: string;
        link: string;
        label: React.ReactNode;
        active?: boolean;
    }[];
}





function Sidebar({ title, links }: Props) {
    

    return (
        <div className='h-screen w-64 border-r border-gray-200'>
            <h1 className='p-8 text-xl font-bold border-b border-gray-200'>{title}</h1>
            <ul className='flex flex-col gap-2 p-2 pt-8'>
                {links.map((link) => (
                     <a href={link.link} key={link.name}>
                    <li className={`p-4 hover:bg-gray-300 rounded-xl font-medium ${link.active ? 'bg-blue-800 text-white' : ''}`}>
                           <span className='text-xl'>{link.label}</span> {link.name}
                    </li>
                    </a>
                ))}
            </ul>
        </div>
    )
}

export default Sidebar
