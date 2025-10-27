'use client';

import { useState, useMemo, useEffect } from 'react';
import employeesData from '@/data/employees.json';
import AddEmployeeModal from '@/components/corporate/AddEmployeeModal';
import { EmployeeFormData } from '@/components/forms/EmployeeForm';

export default function CorporateEmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [employees, setEmployees] = useState<EmployeeFormData[]>(employeesData);
  const [employeeToRemove, setEmployeeToRemove] = useState<EmployeeFormData | null>(null);
  const [removedEmployeeMessage, setRemovedEmployeeMessage] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter employees based on search term and department
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment !== 'All Departments') {
      filtered = filtered.filter(employee => {
        if (selectedDepartment === 'Human Resources' && employee.department === 'People') return true;
        return employee.department === selectedDepartment;
      });
    }

    return filtered;
  }, [searchTerm, selectedDepartment, employees]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);

  const displayedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, employees]);

  const handleRemoveClick = (employee: EmployeeFormData) => {
    setEmployeeToRemove(employee);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Add Employee
          </button>
          <button
            onClick={() => setIsRemoveMode(prev => !prev)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isRemoveMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            − Remove Employee
          </button>
        </div>
      </div>

      {removedEmployeeMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
          {removedEmployeeMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Policies</p>
          <p className="text-2xl font-bold text-green-600">{employees.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending Enrollment</p>
          <p className="text-2xl font-bold text-orange-600">0</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <select 
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option>All Departments</option>
              <option>R&D</option>
              <option>Product</option>
              <option>Finance</option>
              <option>Human Resources</option>
              <option>IT</option>
              <option>Engineering</option>
              <option>Sales</option>
              <option>Logistics</option>
              <option>Production</option>
              <option>Design</option>
              <option>Customer</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Status</th>
                {isRemoveMode && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remove</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedEmployees.length > 0 ? (
                displayedEmployees.map((employee) => (
                  <tr key={employee.employeeNumber} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.employeeNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.designation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    {isRemoveMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleRemoveClick(employee)}
                          title="Remove Employee"
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white text-2xl hover:bg-red-700 transition-colors"
                        >
                          &minus;
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isRemoveMode ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                    No employees found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, filteredEmployees.length)}</span> of{' '}
            <span className="font-medium">{filteredEmployees.length}</span> employees
            {filteredEmployees.length !== employees.length && (
              <span className="text-gray-500"> (filtered from {employees.length} total)</span>
            )}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === i + 1
                    ? 'bg-purple-600 text-white border border-purple-600'
                    : 'bg-white text-gray-500 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEmployee={(employeeData) => {
          setEmployees(prev => [...prev, employeeData]);
          alert(`Employee ${employeeData.name} added successfully!`);
        }}
      />

      {/* Remove Confirmation Modal */}
      {employeeToRemove && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
              <h2 className="text-lg font-bold text-black text-center">Confirm Removal</h2>
            </div>
            <div className="p-6 text-black">
              <p className="mb-6 text-center">
                Are you sure you want to remove <span className="font-semibold">{employeeToRemove.name}</span>?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setEmployeeToRemove(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-black hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setEmployees(prev => prev.filter(emp => emp.employeeNumber !== employeeToRemove.employeeNumber));
                    setRemovedEmployeeMessage(`Employee ${employeeToRemove.name} removed successfully!`);
                    setEmployeeToRemove(null);
                    setTimeout(() => setRemovedEmployeeMessage(null), 3000);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
