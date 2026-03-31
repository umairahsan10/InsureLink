'use client';

import dynamic from 'next/dynamic';

const DynamicPatientHospitals = dynamic(() => import('./PatientHospitalsClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-6 w-48 skeleton-shimmer rounded bg-gray-200" />
        <div className="h-32 skeleton-shimmer rounded-xl bg-white border border-gray-100" />
      </div>
    </div>
  ),
});

export default function PatientHospitalsPage() {
  return <DynamicPatientHospitals />;
}

