'use client';

import dynamic from 'next/dynamic';

const DynamicPatientHospitals = dynamic(() => import('./PatientHospitalsClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-32 animate-pulse rounded-xl bg-white shadow-sm" />
      </div>
    </div>
  ),
});

export default function PatientHospitalsPage() {
  return <DynamicPatientHospitals />;
}

