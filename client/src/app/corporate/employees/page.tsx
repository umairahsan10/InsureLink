'use client';

import { useState, useMemo, useEffect } from 'react';
import employeesData from '@/data/employees.json';
import AddEmployeeModal from '@/components/corporate/AddEmployeeModal';
import { Employee } from '@/types/employee';
import DependentRequestsTable from '@/components/corporate/DependentRequestsTable';
import DependentReviewModal from '@/components/corporate/DependentReviewModal';
import EmployeeDependentsModal from '@/components/corporate/EmployeeDependentsModal';
import { getDependentsFromStorage, getPendingDependentRequests, getDependentsByEmployee } from '@/utils/dependentHelpers';
import { Dependent } from '@/types/dependent';
import dependentsData from '@/data/dependents.json';

export default function CorporateEmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(employeesData as Employee[]);
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(null);
  const [removedEmployeeMessage, setRemovedEmployeeMessage] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'employees' | 'requests'>('employees');
  
  // Dependent management state
  const [pendingRequests, setPendingRequests] = useState<Dependent[]>([]);
  const [selectedDependent, setSelectedDependent] = useState<Dependent | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<{name: string, dependents: Dependent[]} | null>(null);
  const [isDependentsModalOpen, setIsDependentsModalOpen] = useState(false);

  // Mock current corporate ID
  const currentCorporateId = 'corp-001';

  // Initialize localStorage with seed data on first load
  useEffect(() => {
    const existing = getDependentsFromStorage();
    if (existing.length === 0) {
      localStorage.setItem('insurelink_dependents', JSON.stringify(dependentsData));
    }
    loadPendingRequests();
  }, []);

  const loadPendingRequests = () => {
    const requests = getPendingDependentRequests(currentCorporateId);
    setPendingRequests(requests);
  };

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

  const handleRemoveClick = (employee: Employee) => {
    setEmployeeToRemove(employee);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employees</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-initial bg-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base"
          >
            + Add Employee
          </button>
          <button 
            onClick={() => {
              // Redirect to bulk upload functionality - for now simple placeholder
              alert('Bulk Upload coming soon! Use the + Add Employee button for now.');
            }}
            className="flex-1 sm:flex-initial bg-green-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
          >
            📤 Bulk Upload
          </button>
          <button
            onClick={() => setIsRemoveMode(prev => !prev)}
            className={`flex-1 sm:flex-initial px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{employees.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Policies</p>
          <p className="text-xl md:text-2xl font-bold text-green-600">{employees.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending Dependent Requests</p>
          <p className="text-xl md:text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
              activeTab === 'requests'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dependent Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
{activeTab === 'employees' ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm md:text-base text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <select 
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm md:text-base text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dependents</th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Status</th>
                    {isRemoveMode && <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remove</th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedEmployees.length > 0 ? (
                    displayedEmployees.map((employee) => {
                      const employeeId = employee.id;
                      const dependents = getDependentsByEmployee(employeeId);
                      const dependentCount = dependents.length;
                      
                      return (
                        <tr key={employee.employeeNumber} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.employeeNumber}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.designation}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.email}</td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedEmployeeForView({ name: employee.name, dependents });
                                setIsDependentsModalOpen(true);
                              }}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              👥 {dependentCount}
                            </button>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          {isRemoveMode && (
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={isRemoveMode ? 8 : 7} className="px-4 md:px-6 py-8 text-center text-gray-500">
                        No employees found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-4">
            <DependentRequestsTable
              requests={pendingRequests}
              onReview={(dependent) => {
                setSelectedDependent(dependent);
                setIsReviewModalOpen(true);
              }}
            />
          </div>
        )}
        
        {/* Pagination - only show for employees tab */}
        {activeTab === 'employees' && (
          <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs md:text-sm text-gray-700 text-center sm:text-left">
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
                className="px-2 md:px-3 py-1 text-xs md:text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              <div className="hidden sm:flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-md ${
                      currentPage === i + 1
                        ? 'bg-purple-600 text-white border border-purple-600'
                        : 'bg-white text-gray-500 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 md:px-3 py-1 text-xs md:text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEmployee={(employeeData) => {
          // Generate ID for new employee
          const newEmployee: Employee = {
            ...employeeData,
            id: `emp-${Date.now()}`,
            coverageStart: '2025-01-01',
            coverageEnd: '2025-12-31',
            corporateId: 'corp-001'
          };
          setEmployees(prev => [...prev, newEmployee]);
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

      {/* Dependent Review Modal */}
      <DependentReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedDependent(null);
        }}
        dependent={selectedDependent}
        onSuccess={() => {
          loadPendingRequests();
        }}
      />

      {/* Employee Dependents View Modal */}
      {selectedEmployeeForView && (
        <EmployeeDependentsModal
          isOpen={isDependentsModalOpen}
          onClose={() => {
            setIsDependentsModalOpen(false);
            setSelectedEmployeeForView(null);
          }}
          employeeName={selectedEmployeeForView.name}
          dependents={selectedEmployeeForView.dependents}
        />
      )}
    </div>
  );
}
