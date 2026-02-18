import FoSidebar from '@/components/FoSidebar';
import React from 'react';


interface Props {
  children: React.ReactNode;
}



export default function FoLayout({ children }: Props) {



  return (
    <div>
      <main className="flex">
        <FoSidebar />
        {children}
      </main>
    </div>
  );
}
