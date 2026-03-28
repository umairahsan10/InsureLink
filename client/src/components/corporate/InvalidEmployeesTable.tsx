import { useState, useEffect } from 'react';
import { employeesApi } from '@/lib/api/employees';
import { corporatesApi } from '@/lib/api/corporates';
import { insurersApi } from '@/lib/api/insurers';

interface InvalidEmployee {
  id: string;
  uploadId: string;
  fileName: string;
  uploadedAt: string;
  errors: string[];
  data: {
    employeeNumber: string;
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    password: string;
    designation: string;
    department: string;
    planId: string;
    coverageStartDate: string;
    coverageEndDate: string;
    dob?: string;
    cnic?: string;
  };
}

interface InvalidEmployeesTableProps {
  corporateId: string;
  reloadKey?: number;
  contractStartDate?: string;
  contractEndDate?: string;
}

export default function InvalidEmployeesTable({ corporateId, reloadKey, contractStartDate, contractEndDate }: InvalidEmployeesTableProps) {
  const [invalidEmployees, setInvalidEmployees] = useState<InvalidEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InvalidEmployee | null>(null);
  const [form, setForm] = useState<any>(null);
  const [resubmitting, setResubmitting] = useState<string | null>(null);
  const [existingEmployeeMap, setExistingEmployeeMap] = useState<Record<string, any>>({});
  const [existingEmailMap, setExistingEmailMap] = useState<Record<string, any>>({});
  const [plans, setPlans] = useState<any[]>([]);
  const [planMap, setPlanMap] = useState<Record<string, any>>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  // Map of duplicate employee numbers to their existing employee details
  const [duplicateEmployeeDetails, setDuplicateEmployeeDetails] = useState<Record<string, any>>({});
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'single' | 'all'>('single');
  const [recordToDelete, setRecordToDelete] = useState<InvalidEmployee | null>(null);
  // For plan-specific coverage date range
  const [planCoverageRange, setPlanCoverageRange] = useState<{ min?: string; max?: string }>({});

  // Ensure planCoverageRange is always in sync with form.planId and planMap
  useEffect(() => {
    if (editing && form && form.planId && planMap[form.planId]) {
      const plan = planMap[form.planId];
      // Support both camelCase and snake_case for validFrom/validUntil
      const min = plan.validFrom || plan.valid_from || '';
      const max = plan.validUntil || plan.valid_until || '';
      if (min && max) {
        if (planCoverageRange.min !== min || planCoverageRange.max !== max) {
          setPlanCoverageRange({ min, max });
        }
      } else {
        setPlanCoverageRange({});
      }
    } else {
      setPlanCoverageRange({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.planId, planMap, editing]);

  useEffect(() => {
    loadInvalidEmployees();
  }, [corporateId, reloadKey]);

  const loadExistingEmployees = async () => {
    try {
      const response = await employeesApi.list({
        corporateId,
        page: 1,
        limit: 1000,
      });
      const map: Record<string, any> = {};
      const emailMap: Record<string, any> = {};
      response.items.forEach((emp: any) => {
        map[emp.employeeNumber] = emp;
        if (emp.email) {
          emailMap[emp.email.toLowerCase()] = emp;
        }
      });
      setExistingEmployeeMap(map);
      setExistingEmailMap(emailMap);
    } catch (error) {
      console.error('Failed to load existing employees:', error);
    }
  };

  const loadPlans = async () => {
    if (!corporateId) return;
    
    try {
      const corporate = await corporatesApi.getCorporateById(corporateId);
      const plansList = await insurersApi.getPlans(corporate.insurerId, true);
      setPlans(plansList);
      
      const map: Record<string, any> = {};
      plansList.forEach((plan: any) => {
        map[plan.id] = plan;
      });
      setPlanMap(map);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadInvalidEmployees = async () => {
    try {
      const data = await employeesApi.getInvalidUploads(corporateId);
      setInvalidEmployees(data);
      await Promise.all([
        loadExistingEmployees(),
        loadPlans()
      ]);

      // Prefetch existing employees for duplicate numbers
      const duplicateNumbers = data
        .filter((emp: any) => emp.errors.some((e: string) => e.includes('Duplicate employeeNumber')))
        .map((emp: any) => emp.data.employeeNumber);
      const detailsMap: Record<string, any> = {};
      for (const empNum of duplicateNumbers) {
        try {
          const existing = await employeesApi.findByEmployeeNumber(corporateId, empNum);
          if (existing) detailsMap[empNum] = existing;
        } catch {}
      }
      setDuplicateEmployeeDetails(detailsMap);
    } catch (error) {
      console.error('Failed to load invalid employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExistingEmployee = (emp: InvalidEmployee) => {
    const normalizedNumber = emp.data.employeeNumber?.trim().toLowerCase();
    const normalizedEmail = emp.data.email?.trim().toLowerCase();

    let existingEmp = existingEmployeeMap[emp.data.employeeNumber];

    if (!existingEmp && normalizedNumber) {
      existingEmp = Object.values(existingEmployeeMap).find((x: any) => x.employeeNumber?.trim().toLowerCase() === normalizedNumber);
    }

    if (!existingEmp && normalizedEmail) {
      existingEmp = existingEmailMap[normalizedEmail];
      if (!existingEmp) {
        existingEmp = Object.values(existingEmployeeMap).find((x: any) => x.email?.trim().toLowerCase() === normalizedEmail);
      }
    }

    return existingEmp;
  };

  const loadExistingEmployeeByNumber = async (employeeNumber: string) => {
    if (!corporateId || !employeeNumber) return null;

    try {
      const emp = await employeesApi.findByEmployeeNumber(corporateId, employeeNumber.trim());
      if (emp) {
        const updatedMap = { ...existingEmployeeMap, [emp.employeeNumber.trim()]: emp };
        setExistingEmployeeMap(updatedMap);
        if (emp.email) setExistingEmailMap({ ...existingEmailMap, [emp.email.trim().toLowerCase()]: emp });
        return emp;
      }
      return null;
    } catch (error) {
      console.error('Failed to load existing employee by number:', error);
      return null;
    }
  };

  const startEdit = (emp: InvalidEmployee) => {
    setEditing(emp);
    setForm({ ...emp.data });
    // Set plan coverage range if planId exists
    if (emp.data.planId && planMap[emp.data.planId]) {
      const plan = planMap[emp.data.planId];
      const min = plan.validFrom || plan.valid_from || '';
      const max = plan.validUntil || plan.valid_until || '';
      if (min && max) {
        setPlanCoverageRange({ min, max });
      } else {
        setPlanCoverageRange({});
      }
    } else {
      setPlanCoverageRange({});
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(null);
  };

  const saveEdit = async () => {
    if (!editing || !form) return;

    try {
      setResubmitting(editing.id);
      
      // Update the invalid employee record with the new data
      const response = await employeesApi.updateInvalidUpload(editing.id, form);
      
      // Check if the employee data is now valid
      // If valid, automatically resubmit to create the employee
      const updatedList = await employeesApi.getInvalidUploads(corporateId);
      const updatedEmployee = updatedList.find((emp: any) => emp.id === editing.id);
      
      if (updatedEmployee && updatedEmployee.errors.length === 0) {
        // Data is valid, automatically resubmit to create the employee
        await employeesApi.resubmitInvalidUpload(editing.id);
        
        // Reload the list
        await loadInvalidEmployees();
        
        // Exit edit mode
        setEditing(null);
        setForm(null);
      } else {
        // Data still has errors, just reload to show updated validation results
        await loadInvalidEmployees();
        
        // Exit edit mode
        setEditing(null);
        setForm(null);
      }
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      
      // Show specific error message from backend if available
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update employee. Please check the data and try again.';
      
      alert(errorMessage);
    } finally {
      setResubmitting(null);
    }
  };

  const renderErrorWithContext = (error: string, emp: InvalidEmployee) => {
    // Plan does not exist error - show available plans
    if (error.includes('Plan does not exist') || error.includes('Invalid plan')) {
      const planId = emp.data.planId;
      const availablePlans = plans.filter(p => p.id !== planId);
      const detailKey = `plan-${emp.id}`;
      
      return (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-red-900">Plan Issue</p>
          <p className="text-sm text-red-800">{error}</p>
          
          {planId && planMap[planId] ? (
            <div className="mt-2">
              <button
                onClick={() => setExpandedDetails({...expandedDetails, [detailKey]: !expandedDetails[detailKey]})}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                {expandedDetails[detailKey] ? 'Hide' : 'Show'} Plan Details
              </button>
              {expandedDetails[detailKey] && (
                <div className="bg-white rounded p-2 mt-2 text-xs border border-green-200">
                  <p className="font-medium text-green-700">✅ Plan Found (but may be inactive):</p>
                  <p className="text-black"><strong>Name:</strong> {planMap[planId].planName || planMap[planId].name}</p>
                  <p className="text-black"><strong>Code:</strong> {planMap[planId].planCode}</p>
                  <p className="text-black"><strong>Coverage:</strong> ${planMap[planId].sumInsured?.toLocaleString()}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <button
                onClick={() => setExpandedDetails({...expandedDetails, [detailKey]: !expandedDetails[detailKey]})}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {expandedDetails[detailKey] ? 'Hide' : 'View'} Available Plans ({availablePlans.length})
              </button>
              {expandedDetails[detailKey] && (
                <div className="bg-white rounded p-2 mt-2 text-xs border border-blue-200 max-h-40 overflow-y-auto">
                  <p className="font-medium text-blue-700">Available plans for this corporate:</p>
                  <div className="mt-1 space-y-1">
                    {availablePlans.map((plan) => (
                      <div key={plan.id} className="bg-gray-50 rounded p-1">
                        <p className="text-black"><strong>{plan.planName || plan.name}</strong> ({plan.planCode})</p>
                        <p className="text-gray-600">ID: {plan.id} | Coverage: ${plan.sumInsured?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Coverage date error - only show generic message (plan-specific range is shown in edit form)
    if (error.includes('coverage dates must be within corporate contract dates')) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-blue-900">Coverage Date Issue</p>
          <p className="text-sm text-blue-800">Employee coverage dates must be within corporate contract dates</p>
        </div>
      );
    }

    // Duplicate employee number - show existing employee
    if (error.includes('Duplicate employeeNumber')) {
      const empNum = emp.data.employeeNumber;
      const existingEmp = duplicateEmployeeDetails[empNum];
      return (
        <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-orange-900">Duplicate Employee Number</p>
          <p className="text-sm text-orange-800 mb-1">{error}</p>
          {existingEmp ? (
            <div className="mt-2">
              <button
                onClick={() => setExpandedDetails({...expandedDetails, [`empnum-${emp.id}`]: !expandedDetails[`empnum-${emp.id}`]})}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {expandedDetails[`empnum-${emp.id}`] ? 'Hide' : 'Show'} Employee Details
              </button>
              {expandedDetails[`empnum-${emp.id}`] && (
                <div className="bg-white rounded p-2 mt-2 text-xs border border-blue-200">
                  <p className="font-medium text-orange-700">Existing Employee:</p>
                  <p className="text-black"><strong>Name:</strong> {existingEmp.firstName} {existingEmp.lastName}</p>
                  <p className="text-black"><strong>Email:</strong> {existingEmp.email}</p>
                  <p className="text-black"><strong>Employee #:</strong> {existingEmp.employeeNumber}</p>
                  <p className="text-black"><strong>Department:</strong> {existingEmp.department}</p>
                  <p className="text-black"><strong>Designation:</strong> {existingEmp.designation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 text-xs text-orange-700">Looking up existing employee...</div>
          )}
        </div>
      );
    }

    // Duplicate email
    if (error.includes('Duplicate email')) {
      const existingEmp = getExistingEmployee(emp);
      const detailKey = `email-${emp.id}`;
      
      return (
        <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-orange-900">Duplicate Email Address</p>
          <p className="text-sm text-orange-800">{error}</p>
          <p className="text-xs text-orange-700 mt-1">Each employee must have a unique email address</p>
          
          {existingEmp ? (
            <div className="mt-2">
              <button
                onClick={() => setExpandedDetails({...expandedDetails, [detailKey]: !expandedDetails[detailKey]})}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {expandedDetails[detailKey] ? 'Hide' : 'Show'} Employee Details
              </button>
              {expandedDetails[detailKey] && (
                <div className="bg-white rounded p-2 mt-2 text-xs border border-blue-200">
                  <p className="font-medium text-orange-700">Existing Employee:</p>
                  <p className="text-black"><strong>Name:</strong> {existingEmp.firstName} {existingEmp.lastName}</p>
                  <p className="text-black"><strong>Email:</strong> {existingEmp.email}</p>
                  <p className="text-black"><strong>Employee #:</strong> {existingEmp.employeeNumber}</p>
                  <p className="text-black"><strong>Department:</strong> {existingEmp.department}</p>
                  <p className="text-black"><strong>Designation:</strong> {existingEmp.designation}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-orange-700 mt-1">Existing employee details not available</p>
          )}
        </div>
      );
    }

    // Invalid email format
    if (error.includes('Invalid email') || error.includes('email must be an email')) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-yellow-900">Email Format Issue</p>
          <p className="text-sm text-yellow-800">{error}</p>
          <p className="text-xs text-yellow-700 mt-1">Please use a valid email format (e.g., user@company.com)</p>
        </div>
      );
    }

    // Invalid phone format
    if (error.includes('Invalid phone') || error.includes('phone must be a string')) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-yellow-900">Phone Number Issue</p>
          <p className="text-sm text-yellow-800">{error}</p>
          <p className="text-xs text-yellow-700 mt-1">Please use a valid phone number format (e.g., +92-300-1234567)</p>
        </div>
      );
    }

    // Invalid date format
    if (error.includes('Invalid date') || error.includes('must be a valid date')) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-yellow-900">Date Format Issue</p>
          <p className="text-sm text-yellow-800">{error}</p>
          <p className="text-xs text-yellow-700 mt-1">Please use YYYY-MM-DD format (e.g., 2025-01-15)</p>
        </div>
      );
    }

    // Required field missing
    if (error.includes('required') || error.includes('must not be empty')) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-yellow-900">Missing Required Field</p>
          <p className="text-sm text-yellow-800">{error}</p>
          <p className="text-xs text-yellow-700 mt-1">Please fill in all required fields marked with *</p>
        </div>
      );
    }

    // Generic error
    return (
      <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  };

  const handleDelete = async (emp: InvalidEmployee) => {
    setRecordToDelete(emp);
    setDeleteConfirmType('single');
    setShowDeleteConfirm(true);
  };

  const handleDeleteAllClick = () => {
    setDeleteConfirmType('all');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);

    if (deleteConfirmType === 'single' && recordToDelete) {
      try {
        await employeesApi.deleteInvalidUpload(recordToDelete.id);
        
        // Reload the list
        await loadInvalidEmployees();
        
        // Exit edit mode if we were editing this record
        if (editing?.id === recordToDelete.id) {
          setEditing(null);
          setForm(null);
        }
        
        setRecordToDelete(null);
      } catch (error: any) {
        console.error('Failed to delete employee:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete employee record.';
        alert(errorMessage);
      }
    } else if (deleteConfirmType === 'all') {
      setDeletingAll(true);
      try {
        const response = await employeesApi.deleteAllInvalidUploads(corporateId);
        alert(response.message);
        await loadInvalidEmployees();
      } catch (error: any) {
        console.error('Failed to delete all invalid uploads:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete invalid records';
        alert(errorMessage);
      } finally {
        setDeletingAll(false);
      }
    }
  };

  
  const handleResubmit = async (invalidUploadId: string) => {
    setResubmitting(invalidUploadId);
    try {
      await employeesApi.resubmitInvalidUpload(invalidUploadId);
      // Reload the list
      await loadInvalidEmployees();
      setEditing(null);
      setForm(null);
    } catch (error: any) {
      console.error('Failed to resubmit:', error);
      
      // Show specific error message from backend if available
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to resubmit employee';
      
      alert(errorMessage);
    } finally {
      setResubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading invalid employees{plans.length === 0 ? ' and plans...' : '...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Invalid Employees ({invalidEmployees.length})
          </h3>
          {invalidEmployees.length > 0 && (
            <button
              onClick={handleDeleteAllClick}
              disabled={deletingAll}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed font-medium"
            >
              {deletingAll ? 'Deleting All...' : 'Delete All Invalid Records'}
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Click <strong>Edit</strong> to fix errors and update the record. The system will re-validate and show any remaining errors. Click <strong>Resubmit As-Is</strong> to create employee when all issues are resolved. Use <strong>Delete</strong> to remove individual records, or <strong>Delete All Invalid Records</strong> to clear all at once.
        </p>

        {invalidEmployees.length === 0 ? (
          <p className="text-gray-500">No invalid employees to review.</p>
        ) : (
          <div className="space-y-4">
            {invalidEmployees.map((emp) => (
              <div key={emp.id} className="border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-black">{emp.data.firstName} {emp.data.lastName}</h4>
                    <p className="text-sm text-gray-600">{emp.data.email}</p>
                    <p className="text-sm text-gray-500">From: {emp.fileName} ({new Date(emp.uploadedAt).toLocaleDateString()})</p>
                  </div>
                  <div className="flex space-x-2">
                    {editing?.id === emp.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          disabled={resubmitting === emp.id}
                        >
                          {resubmitting === emp.id ? 'Submitting...' : 'Submit'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(emp)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {emp.errors.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {emp.errors.map((error, idx) => (
                      <div key={idx}>
                        {renderErrorWithContext(error, emp)}
                      </div>
                    ))}
                  </div>
                )}

                {emp.errors.length === 0 && (
                  <div className="mb-2 bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-sm font-medium text-green-900">✓ All validation issues resolved!</p>
                    <p className="text-sm text-green-800">This employee is ready to be created. Click "✓ Ready to Resubmit" to proceed.</p>
                  </div>
                )}

                {editing?.id === emp.id && form && (
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Employee Number</label>
                        <input
                          type="text"
                          value={form.employeeNumber}
                          onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          value={form.firstName}
                          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={form.lastName || ''}
                          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          value={form.password || ''}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
                        <input
                          type="text"
                          value={form.designation}
                          onChange={(e) => setForm({ ...form, designation: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                        <input
                          type="text"
                          value={form.department}
                          onChange={(e) => setForm({ ...form, department: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                        <select
                          value={form.planId || ''}
                          onChange={e => {
                            const selectedPlanId = e.target.value;
                            setForm({ ...form, planId: selectedPlanId });
                            if (selectedPlanId && planMap[selectedPlanId]) {
                              const plan = planMap[selectedPlanId];
                              const min = plan.validFrom || plan.valid_from || '';
                              const max = plan.validUntil || plan.valid_until || '';
                              if (min && max) {
                                setPlanCoverageRange({ min, max });
                              } else {
                                setPlanCoverageRange({});
                              }
                            } else {
                              setPlanCoverageRange({});
                            }
                          }}
                          className="px-2 py-1 border rounded text-sm text-black w-full"
                        >
                          <option value="">Select Plan</option>
                          {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.planName || plan.name} ({plan.planCode}) - ${plan.sumInsured?.toLocaleString()}
                            </option>
                          ))}
                        </select>
                        {contractStartDate && contractEndDate && (
                          <div className="text-xs text-blue-700 mt-1">
                            Valid coverage dates: {new Date(contractStartDate).toLocaleDateString()} to {new Date(contractEndDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Coverage Start</label>
                        <input
                          type="date"
                          value={form.coverageStartDate}
                          min={contractStartDate}
                          max={contractEndDate}
                          onChange={(e) => setForm({ ...form, coverageStartDate: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Coverage End</label>
                        <input
                          type="date"
                          value={form.coverageEndDate}
                          min={contractStartDate}
                          max={contractEndDate}
                          onChange={(e) => setForm({ ...form, coverageEndDate: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">CNIC</label>
                        <input
                          type="text"
                          value={form.cnic || ''}
                          onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={form.dob || ''}
                          onChange={(e) => setForm({ ...form, dob: e.target.value })}
                          className="px-2 py-1 border rounded text-sm w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {deleteConfirmType === 'all' ? 'Delete All Invalid Records' : 'Delete Invalid Record'}
                </h3>
                
                {deleteConfirmType === 'single' && recordToDelete && (
                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-700">
                      <strong>{recordToDelete.data.firstName} {recordToDelete.data.lastName}</strong>
                    </p>
                    <p className="text-sm text-gray-600">{recordToDelete.data.email}</p>
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-6">
                  {deleteConfirmType === 'all' 
                    ? `Are you sure you want to delete all ${invalidEmployees.length} invalid employee records? This action cannot be undone.`
                    : 'Are you sure you want to delete this invalid employee record? This action cannot be undone.'
                  }
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                  >
                    {deleteConfirmType === 'all' ? 'Delete All' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
