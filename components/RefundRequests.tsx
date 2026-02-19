import StatusPill from "@/components/StatusPill";
import { RefundRequest } from "@/libs/type";
import { formatUsd } from "@/libs/helper";

type Props = {
  requests?: RefundRequest[];
};

const refundRequests: RefundRequest[] = [
  {
    id: "r1",
    patient: "Emma Wilson",
    agent: "Patricia",
    reason: "Duplicate charge",
    amount: 150,
    status: "Pending",
  },
  {
    id: "r2",
    patient: "Thomas Gray",
    agent: "Marcus",
    reason: "Service not rendered",
    amount: 200,
    status: "Pending",
  },
  {
    id: "r3",
    patient: "Jessica Lee",
    agent: "James",
    reason: "Quality issue",
    amount: 300,
    status: "Pending",
  },
];

function RefundRequests({ requests = refundRequests }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl h-full flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <h2 className="text-xl font-bold">Recent Refund Requests</h2>
        <p className="text-sm text-gray-600">
          {requests.length} pending approvals
        </p>
      </div>

      <div className="p-5 space-y-4">
        {requests.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {item.patient}
                </p>
                <p className="text-sm text-gray-500">Agent {item.agent}</p>
              </div>
              <StatusPill status={item.status} />
            </div>

            <p className="text-sm text-gray-600">{item.reason}</p>

            <div className="flex items-center justify-between">
              <p className="text-blue-700 font-semibold">
                {formatUsd(item.amount)}
              </p>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50">
                Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RefundRequests;
