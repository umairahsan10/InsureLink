'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import Link from 'next/link';

const userTypes = ['Insurer', 'Corporate', 'Hospital', 'Patient'];

export default function LoginPage() {
  const [selectedUserType, setSelectedUserType] = useState('Insurer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // Instantiate router

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login (replace with actual backend logic later)
    // Redirect user based on selected role
    const rolePath = selectedUserType.toLowerCase(); // Convert role to lowercase for URL
    router.push(`/${rolePath}/claims`); // Redirect to the respective dashboard

    // Optionally, you can add a condition to check for email/password validation or API response here
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side – Login Form */}
      <div className="w-full md:w-2/5 flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          {/* User Type Tabs */}
          <div className="flex justify-between mb-6">
            {userTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedUserType(type)}
                className={`flex-1 py-2 mx-1 rounded-lg font-medium text-center transition ${
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/explore" className="text-blue-600 hover:text-blue-800 font-medium">
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
      <div
        className="hidden md:block w-3/5 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/abc.png')" }} // Set the image path to your public image
      >
        {/* This div will display the image on the right side */}
      </div>
    </div>
  );
}
