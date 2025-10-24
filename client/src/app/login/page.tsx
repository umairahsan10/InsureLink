'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const userTypes = ['Insurer', 'Corporate', 'Hospital', 'Patient'];

export default function LoginPage() {
  const [selectedUserType, setSelectedUserType] = useState('Patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication - set auth token cookie
    document.cookie = `auth_token=mock_token_${Date.now()}; path=/; max-age=86400`; // 24 hours
    
    // Redirect to the intended page or default dashboard
    const rolePath = selectedUserType.toLowerCase();
    const redirectPath = nextUrl || `/${rolePath}/dashboard`;
    router.push(redirectPath);
  };

  return (
    <div className="flex overflow-hidden m-0 p-0 h-screen w-screen">
      {/* Left Side – Login Form */}
      <div className="w-1/2 flex flex-col items-center justify-center px-6 py-4 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-8">
          {/* User Type Tabs */}
          <div className="flex justify-between mb-6">
            {userTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedUserType(type)}
                className={`flex-1 py-3 mx-1 rounded-lg font-semibold text-center transition text-sm ${
                  selectedUserType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sign In as {selectedUserType}
          </h1>
          
          {nextUrl && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                You'll be redirected to: <span className="font-medium">{nextUrl}</span>
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="#" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-base"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/explore" className="text-blue-600 hover:text-blue-800 font-semibold">
              Explore roles
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side – Image */}
      <div className="w-1/2 bg-cover bg-center bg-no-repeat bg-blue-100 min-h-screen" style={{ backgroundImage: "url('/images/abc.png')", backgroundSize: '80%' }}>
        {/* This div will display the image on the right side */}
      </div>
    </div>
  );
}
