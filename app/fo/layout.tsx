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
        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}
