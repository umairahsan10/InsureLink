interface ClaimStatusBadgeProps {
  status: "Pending" | "Approved" | "Rejected";
}

export default function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}
    >
      {status}
    </span>
  );
}
