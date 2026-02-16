import Header from "@/components/Header";
import React from "react";

function Page() {
  return (
    <div className="h-screen w-full bg-gray-100">
      <Header
        title="Patients"
        Subtitle="Manage patient records and view billing history"
      />
      Agent Patients
    </div>
  );
}

export default Page;
