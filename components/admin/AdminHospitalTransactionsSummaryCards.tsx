import StatCard from "@/components/shared/StatCard";
import { formatNaira } from "@/libs/helper";
import { FiActivity, FiCreditCard } from "react-icons/fi";

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
        icon={<FiActivity className="text-xl" />}
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
