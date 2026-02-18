import Header from "@/components/Header";

import TransactionActionBar from "@/components/TransactionActionBar";

import TransactionList from "@/components/TransactionList";

function Page() {
  return (
    <div className="h-screen w-full bg-gray-100 overflow-y-auto">
      <Header
        title="Transactions"
        Subtitle="Create and manage patient payments"
      />

      <div className="p-6 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <TransactionActionBar />

          <TransactionList />
        </div>
      </div>
    </div>
  );
}

export default Page;
