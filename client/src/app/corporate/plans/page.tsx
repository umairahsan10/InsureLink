export default function CorporatePlansPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Insurance Plans</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: 'Basic Plan',
            coverage: 'Rs. 25,000',
            employees: 50,
            premium: 'Rs. 8,500/month',
            features: ['Outpatient Care', 'Emergency Services', 'Prescription Drugs'],
            active: true,
          },
          {
            name: 'Comprehensive Plan',
            coverage: 'Rs. 50,000',
            employees: 150,
            premium: 'Rs. 28,000/month',
            features: ['All Basic Features', 'Inpatient Care', 'Surgery Coverage', 'Dental & Vision'],
            active: true,
          },
          {
            name: 'Premium Plan',
            coverage: '$100,000',
            employees: 50,
            premium: '$18,500/month',
            features: ['All Comprehensive', 'International Coverage', 'Alternative Medicine', 'Mental Health'],
            active: true,
          },
        ].map((plan) => (
          <div key={plan.name} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-6">
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-3xl font-bold">{plan.coverage}</p>
              <p className="text-sm opacity-90">Coverage per person</p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500">Enrolled Employees</p>
                <p className="text-2xl font-bold text-gray-900">{plan.employees}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">Monthly Premium</p>
                <p className="text-xl font-bold text-gray-900">{plan.premium}</p>
              </div>
              
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                <ul className="space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-gray-600">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
                Manage Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Feature</th>
                <th className="text-center py-3 px-4">Basic</th>
                <th className="text-center py-3 px-4">Comprehensive</th>
                <th className="text-center py-3 px-4">Premium</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Coverage Amount', basic: '$25K', comp: '$50K', premium: '$100K' },
                { feature: 'Outpatient Care', basic: '✓', comp: '✓', premium: '✓' },
                { feature: 'Inpatient Care', basic: '×', comp: '✓', premium: '✓' },
                { feature: 'Surgery Coverage', basic: '×', comp: '✓', premium: '✓' },
                { feature: 'International Coverage', basic: '×', comp: '×', premium: '✓' },
              ].map((row) => (
                <tr key={row.feature} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{row.feature}</td>
                  <td className="py-3 px-4 text-center">{row.basic}</td>
                  <td className="py-3 px-4 text-center">{row.comp}</td>
                  <td className="py-3 px-4 text-center">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

