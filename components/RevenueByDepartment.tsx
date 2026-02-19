"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import RevenueBarChart from "./RevenueBarChart";

// type DepartmentData = {
//   name: string;
//   value: number;
// };



const departmentRevenue = [
  { name: "Surgery", value: 45200 },
  { name: "Cardiology", value: 33200 },
  { name: "Neurology", value: 28800 },
  { name: "Orthopedics", value: 25400 },
  { name: "Pediatrics", value: 21400 },
];

const formatValue = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

function RevenueByDepartment() {
    const data = departmentRevenue.map((dept) => ({
        name: dept.name,
        value: dept.value,
    }));
  return (
  <RevenueBarChart title="Revenue by Department" subtitle="Top performing departments" data={data} />
  );
}

export default RevenueByDepartment;
