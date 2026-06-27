import { Suspense } from "react";
import AdminCatalogWorkspace from "@/components/AdminCatalogWorkspace";

export default function CatalogDashboardPage() {
  return (
    <Suspense fallback={null}>
      <AdminCatalogWorkspace />
    </Suspense>
  );
}
