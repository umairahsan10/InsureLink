import Link from 'next/link';

export default function ExplorePatientPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Patient Dashboard Demo
          </h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Key Features
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>✓ View and track your health insurance claims in real-time</li>
                <li>✓ Access your policy details and coverage information</li>
                <li>✓ Submit new claims with document upload</li>
                <li>✓ View claim history and status updates</li>
                <li>✓ Manage your profile and beneficiary information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Dashboard Overview
              </h2>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <p className="text-gray-600 mb-4">
                  The patient dashboard provides a comprehensive view of your healthcare journey:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500">Active Claims</p>
                    <p className="text-2xl font-bold text-blue-600">3</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500">Total Coverage</p>
                    <p className="text-2xl font-bold text-green-600">$50K</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500">This Year</p>
                    <p className="text-2xl font-bold text-purple-600">$12K</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex gap-4">
              <Link
                href="/explore"
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                ← Back to Explore
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-200"
              >
                Try Live Demo →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

