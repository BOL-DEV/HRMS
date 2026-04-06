import StatCard from "@/components/StatCard";
import { FiCheckCircle, FiClock, FiFileText, FiXCircle } from "react-icons/fi";

type Props = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

function AdminHospitalReceiptsSummaryCards({
  total,
  pending,
  approved,
  rejected,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <StatCard
        title="Total Requests"
        value={String(total)}
        icon={<FiFileText className="text-xl" />}
      />
      <StatCard
        title="Pending"
        value={String(pending)}
        icon={<FiClock className="text-xl" />}
      />
      <StatCard
        title="Approved"
        value={String(approved)}
        icon={<FiCheckCircle className="text-xl" />}
      />
      <StatCard
        title="Rejected"
        value={String(rejected)}
        icon={<FiXCircle className="text-xl" />}
      />
    </div>
  );
}

export default AdminHospitalReceiptsSummaryCards;
