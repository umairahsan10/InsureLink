'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HospitalSidebar from '@/components/hospital/HospitalSidebar';

export default function HospitalVerifyPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);

  // Mock patient data for verification
  const mockPatients = [
    {
      id: 'emp-001',
      name: 'Ali Raza',
      cnic: '42401-1234567-8',
      phone: '+92-300-1234567',
      policyNumber: 'POL-2024-001234',
      coverage: 'Rs. 50,000',
      expiryDate: 'Dec 31, 2025',
      status: 'Active'
    },
    {
      id: 'emp-002',
      name: 'Sara Khan',
      cnic: '42401-2345678-9',
      phone: '+92-301-2345678',
      policyNumber: 'POL-2024-001235',
      coverage: 'Rs. 75,000',
      expiryDate: 'Dec 31, 2025',
      status: 'Active'
    },
    {
      id: 'emp-003',
      name: 'Ahmed Ali',
      cnic: '42401-3456789-0',
      phone: '+92-302-3456789',
      policyNumber: 'POL-2024-001236',
      coverage: 'Rs. 100,000',
      expiryDate: 'Dec 31, 2025',
      status: 'Active'
    }
  ];

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const results = mockPatients.filter(patient => 
        patient.cnic.includes(searchTerm) || 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.policyNumber.includes(searchTerm)
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 1000);
  };

  const handleVerifyPatient = (patient: any) => {
    setSelectedClaim(patient);
  };

  const handleSubmitClaim = () => {
    // Handle claim submission logic
    console.log('Submitting claim for:', selectedClaim);
    alert('Claim submitted successfully!');
    setSelectedClaim(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <HospitalSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Verification</h1>
              <p className="text-gray-600">Verify patient insurance coverage and submit claims</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Dr. Sarah Ahmed</p>
                <p className="text-sm text-gray-500">Chief Medical Officer</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {/* Search Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Patient</h2>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter CNIC, Name, or Policy Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {searchResults.map((patient) => (
                  <div key={patient.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{patient.name}</h4>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                <p className="text-sm text-gray-600">CNIC</p>
                                <p className="text-sm font-medium text-gray-900">{patient.cnic}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="text-sm font-medium text-gray-900">{patient.phone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Policy Number</p>
                                <p className="text-sm font-medium text-gray-900">{patient.policyNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Coverage</p>
                                <p className="text-sm font-medium text-gray-900">{patient.coverage}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {patient.status}
                          </span>
                        </div>
                        <button
                          onClick={() => handleVerifyPatient(patient)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Verify & Submit Claim
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claim Submission Modal */}
          {selectedClaim && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Submit Claim for {selectedClaim.name}</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Type</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900">
                        <option>Emergency</option>
                        <option>Outpatient</option>
                        <option>Inpatient</option>
                        <option>Surgery</option>
                        <option>Diagnostic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount Claimed</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                      <input
                        type="text"
                        placeholder="Enter diagnosis"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name</label>
                      <input
                        type="text"
                        placeholder="Enter doctor name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Details</label>
                    <textarea
                      rows={3}
                      placeholder="Enter treatment details..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    ></textarea>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setSelectedClaim(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitClaim}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Submit Claim
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified Today</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Claims Submitted</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
