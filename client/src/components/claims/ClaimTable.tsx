interface Claim {
  id: string;
  patient: string;
  date: string;
  amount: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Under Review';
}

interface ClaimTableProps {
  claims: Claim[];
}

export default function ClaimTable({ claims }: ClaimTableProps) {
  const getStatusColor = (status: Claim['status']) => {
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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {claims.map((claim) => (
            <tr key={claim.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{claim.id}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{claim.patient}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{claim.date}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{claim.amount}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(claim.status)}`}>
                  {claim.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <button className="text-blue-600 hover:text-blue-800">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

