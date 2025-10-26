'use client';

import { useState, useMemo } from 'react';
import hospitalsData from '@/data/hospitals.json';

export default function PatientHospitalsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'reimbursable' | 'non-reimbursable'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  // Get unique cities from the data
  const cities = useMemo(() => {
    const citySet = new Set(hospitalsData.map(h => h.city));
    return Array.from(citySet).sort();
  }, []);

  // Filter hospitals based on category, search term, and city
  const filteredHospitals = useMemo(() => {
    let filtered = hospitalsData;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(hospital => {
        if (selectedCategory === 'reimbursable') {
          return hospital.type === 'reimbursable';
        } else {
          return hospital.type === 'non-reimbursable';
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(hospital =>
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by city
    if (selectedCity !== 'All Cities') {
      filtered = filtered.filter(hospital => hospital.city === selectedCity);
    }

    return filtered;
  }, [selectedCategory, searchTerm, selectedCity]);

  // Separate hospitals by category
  const reimbursableHospitals = filteredHospitals.filter(h => h.type === 'reimbursable');
  const nonReimbursableHospitals = filteredHospitals.filter(h => h.type === 'non-reimbursable');

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Hospitals Directory</h1>
          <p className="text-gray-600">Find hospitals covered under your insurance plan</p>
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Hospitals ({hospitalsData.length})
            </button>
            <button
              onClick={() => setSelectedCategory('reimbursable')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'reimbursable'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reimbursable ({hospitalsData.filter(h => h.type === 'reimbursable').length})
            </button>
            <button
              onClick={() => setSelectedCategory('non-reimbursable')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'non-reimbursable'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Non-Reimbursable ({hospitalsData.filter(h => h.type === 'non-reimbursable').length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Hospitals</label>
              <input
                type="text"
                placeholder="Search by hospital name, city, or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reimbursable Hospitals Section */}
        {selectedCategory !== 'non-reimbursable' && reimbursableHospitals.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-1 h-8 bg-green-600 rounded-r mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-900">Reimbursable Hospitals</h2>
              <span className="ml-2 text-sm text-gray-500">({reimbursableHospitals.length})</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reimbursableHospitals.map((hospital) => (
                <div key={hospital.id} className="bg-white rounded-lg shadow-sm border border-green-200 hover:border-green-400 transition-colors p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{hospital.name}</h3>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">Reimbursable</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {hospital.city}
                    </div>
                    
                    {hospital.contact !== 'N/A' && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {hospital.contact}
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Specialties:</p>
                      <div className="flex flex-wrap gap-1">
                        {hospital.specialties.slice(0, 3).map((specialty, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {specialty}
                          </span>
                        ))}
                        {hospital.specialties.length > 3 && (
                          <span className="text-xs text-gray-500">+{hospital.specialties.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Non-Reimbursable Hospitals Section */}
        {selectedCategory !== 'reimbursable' && nonReimbursableHospitals.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <div className="w-1 h-8 bg-red-600 rounded-r mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-900">Non-Reimbursable Hospitals</h2>
              <span className="ml-2 text-sm text-gray-500">({nonReimbursableHospitals.length})</span>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Important Notice</h3>
                  <p className="text-sm text-red-800">
                    Cost of services rendered by hospitals listed below are not eligible for reimbursement by Pak-Qatar Family Takaful Limited.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nonReimbursableHospitals.map((hospital) => (
                <div key={hospital.id} className="bg-white rounded-lg shadow-sm border border-red-200 hover:border-red-400 transition-colors p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{hospital.name}</h3>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">Non-Reimbursable</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {hospital.city}
                    </div>
                    
                    {hospital.contact !== 'N/A' && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {hospital.contact}
                      </div>
                    )}
                    
                    {hospital.specialties.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {hospital.specialties.slice(0, 3).map((specialty, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {specialty}
                            </span>
                          ))}
                          {hospital.specialties.length > 3 && (
                            <span className="text-xs text-gray-500">+{hospital.specialties.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredHospitals.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCity !== 'All Cities'
                ? 'No hospitals match your current filters. Try adjusting your search criteria.'
                : 'No hospitals are available in this category.'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('All Cities');
                setSelectedCategory('all');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
