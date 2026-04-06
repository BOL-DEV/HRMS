import StatCard from "@/components/StatCard";
import { FiGrid } from "react-icons/fi";

type Props = {
  totalDepartments: number;
};

function AdminHospitalDepartmentsSummaryCard({ totalDepartments }: Props) {
  return (
    <div className="max-w-sm">
      <StatCard
        title="Total Departments"
        value={String(totalDepartments)}
        icon={<FiGrid className="text-xl" />}
      />
    </div>
  );
}

export default AdminHospitalDepartmentsSummaryCard;
