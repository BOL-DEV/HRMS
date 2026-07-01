import { ReceiptRow } from "@/libs/type";
import { formatUsd } from "@/libs/helper";

type Props = {
  receipt: ReceiptRow;
};

export default function PrintReceipt({ receipt }: Props) {
  return (
    <div className="hidden print:block p-6 text-gray-900">
      <div className="border rounded-xl p-4">
        <h1 className="text-lg font-semibold mb-2">
          {receipt.receiptId ? `Receipt ${receipt.receiptId}` : "Receipt"}
        </h1>
        <p className="text-sm text-gray-500">Invoice: {receipt.invoiceNo}</p>
        <p className="text-sm text-gray-500">Issued: {receipt.issuedAt ?? "—"}</p>
      </div>

      <div className="h-3" />

      <div className="border rounded-xl p-4">
        <h2 className="text-sm font-medium mb-2">Patient</h2>

        <div className="flex justify-between my-2">
          <span>Name</span>
          <strong>{receipt.patientName}</strong>
        </div>

        <div className="flex justify-between my-2">
          <span>Payment Method</span>
          <strong>{receipt.paymentMethod}</strong>
        </div>

        <div className="flex justify-between my-2">
          <span>Amount</span>
          <strong>{formatUsd(receipt.amount)}</strong>
        </div>
      </div>
    </div>
  );
}