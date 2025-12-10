import employeesDataRaw from "@/data/employees.json";
import claimsDataRaw from "@/data/claims.json";

interface Employee {
  id: string;
  corporateId: string;
  planId: string;
}

interface Claim {
  id: string;
  corporateId: string;
  status: string;
  createdAt: string;
}

const employeesData = employeesDataRaw as Employee[];
const claimsData = claimsDataRaw as Claim[];

export default function CorporateProfilePage() {
  // Total employees in system
  const totalEmployees = employeesData.length;

  // For Acme Ltd (corp-001)
  const corporateId = "corp-001";
  const corpEmployees = employeesData.filter(
    (emp) => emp.corporateId === corporateId
  );

  // Count employees by plan for Acme Ltd
  const goldPlanEmployees = corpEmployees.filter(
    (emp) => emp.planId === "plan-acme-gold-2025"
  ).length;
  const basicPlanEmployees = corpEmployees.filter(
    (emp) => emp.planId === "plan-acme-basic-2025"
  ).length;

  // Count claims for this month
  const currentDate = new Date("2025-10-06");
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const thisMonthClaims = claimsData.filter((claim) => {
    const claimDate = new Date(claim.createdAt);
    return (
      claim.corporateId === corporateId &&
      claimDate.getMonth() === currentMonth &&
      claimDate.getFullYear() === currentYear
    );
  }).length;
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Company Profile
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Company Information
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    defaultValue="TechCorp Ltd."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900">
                      <option>Technology</option>
                      <option>Finance</option>
                      <option>Healthcare</option>
                      <option>Manufacturing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Size
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900">
                      <option>201-500</option>
                      <option>1-50</option>
                      <option>51-200</option>
                      <option>501-1000</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    defaultValue="123 Business Avenue, Suite 100, Tech City, TC 12345"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      defaultValue="+92-300-1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      defaultValue="contact@techcorp.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Contact Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Primary Contact
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      defaultValue="Ahmed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      defaultValue="Khan"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    defaultValue="HR Director"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      defaultValue="ahmed.khan@techcorp.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      defaultValue="+92-300-7654321"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                Save Changes
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Account Status
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Account Type</p>
                  <p className="font-semibold text-gray-900">
                    Corporate Premium
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Member Since</p>
                  <p className="font-semibold text-gray-900">January 2023</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className="inline-block px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Quick Stats
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Employees</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {totalEmployees}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Policies</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalEmployees}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    This Month Claims
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {thisMonthClaims}
                  </p>
                </div>
              </div>
            </div>

            {/* Insurance Plans Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Insurance Plans
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Gold Plan</p>
                    <p className="text-sm text-gray-500">
                      {goldPlanEmployees} employees
                    </p>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Basic Plan</p>
                    <p className="text-sm text-gray-500">
                      {basicPlanEmployees} employees
                    </p>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
