import CatalogAccessGate from "@/components/catalog/CatalogAccessGate";
import CatalogSidebar from "@/components/catalog/CatalogSidebar";
import { CatalogWorkspaceProvider } from "@/components/catalog/CatalogWorkspaceProvider";
import type { ReactNode } from "react";

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return (
    <CatalogAccessGate>
      <CatalogWorkspaceProvider>
        <div className="min-h-screen bg-canvas text-slate-900 dark:text-slate-100">
          <main className="flex">
            <CatalogSidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </main>
        </div>
      </CatalogWorkspaceProvider>
    </CatalogAccessGate>
  );
}
