interface ClaimStatusBadgeProps {
  status: "Pending" | "Approved" | "Rejected";
}

export default function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 border border-green-200 font-semibold";
      case "Rejected":
        return "bg-red-100 text-red-700 border border-red-200 font-semibold";
      case "Pending":
      default:
        return "bg-amber-100 text-amber-700 border border-amber-200 font-semibold";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${getStatusColor()}`}
    >
      <span
        className={`w-2 h-2 rounded-full mr-2 ${
          status === "Approved"
            ? "bg-green-600"
            : status === "Rejected"
            ? "bg-red-600"
            : "bg-amber-600"
        }`}
      />
      {status}
    </span>
  );
}
