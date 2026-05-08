import FoSidebar from '@/components/FoSidebar';
import React from 'react';


interface Props {
  children: React.ReactNode;
}



export default function FoLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-canvas text-slate-900 dark:text-slate-100">
      <main className="flex">
        <FoSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}
