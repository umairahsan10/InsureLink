import { useState } from 'react';
import { Employee } from '@/types/employee';
import { ParsedEmployee, validateEmployeeObject } from '@/utils/employeeValidator';

interface InvalidEmployeesTableProps {
  invalidEmployees: Employee[];
  existingEmployees: Employee[];
  onResolve: (resolved: Employee) => void; // move to valid list
  onUpdateInvalid: (updated: Employee) => void; // keep as invalid with updated errors
}

export default function InvalidEmployeesTable({ invalidEmployees, existingEmployees, onResolve, onUpdateInvalid }: InvalidEmployeesTableProps) {
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<ParsedEmployee | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const startEdit = (emp: Employee) => {
    setEditing(emp);
    setErrors([]);
    setForm({
      employeeNumber: emp.employeeNumber,
      name: emp.name,
      email: emp.email,
      mobile: emp.mobile,
      cnic: (emp as any).cnic || '',
      planId: emp.planId,
      designation: emp.designation || '',
      department: emp.department || '',
      coverageStart: emp.coverageStart,
      coverageEnd: emp.coverageEnd,
    });
  };

  const saveEdit = () => {
    if (!form || !editing) return;
    const result = validateEmployeeObject(form, existingEmployees);
    if (result.valid) {
      const resolved: Employee = {
        ...editing,
        employeeNumber: form.employeeNumber,
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        planId: form.planId,
        coverageStart: form.coverageStart,
        coverageEnd: form.coverageEnd,
        designation: form.designation,
        department: form.department,
        importStatus: 'valid',
        importErrors: [],
      } as Employee;
      onResolve(resolved);
      setEditing(null);
      setForm(null);
    } else {
      setErrors(result.errors);
      const stillInvalid: Employee = {
        ...editing,
        employeeNumber: form.employeeNumber,
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        planId: form.planId,
        coverageStart: form.coverageStart,
        coverageEnd: form.coverageEnd,
        designation: form.designation,
        department: form.department,
        importStatus: 'invalid',
        importErrors: result.errors,
      } as Employee;
      onUpdateInvalid(stillInvalid);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invalidEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-900">{emp.employeeNumber}</td>
                <td className="px-4 py-4 text-sm text-gray-900">{emp.name}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{emp.email}</td>
                <td className="px-4 py-4 text-sm">
                  <div className="space-y-1">
                    {emp.importErrors?.map((e, idx) => (
                      <div key={idx} className="text-red-600 text-xs">{e}</div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <button onClick={() => startEdit(emp)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && form && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-300 sticky top-0 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Edit Employee</h3>
              <button onClick={() => { setEditing(null); setForm(null); setErrors([]); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {errors.join(', ')}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Employee Number *</label>
                  <input value={form.employeeNumber} onChange={e => setForm({ ...form, employeeNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mobile *</label>
                  <input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="+92-3XX-XXXXXXX or 03XX-XXXXXXX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CNIC *</label>
                  <input value={form.cnic} onChange={e => setForm({ ...form, cnic: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="12345-1234567-1" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Plan ID *</label>
                  <input value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Designation (Optional)</label>
                  <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department (Optional)</label>
                  <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Coverage Start Date</label>
                  <input type="date" value={form.coverageStart} onChange={e => setForm({ ...form, coverageStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Coverage End Date</label>
                  <input type="date" value={form.coverageEnd} onChange={e => setForm({ ...form, coverageEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => { setEditing(null); setForm(null); setErrors([]); }} className="px-5 py-2 bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={saveEdit} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save & Re-Validate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
