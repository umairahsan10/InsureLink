'use client';

import { useState, useEffect } from 'react';
import employeesData from '@/data/employees.json';
import { getDependentsByEmployee, getApprovedDependents } from '@/utils/dependentHelpers';
import EmployeeDependentsModal from '@/components/corporate/EmployeeDependentsModal';
import { Dependent } from '@/types/dependent';

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  department: string;
  designation: string;
  email: string;
}

interface CorporateEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  corporateId: string;
  corporateName: string;
}

export default function CorporateEmployeesModal({ 
  isOpen, 
  onClose, 
  corporateId,
  corporateName 
}: CorporateEmployeesModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<{name: string, dependents: Dependent[]} | null>(null);
  const [isDependentsModalOpen, setIsDependentsModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Filter employees for this corporate
      const corporateEmployees = employeesData.filter(
        emp => emp.corporateId === corporateId
      );
      setEmployees(corporateEmployees as Employee[]);
    }
  }, [isOpen, corporateId]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-300 sticky top-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {corporateName} - Employees
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {employees.length} {employees.length === 1 ? 'employee' : 'employees'} registered
                </p>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {employees.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
                <p className="mt-1 text-sm text-gray-500">This corporate has no registered employees</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dependents
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => {
                      const dependents = getApprovedDependents(employee.id);
                      return (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {employee.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.employeeNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.designation}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedEmployee({ name: employee.name, dependents });
                                setIsDependentsModalOpen(true);
                              }}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              👥 {dependents.length}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Employee Dependents Modal */}
      {selectedEmployee && (
        <EmployeeDependentsModal
          isOpen={isDependentsModalOpen}
          onClose={() => {
            setIsDependentsModalOpen(false);
            setSelectedEmployee(null);
          }}
          employeeName={selectedEmployee.name}
          dependents={selectedEmployee.dependents}
        />
      )}
    </>
  );
}

