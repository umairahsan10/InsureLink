import Link from 'next/link';

export default function ExplorePage() {
  const roles = [
    {
      name: 'Patient',
      href: '/explore/patient',
      description: 'Experience seamless healthcare claims and policy management',
      icon: '🏥',
    },
    {
      name: 'Corporate',
      href: '/explore/corporate',
      description: 'Manage employee health benefits and group policies',
      icon: '🏢',
    },
    {
      name: 'Hospital',
      href: '/explore/hospital',
      description: 'Streamline patient claims and insurance verification',
      icon: '⚕️',
    },
    {
      name: 'Insurer',
      href: '/explore/insurer',
      description: 'Oversee claims processing and network management',
      icon: '🛡️',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explore InsureLink Roles
          </h1>
          <p className="text-lg text-gray-600">
            Choose a role to see how InsureLink transforms healthcare insurance management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Link
              key={role.name}
              href={role.href}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-8 border border-gray-200 hover:border-blue-400"
            >
              <div className="text-5xl mb-4">{role.icon}</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {role.name}
              </h2>
              <p className="text-gray-600">{role.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

