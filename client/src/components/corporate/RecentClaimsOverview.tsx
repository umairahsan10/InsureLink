"use client";

interface ClaimData {
  employee: string;
  claimId: string;
  amount: string;
  hospital: string;
  date: string;
  status: "Approved" | "Pending" | "Paid";
}

interface RecentClaimsOverviewProps {
  claims: ClaimData[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Pending":
      return "bg-orange-100 text-orange-800";
    case "Paid":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// const getStatusDot = (status: string) => {
//   switch (status) {
//     case 'Approved':
//       return '🟢';
//     case 'Pending':
//       return '🟠';
//     case 'Paid':
//       return '🔵';
//     default:
//       return '⚪';
//   }
// };

export default function RecentClaimsOverview({
  claims,
}: RecentClaimsOverviewProps) {
  const handleExportReport = () => {
    const headers = [
      "Employee",
      "Claim ID",
      "Amount",
      "Hospital",
      "Date",
      "Status",
    ];
    const rows = claims.map((claim) => [
      claim.employee,
      claim.claimId,
      claim.amount,
      claim.hospital,
      claim.date,
      claim.status,
    ]);

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "corporate-claims-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-8">
      <div className="p-5 md:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl md:text-xl font-semibold text-gray-900">
            Recent Claims Overview
          </h2>
          <button
            onClick={handleExportReport}
            className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>📄</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Claim ID
              </th>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Hospital
              </th>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {claims.map((claim, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {claim.employee}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap text-sm text-gray-500">
                  {claim.claimId}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap text-sm text-gray-500">
                  {claim.amount}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[150px] md:max-w-none">
                  {claim.hospital}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap text-sm text-gray-500">
                  {claim.date}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {/* <span className="mr-2 text-base">{getStatusDot(claim.status)}</span> */}
                    <span
                      className={`inline-flex px-2.5 py-1.5 text-sm font-semibold rounded-full ${getStatusColor(
                        claim.status
                      )}`}
                    >
                      {claim.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
