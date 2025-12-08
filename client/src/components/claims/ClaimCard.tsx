import ClaimStatusBadge from "./ClaimStatusBadge";

interface ClaimCardProps {
  id: string;
  patient: string;
  date: string;
  amount: string;
  status: "Approved" | "Pending" | "Rejected" | string;
  description?: string;
}

export default function ClaimCard({
  id,
  patient,
  date,
  amount,
  status,
  description,
}: ClaimCardProps) {
  const normalizedStatus: "Approved" | "Pending" | "Rejected" =
    status === "Approved"
      ? "Approved"
      : status === "Rejected"
      ? "Rejected"
      : "Pending";
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{id}</h3>
          <p className="text-sm text-gray-600">{patient}</p>
        </div>
        <ClaimStatusBadge status={normalizedStatus} />
      </div>

      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}

      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">Date</p>
          <p className="text-sm font-medium">{date}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Amount</p>
          <p className="text-lg font-bold text-blue-600">{amount}</p>
        </div>
      </div>

      <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
        View Details
      </button>
    </div>
  );
}
