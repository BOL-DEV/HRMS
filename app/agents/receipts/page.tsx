import Header from "@/components/Header";
import React from "react";

function Page() {
  return (
    <div className="h-screen w-full bg-gray-100">
      <Header title="Receipts" Subtitle="View and reprint patient receipts" />
      Agent Receipts
    </div>
  );
}

export default Page;
