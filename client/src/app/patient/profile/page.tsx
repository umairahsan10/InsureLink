'use client';

import { useState, useEffect } from 'react';
import { getDependentsByEmployee, getDependentsFromStorage } from '@/utils/dependentHelpers';
import { Dependent } from '@/types/dependent';
import DependentsList from '@/components/patient/DependentsList';
import AddDependentModal from '@/components/patient/AddDependentModal';
import dependentsData from '@/data/dependents.json';

export default function PatientProfilePage() {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock current user - in real app, this would come from auth context
  const currentEmployee = {
    id: 'emp-001',
    name: 'Ali Raza',
    corporateId: 'corp-001'
  };

  // Initialize localStorage with seed data on first load
  useEffect(() => {
    const existing = getDependentsFromStorage();
    if (existing.length === 0) {
      localStorage.setItem('insurelink_dependents', JSON.stringify(dependentsData));
      setDependents(dependentsData as Dependent[]);
    } else {
      setDependents(existing);
    }
  }, []);

  // Load dependents for current employee
  useEffect(() => {
    const employeeDependents = getDependentsByEmployee(currentEmployee.id);
    setDependents(employeeDependents);
  }, [isModalOpen]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    const employeeDependents = getDependentsByEmployee(currentEmployee.id);
    setDependents(employeeDependents);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                <input type="text" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed" defaultValue="John" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                <input type="text" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed" defaultValue="Doe" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" defaultValue="john.doe@example.com" />
              <p className="text-xs text-gray-500 mt-1">You can update your email address</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" defaultValue="+1 (555) 123-4567" />
              <p className="text-xs text-gray-500 mt-1">You can update your phone number</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
              <input type="date" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 cursor-not-allowed" defaultValue="1990-01-01" />
            </div>
            
            <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Insurance Details</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Policy Number</p>
              <p className="font-semibold text-gray-900">POL-2024-001234</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Coverage</p>
              <p className="font-semibold text-gray-900">Rs. 50,000</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiry Date</p>
              <p className="font-semibold text-gray-900">Dec 31, 2025</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dependents Section */}
      <div className="mt-6">
        <DependentsList 
          dependents={dependents} 
          onRequestAdd={() => setIsModalOpen(true)} 
        />
      </div>

      {/* Add Dependent Modal */}
      <AddDependentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employeeId={currentEmployee.id}
        employeeName={currentEmployee.name}
        corporateId={currentEmployee.corporateId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

