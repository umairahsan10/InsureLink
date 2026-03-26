import { useState, useEffect } from 'react';
import { employeesApi } from '@/lib/api/employees';

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
  const [selectedExistingEmployee, setSelectedExistingEmployee] = useState<any>(null);

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

  const loadInvalidEmployees = async () => {
    try {
      const data = await employeesApi.getInvalidUploads(corporateId);
      setInvalidEmployees(data);
      await loadExistingEmployees();
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
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(null);
  };

  const saveEdit = async () => {
    if (!editing || !form) return;

    // Update the invalid employee record (this would require a new API endpoint)
    // For now, we'll just resubmit
    await handleResubmit(editing.id);
  };

  const renderErrorWithContext = (error: string, emp: InvalidEmployee) => {
    // Coverage date error - show contract dates
    if (error.includes('coverage dates must be within corporate contract dates')) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-blue-900">Coverage Date Issue</p>
          <p className="text-sm text-blue-800">{error}</p>
          {contractStartDate && contractEndDate && (
            <p className="text-xs text-blue-700 mt-1">
              Valid range: {new Date(contractStartDate).toLocaleDateString()} to{' '}
              {new Date(contractEndDate).toLocaleDateString()}
            </p>
          )}
        </div>
      );
    }

    // Duplicate employee number - show existing employee
    if (error.includes('Duplicate employeeNumber')) {
      const existingEmp = getExistingEmployee(emp);
      return (
        <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-orange-900">Duplicate Employee Number</p>
          <p className="text-sm text-orange-800 mb-1">{error}</p>
          {existingEmp ? (
            <>
              <button
                onClick={() => setSelectedExistingEmployee(existingEmp)}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 mb-2"
              >
                Show existing employee details
              </button>
              <div className="bg-white rounded p-2 text-xs text-orange-700">
                <p>
                  <strong>Existing:</strong> {existingEmp.firstName} {existingEmp.lastName} ({existingEmp.email})
                </p>
                <p className="text-xs text-gray-600">ID: {existingEmp.employeeNumber}</p>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={async () => {
                  const lookedUp = await loadExistingEmployeeByNumber(emp.data.employeeNumber);
                  if (lookedUp) {
                    setSelectedExistingEmployee(lookedUp);
                  }
                }}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 mb-2"
              >
                Look up existing employee by number
              </button>
              <p className="text-xs text-orange-700">Existing employee record not found yet, click to verify.</p>
            </>
          )}
        </div>
      );
    }

    // Duplicate email
    if (error.includes('Duplicate email')) {
      const existingEmp = getExistingEmployee(emp);
      return (
        <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-orange-900">Duplicate Email</p>
          <p className="text-sm text-orange-800">{error}</p>
          <p className="text-xs text-orange-700 mt-1">Use a unique email address</p>
          {existingEmp ? (
            <>
              <button
                onClick={() => setSelectedExistingEmployee(existingEmp)}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 mt-1"
              >
                Show existing employee details
              </button>
              <div className="bg-white rounded p-2 text-xs text-orange-700 mt-1">
                <p>
                  <strong>Existing:</strong> {existingEmp.firstName} {existingEmp.lastName} ({existingEmp.email})
                </p>
                <p className="text-xs text-gray-600">Emp#: {existingEmp.employeeNumber}</p>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={async () => {
                  const lookedUp = await loadExistingEmployeeByNumber(emp.data.employeeNumber);
                  if (lookedUp) {
                    setSelectedExistingEmployee(lookedUp);
                  }
                }}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 mt-1"
              >
                Look up existing employee by number
              </button>
              <p className="text-xs text-orange-700">Existing employee record not found yet, click to verify.</p>
            </>
          )}
        </div>
      );
    }

    // Plan does not exist or invalid format
    if (error.includes('Plan does not exist') || error.includes('Invalid planId format')) {
      return (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
          <p className="text-sm font-medium text-red-900">Plan Issue</p>
          <p className="text-sm text-red-800">{error}</p>
          <p className="text-xs text-red-700 mt-1">Check that the Plan ID is correct and active</p>
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

  const handleResubmit = async (invalidUploadId: string) => {
    setResubmitting(invalidUploadId);
    try {
      await employeesApi.resubmitInvalidUpload(invalidUploadId);
      // Reload the list
      await loadInvalidEmployees();
      setEditing(null);
      setForm(null);
    } catch (error) {
      console.error('Failed to resubmit:', error);
      alert('Failed to resubmit employee');
    } finally {
      setResubmitting(null);
    }
  };

  if (loading) {
    return <div className="p-4">Loading invalid employees...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Invalid Employees ({invalidEmployees.length})
        </h3>

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
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          disabled={resubmitting === emp.id}
                        >
                          {resubmitting === emp.id ? 'Resubmitting...' : 'Resubmit'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
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
                          onClick={() => handleResubmit(emp.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          disabled={resubmitting === emp.id}
                        >
                          {resubmitting === emp.id ? 'Resubmitting...' : 'Resubmit'}
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

                {selectedExistingEmployee && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900">Selected existing employee details</p>
                      <button
                        onClick={() => setSelectedExistingEmployee(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Close
                      </button>
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      <p><strong>Employee Number:</strong> {selectedExistingEmployee.employeeNumber}</p>
                      <p><strong>Name:</strong> {selectedExistingEmployee.firstName} {selectedExistingEmployee.lastName}</p>
                      <p><strong>Email:</strong> {selectedExistingEmployee.email}</p>
                      <p><strong>Phone:</strong> {selectedExistingEmployee.phone || 'N/A'}</p>
                      <p><strong>Designation:</strong> {selectedExistingEmployee.designation || 'N/A'}</p>
                      <p><strong>Department:</strong> {selectedExistingEmployee.department || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {editing?.id === emp.id && form && (
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Employee Number"
                        value={form.employeeNumber}
                        onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={form.lastName || ''}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Designation"
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Department"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="date"
                        placeholder="Coverage Start"
                        value={form.coverageStartDate}
                        onChange={(e) => setForm({ ...form, coverageStartDate: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="date"
                        placeholder="Coverage End"
                        value={form.coverageEndDate}
                        onChange={(e) => setForm({ ...form, coverageEndDate: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
