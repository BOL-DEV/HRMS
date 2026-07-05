import React from "react";
import PharmacySidebar from "@/components/pharmacy/PharmacySidebar";

interface Props {
  children: React.ReactNode;
}

export default function PharmacyLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-canvas text-slate-900 dark:text-slate-100">
      <main className="flex">
        <PharmacySidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}
