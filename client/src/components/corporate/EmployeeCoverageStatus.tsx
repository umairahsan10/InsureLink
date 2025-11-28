"use client";

import { useRouter } from "next/navigation";

interface EmployeeCoverageData {
  name: string;
  cnic: string;
  department: string;
  coverageUsed: number;
  totalCoverage: string;
}

interface EmployeeCoverageStatusProps {
  employees: EmployeeCoverageData[];
}

export default function EmployeeCoverageStatus({
  employees,
}: EmployeeCoverageStatusProps) {
  const router = useRouter();

  const handleViewAll = () => {
    router.push("/corporate/employees");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 md:mb-8">
      <div className="p-5 md:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl md:text-xl font-semibold text-gray-900">
            Employee Coverage Status
          </h2>
          <button
            onClick={handleViewAll}
            className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>👁️</span>
            <span>View All</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Employee Name
              </th>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                CNIC
              </th>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Coverage Used
              </th>
              <th className="px-4 md:px-6 py-3 md:py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Total Coverage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {employee.name}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.cnic}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.department}
                </td>
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 md:w-20 bg-gray-200 rounded-full h-2.5 md:h-2 mr-3">
                      <div
                        className="bg-purple-600 h-2.5 md:h-2 rounded-full"
                        style={{ width: `${employee.coverageUsed}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">
                      {employee.coverageUsed}%
                    </span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 md:py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.totalCoverage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
