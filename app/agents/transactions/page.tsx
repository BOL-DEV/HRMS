import Header from "@/components/Header";
import React from "react";

function Page() {
  return (
    <div className="h-screen w-full bg-gray-100">
      <Header
        title="Transactions"
        Subtitle="Create and manage patient payments"
      />
      Agent Transactions
    </div>
  );
}

export default Page;
