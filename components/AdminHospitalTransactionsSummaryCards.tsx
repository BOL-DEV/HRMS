import StatCard from "@/components/StatCard";
import { formatNaira } from "@/libs/helper";
import { FiCreditCard, FiDollarSign } from "react-icons/fi";

type Props = {
  totalRevenue: number;
  transactionCount: number;
};

function AdminHospitalTransactionsSummaryCards({
  totalRevenue,
  transactionCount,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <StatCard
        title="Total Revenue"
        value={formatNaira(totalRevenue)}
        icon={<FiDollarSign className="text-xl" />}
      />
      <StatCard
        title="Transaction Count"
        value={String(transactionCount)}
        icon={<FiCreditCard className="text-xl" />}
      />
    </div>
  );
}

export default AdminHospitalTransactionsSummaryCards;
