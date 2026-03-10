import Header from "@/components/Header";
import StatCard from "@/components/StatCard";

import TransactionActionBar from "@/components/TransactionActionBar";

import TransactionList from "@/components/TransactionList";
import { transactions } from "@/libs/data";
import { formatNaira } from "@/libs/helper";
import { FiCircle, FiCreditCard, FiHash, FiInbox } from "react-icons/fi";

function Page() {
  const count = transactions.length;

  const amountTotal = 2000000;
  const currentBalance = 3000000;
  const lastWalletCredit = 5000000;

  // const amountTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

  // const currentBalance = transactions.reduce((balance, t) => {
  //   if (t.status === "Paid") return balance + t.amount;
  //   if (t.status === "Refund" || t.status === "Refunded") return balance - t.amount;
  //   return balance;
  // }, 0);

  // const lastWalletCredit =
  //   transactions.find((t) => t.status === "Paid")?.amount ?? 0;

  const stats = [
    {
      title: "Current Balance",
      value: formatNaira(currentBalance),
      icon: <FiCircle className="text-xl" />,
    },
    {
      title: "Last Wallet Credit",
      value: formatNaira(lastWalletCredit),
      icon: <FiCreditCard className="text-xl" />,
    },
    {
      title: "Amount",
      value: formatNaira(amountTotal),
      icon: <FiInbox className="text-xl" />,
    },
    {
      title: "Count",
      value: String(count),
      icon: <FiHash className="text-xl" />,
    },
  ];

  return (
    <div className="h-screen w-full bg-gray-100 overflow-y-auto">
      <Header
        title="Transactions"
        Subtitle="Create and manage patient payments"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {stats.map((s) => (
            <StatCard
              key={s.title}
              title={s.title}
              value={s.value}
              icon={s.icon}
            />
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <TransactionActionBar />

          <TransactionList />
        </div>
      </div>
    </div>
  );
}

export default Page;
