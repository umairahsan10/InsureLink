'use client';

import { useEffect, useMemo, useState } from 'react';
import hospitalsData from '@/data/hospitals.json';
import { HospitalFinderPanel } from '@/components/hospitals/HospitalFinderPanel';
import type { HospitalEntity, HospitalType } from '@/types';

type TabKey = 'finder' | 'directory';

export default function PatientHospitalsClient() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('finder');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'reimbursable' | 'non-reimbursable'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const typedHospitals = useMemo<HospitalEntity[]>(
    () =>
      (hospitalsData as Array<HospitalEntity & { type: string }>).map((hospital) => ({
        ...hospital,
        type: hospital.type as HospitalType,
      })),
    []
  );

  const karachiHospitals = useMemo(
    () => typedHospitals.filter((hospital) => hospital.city.toLowerCase() === 'karachi'),
    [typedHospitals]
  );

  const cities = useMemo(() => {
    const citySet = new Set(typedHospitals.map((h) => h.city));
    return Array.from(citySet).sort();
  }, [typedHospitals]);

  const filteredHospitals = useMemo(() => {
    let filtered = typedHospitals;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((hospital) =>
        selectedCategory === 'reimbursable' ? hospital.type === 'reimbursable' : hospital.type === 'non-reimbursable'
      );
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (hospital) =>
          hospital.name.toLowerCase().includes(query) ||
          hospital.city.toLowerCase().includes(query) ||
          hospital.specialties.some((specialty) => specialty.toLowerCase().includes(query))
      );
    }

    if (selectedCity !== 'All Cities') {
      filtered = filtered.filter((hospital) => hospital.city === selectedCity);
    }

    return filtered;
  }, [selectedCategory, searchTerm, selectedCity, typedHospitals]);

  const reimbursableHospitals = filteredHospitals.filter((hospital) => hospital.type === 'reimbursable');
  const nonReimbursableHospitals = filteredHospitals.filter((hospital) => hospital.type === 'non-reimbursable');

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-32 animate-pulse rounded-xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Hospitals Directory</h1>
          <p className="text-gray-600">
            Explore the Pak-Qatar panel hospitals in Karachi, discover emergency-ready facilities, and review the full national directory.
          </p>
        </header>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <nav className="flex">
            {[
              { key: 'finder' as TabKey, label: 'Smart Finder' },
              { key: 'directory' as TabKey, label: 'Hospital Directory' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition sm:text-base ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-b border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-200 p-4 sm:p-6">
            {activeTab === 'finder' ? (
              <HospitalFinderPanel hospitals={karachiHospitals} />
            ) : (
              <div className="space-y-6">
                <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`rounded-lg px-4 py-2 font-medium transition ${
                        selectedCategory === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All Hospitals ({typedHospitals.length})
                    </button>
                    <button
                      onClick={() => setSelectedCategory('reimbursable')}
                      className={`rounded-lg px-4 py-2 font-medium transition ${
                        selectedCategory === 'reimbursable'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Reimbursable ({typedHospitals.filter((h) => h.type === 'reimbursable').length})
                    </button>
                    <button
                      onClick={() => setSelectedCategory('non-reimbursable')}
                      className={`rounded-lg px-4 py-2 font-medium transition ${
                        selectedCategory === 'non-reimbursable'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Non-Reimbursable ({typedHospitals.filter((h) => h.type === 'non-reimbursable').length})
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Search Hospitals</label>
                      <input
                        type="text"
                        placeholder="Search by hospital name, city, or specialty..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Filter by City</label>
                      <select
                        value={selectedCity}
                        onChange={(event) => setSelectedCity(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option>All Cities</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {selectedCategory !== 'non-reimbursable' && reimbursableHospitals.length > 0 && (
                  <section>
                    <header className="mb-4 flex items-center">
                      <div className="mr-3 h-8 w-1 rounded-r bg-green-600"></div>
                      <h2 className="text-xl font-semibold text-gray-900">Reimbursable Hospitals</h2>
                      <span className="ml-2 text-sm text-gray-500">({reimbursableHospitals.length})</span>
                    </header>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {reimbursableHospitals.map((hospital) => (
                        <article
                          key={hospital.id}
                          className="rounded-lg border border-green-200 bg-white p-4 shadow-sm transition hover:border-green-400"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{hospital.name}</h3>
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              Reimbursable
                            </span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.828 0l-4.243-4.243a8 8 0 1 1 11.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                              </svg>
                              {hospital.city}
                            </div>
                            {hospital.contact !== 'N/A' && (
                              <div className="flex items-center">
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                {hospital.contact}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-medium text-gray-700">Specialties:</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {hospital.specialties.slice(0, 3).map((specialty, index) => (
                                  <span key={index} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                    {specialty}
                                  </span>
                                ))}
                                {hospital.specialties.length > 3 && (
                                  <span className="text-xs text-gray-500">+{hospital.specialties.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {selectedCategory !== 'reimbursable' && nonReimbursableHospitals.length > 0 && (
                  <section>
                    <header className="mb-4 flex items-center">
                      <div className="mr-3 h-8 w-1 rounded-r bg-red-600"></div>
                      <h2 className="text-xl font-semibold text-gray-900">Non-Reimbursable Hospitals</h2>
                      <span className="ml-2 text-sm text-gray-500">({nonReimbursableHospitals.length})</span>
                    </header>

                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start">
                        <svg className="mr-2 h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-8a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <h3 className="mb-1 text-sm font-semibold text-red-900">Important Notice</h3>
                          <p className="text-sm text-red-800">
                            Cost of services rendered by hospitals listed below are not eligible for reimbursement by Pak-Qatar Family Takaful Limited.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {nonReimbursableHospitals.map((hospital) => (
                        <article
                          key={hospital.id}
                          className="rounded-lg border border-red-200 bg-white p-4 shadow-sm transition hover:border-red-400"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{hospital.name}</h3>
                            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                              Non-Reimbursable
                            </span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.828 0l-4.243-4.243a8 8 0 1 1 11.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                              </svg>
                              {hospital.city}
                            </div>
                            {hospital.contact !== 'N/A' && (
                              <div className="flex items-center">
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                {hospital.contact}
                              </div>
                            )}
                            {hospital.specialties.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-700">Specialties:</p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {hospital.specialties.slice(0, 3).map((specialty, index) => (
                                    <span key={index} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
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
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {filteredHospitals.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
                    <div className="mb-4 text-6xl text-gray-400">🏥</div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">No hospitals found</h3>
                    <p className="mb-4 text-gray-500">
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
                      className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

