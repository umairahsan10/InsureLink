'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import notificationsData from '@/data/insurerNotifications.json';
import { AlertNotification } from '@/types';

export default function InsurerProfilePage() {
  const router = useRouter();
  const insurerNotifications = useMemo(
    () =>
      (notificationsData as AlertNotification[]).map((notification) => ({
        ...notification,
      })),
    []
  );
  const initialData = {
    companyName: 'HealthGuard Insurance',
    licenseNumber: 'INS-2020-8901',
    registrationNumber: 'REG-12345-HG',
    headquartersAddress:
      '789 Insurance Plaza, Financial District, Metro City, MC 67890',
    phone: '+1 (800) 555-1234',
    supportEmail: 'support@healthguard.com',
    website: 'https://www.healthguard.com',
    maxCoverage: '$500,000',
    claimProcessingTime: '2-3 business days',
    networkCoverageAreas:
      'Nationwide coverage with partner hospitals across 45 states',
    availablePlans: [
      'Basic Coverage',
      'Comprehensive',
      'Premium',
      'Family Plans',
      'Corporate Group',
      'Senior Care',
    ],
  };

  const [formData, setFormData] = useState(initialData);
  const [selectedPlans, setSelectedPlans] = useState(
    new Set(initialData.availablePlans)
  );
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const hasChanges =
      formData.companyName !== initialData.companyName ||
      formData.licenseNumber !== initialData.licenseNumber ||
      formData.registrationNumber !== initialData.registrationNumber ||
      formData.headquartersAddress !== initialData.headquartersAddress ||
      formData.phone !== initialData.phone ||
      formData.supportEmail !== initialData.supportEmail ||
      formData.website !== initialData.website ||
      formData.maxCoverage !== initialData.maxCoverage ||
      formData.claimProcessingTime !== initialData.claimProcessingTime ||
      formData.networkCoverageAreas !== initialData.networkCoverageAreas ||
      selectedPlans.size !== initialData.availablePlans.length ||
      initialData.availablePlans.some((plan) => !selectedPlans.has(plan));
    setIsDirty(hasChanges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, selectedPlans]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlanToggle = (plan: string) => {
    setSelectedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(plan)) {
        next.delete(plan);
      } else {
        next.add(plan);
      }
      return next;
    });
  };

  const handleSaveChanges = () => {
    setShowConfirmation(true);
  };

  const confirmSave = () => {
    setShowConfirmation(false);
    setShowSuccess(true);
  };

  return (
    <DashboardLayout
      userRole="insurer"
      userName="HealthGuard Insurance"
      notifications={insurerNotifications}
      onNotificationSelect={(notification) => {
        if (notification.category === 'messaging') {
          router.push('/insurer/claims');
        }
      }}
    >
      <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Insurer Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Company Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Company Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  value={formData.companyName}
                  onChange={(e) =>
                    handleInputChange('companyName', e.target.value)
                  }
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">License Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      handleInputChange('licenseNumber', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Registration Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    value={formData.registrationNumber}
                    onChange={(e) =>
                      handleInputChange('registrationNumber', e.target.value)
                    }
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Headquarters Address</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  value={formData.headquartersAddress}
                  onChange={(e) =>
                    handleInputChange('headquartersAddress', e.target.value)
                  }
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    value={formData.phone}
                    onChange={(e) =>
                      handleInputChange('phone', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Support Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    value={formData.supportEmail}
                    onChange={(e) =>
                      handleInputChange('supportEmail', e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Website</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  value={formData.website}
                  onChange={(e) =>
                    handleInputChange('website', e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Coverage & Plans</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Available Plans</label>
                <div className="grid grid-cols-2 gap-2">
                  {initialData.availablePlans.map((plan) => (
                    <label key={plan} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPlans.has(plan)}
                        onChange={() => handlePlanToggle(plan)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-900">{plan}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Max Coverage Limit</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    value={formData.maxCoverage}
                    onChange={(e) =>
                      handleInputChange('maxCoverage', e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Claim Processing Time</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    value={formData.claimProcessingTime}
                    onChange={(e) =>
                      handleInputChange('claimProcessingTime', e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Network Coverage Areas</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  value={formData.networkCoverageAreas}
                  onChange={(e) =>
                    handleInputChange('networkCoverageAreas', e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {isDirty && (
            <button
              onClick={handleSaveChanges}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Account Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-900">Status</p>
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Active & Verified
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-900">Operating Since</p>
                <p className="font-semibold">January 2020</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">License Expiry</p>
                <p className="font-semibold">December 2028</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Network Overview</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-900">Partner Hospitals</p>
                <p className="text-2xl font-bold text-blue-600">85</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">Corporate Clients</p>
                <p className="text-2xl font-bold text-green-600">142</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">Active Policyholders</p>
                <p className="text-2xl font-bold text-purple-600">28.5K</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Monthly Stats</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-900">Claims Processed</p>
                <p className="text-2xl font-bold text-blue-600">1,247</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">Approval Rate</p>
                <p className="text-2xl font-bold text-green-600">87%</p>
              </div>
              <div>
                <p className="text-sm text-gray-900">Total Payout</p>
                <p className="text-2xl font-bold text-orange-600">$2.8M</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm changes?
            </h3>
            <p className="text-sm text-gray-600">
              You are about to save updates to your profile.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                onClick={confirmSave}
              >
                Yes, save
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Changes saved
            </h3>
            <p className="text-sm text-gray-600">
              Your profile updates have been saved successfully.
            </p>
            <button
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowSuccess(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}

