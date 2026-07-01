import AdminSidebar from '@/components/admin/AdminSidebar';
import React from 'react';


interface Props {
  children: React.ReactNode;
}



export default function AdminLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-canvas">
      <main className="flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}
