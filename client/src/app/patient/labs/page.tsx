'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { insurersApi, Lab } from '@/lib/api/insurers';
import { useAuth } from '@/hooks/useAuth';

export default function PatientLabsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLabs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!user?.insurerId) {
        setError('Insurer information not available.');
        return;
      }
      const data = await insurersApi.getLabs(user.insurerId);
      const labsList: Lab[] = Array.isArray(data) ? data : (data as any).data ?? [];
      setLabs(labsList.filter((l) => l.isActive));
    } catch {
      setError('Failed to load labs.');
    } finally {
      setLoading(false);
    }
  }, [user?.insurerId]);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  const cities = useMemo(() => {
    const citySet = new Set(labs.map(lab => lab.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [labs]);

  const filteredLabs = useMemo(() => {
    let filtered = labs;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(lab =>
        lab.labName.toLowerCase().includes(q) ||
        lab.city.toLowerCase().includes(q) ||
        lab.address.toLowerCase().includes(q)
      );
    }

    if (selectedCity !== 'All Cities') {
      filtered = filtered.filter(lab => lab.city === selectedCity);
    }

    return filtered;
  }, [labs, searchTerm, selectedCity]);

  const labsByCity = useMemo(() => {
    const grouped: { [key: string]: Lab[] } = {};
    filteredLabs.forEach(lab => {
      const city = lab.city || 'Unknown';
      if (!grouped[city]) grouped[city] = [];
      grouped[city].push(lab);
    });
    return grouped;
  }, [filteredLabs]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">OPD Discount Centers</h1>
          <p className="text-gray-600">Find diagnostic labs and laboratories covered under your insurance plan</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Labs</p>
            <p className="text-2xl font-bold text-gray-900">{labs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Cities Covered</p>
            <p className="text-2xl font-bold text-blue-600">{cities.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Filtered Results</p>
            <p className="text-2xl font-bold text-green-600">{filteredLabs.length}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Labs</label>
              <input
                type="text"
                placeholder="Search by lab name, address, or city..."
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

        {/* Discount Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Variable Discount Available</h3>
              <p className="text-sm text-blue-800">
                All listed diagnostic centers offer variable discounts on services. Please confirm discount rates at the time of service.
              </p>
            </div>
          </div>
        </div>

        {/* Labs List Grouped by City */}
        {filteredLabs.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(labsByCity)
              .sort(([cityA], [cityB]) => cityA.localeCompare(cityB))
              .map(([city, labs]) => (
                <div key={city} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {/* City Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h2 className="text-xl font-semibold text-gray-900">{city}</h2>
                      <span className="ml-2 text-sm text-gray-500">({labs.length} {labs.length === 1 ? 'center' : 'centers'})</span>
                    </div>
                  </div>

                  {/* Labs Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {labs.map((lab) => (
                        <div key={lab.id} className="border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{lab.labName}</h3>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start">
                              <svg className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <p className="text-gray-600">{lab.address}</p>
                            </div>
                            
                            {lab.contactPhone && (
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {lab.contactPhone}
                              </div>
                            )}

                            {lab.contactEmail && (
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {lab.contactEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No labs found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedCity !== 'All Cities'
                ? 'No labs match your current filters. Try adjusting your search criteria.'
                : 'No labs are available at the moment.'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('All Cities');
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
