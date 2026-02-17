import Header from "@/components/Header";
import PatientActionBar from "@/components/PatientActionBar";
import PatientLists from "@/components/PatientLists";

function Page() {
  return (
    <div className="h-screen w-full bg-gray-100 overflow-y-auto">
      <Header
        title="Patients"
        Subtitle="Manage patient records and view billing history"
      />

      <div className="p-6 space-y-6">
        <PatientActionBar />
        <PatientLists />
      </div>
    </div>
  );
}

export default Page;
