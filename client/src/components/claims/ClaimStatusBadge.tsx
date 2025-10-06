interface ClaimStatusBadgeProps {
  status: 'Approved' | 'Pending' | 'Rejected' | 'Under Review';
}

export default function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
      {status}
    </span>
  );
}

