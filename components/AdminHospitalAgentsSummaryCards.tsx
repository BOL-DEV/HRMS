import StatCard from "@/components/StatCard";
import { formatNaira } from "@/libs/helper";
import { FiDollarSign, FiUsers } from "react-icons/fi";
import { LuWallet } from "react-icons/lu";

type Props = {
  totalAgents: number;
  totalBalance: number;
  totalRevenue: number;
};

function AdminHospitalAgentsSummaryCards({
  totalAgents,
  totalBalance,
  totalRevenue,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        title="Total Agents"
        value={String(totalAgents)}
        icon={<FiUsers className="text-xl" />}
      />
      <StatCard
        title="Combined Balance"
        value={formatNaira(totalBalance)}
        icon={<LuWallet className="text-xl" />}
      />
      <StatCard
        title="Total Revenue Made"
        value={formatNaira(totalRevenue)}
        icon={<FiDollarSign className="text-xl" />}
      />
    </div>
  );
}

export default AdminHospitalAgentsSummaryCards;
