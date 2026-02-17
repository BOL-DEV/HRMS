import Header from "@/components/Header";
import ReceiptActionBar from "@/components/ReceiptActionBar";
import ReceiptLists from "@/components/ReceiptLists";

function Page() {
  return (
    <div className="h-screen w-full bg-gray-100 overflow-y-auto">
      <Header title="Receipts" Subtitle="View and reprint patient receipts" />

      <div className="p-6 space-y-6">
        <ReceiptActionBar />
        <ReceiptLists />
      </div>
    </div>
  );
}

export default Page;
