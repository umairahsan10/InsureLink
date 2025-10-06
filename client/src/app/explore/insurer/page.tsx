import Link from 'next/link';

export default function ExploreInsurerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Insurer Dashboard Demo
          </h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Key Features
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Process and review claims efficiently</li>
                <li>✓ Manage network of hospitals and corporates</li>
                <li>✓ Monitor fraud detection and risk assessment</li>
                <li>✓ Generate analytics and financial reports</li>
                <li>✓ Automate claim approvals with AI</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Dashboard Overview
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-600 mb-4">
                  Complete oversight and management tools:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded shadow-sm">
                    <p className="text-sm text-gray-500">Claims This Month</p>
                    <p className="text-2xl font-bold text-blue-600">1,247</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <p className="text-sm text-gray-500">Network Hospitals</p>
                    <p className="text-2xl font-bold text-purple-600">85</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <p className="text-sm text-gray-500">Corporate Clients</p>
                    <p className="text-2xl font-bold text-green-600">142</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex gap-4">
              <Link
                href="/explore"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Back to Explore
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

