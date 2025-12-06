import claims from "@/data/claims.json";
import type { Claim } from "@/types/claims";
import { formatPKR, formatPKRShort } from "@/lib/format";

export default function PatientDashboard() {
  const allClaims = claims as Claim[];
  const totalClaims = allClaims.length;
  const approved = allClaims.filter((c) => c.status === "Approved").length;
  const pending = allClaims.filter((c) => c.status === "Pending").length;
  const totalValue = allClaims.reduce((s, c) => s + (c.amountClaimed || 0), 0);
  const paidTotal = allClaims
    .filter((c) => c.status === "Approved")
    .reduce((s, c) => s + (c.amountClaimed || 0), 0);

  const recent = allClaims
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.admissionDate).getTime() -
        new Date(a.createdAt || a.admissionDate).getTime()
    )
    .slice(0, 2)
    .map((c) => ({
      id: c.id,
      date: c.createdAt || c.admissionDate,
      amount: formatPKR(c.amountClaimed || 0),
      status: c.status,
    }));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Patient Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Active Claims</p>
          <p className="text-3xl font-bold text-blue-600">
            {pending + (totalClaims - approved - pending)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {approved} approved, {pending} pending
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Total Claims Value</p>
          <p className="text-3xl font-bold text-green-600">
            {formatPKRShort(totalValue)}
          </p>
          <p className="text-sm text-gray-600 mt-2">Aggregate across claims</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Paid (Approved)</p>
          <p className="text-3xl font-bold text-purple-600">
            {formatPKRShort(paidTotal)}
          </p>
          <p className="text-sm text-gray-600 mt-2">Total approved payouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Claims
          </h2>
          <div className="space-y-3">
            {recent.map((claim) => (
              <div
                key={claim.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">{claim.id}</p>
                  <p className="text-sm text-gray-500">{claim.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{claim.amount}</p>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {claim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Policy Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Policy Number</span>
              <span className="font-semibold">POL-2024-001234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type</span>
              <span className="font-semibold">Comprehensive</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Renewal Date</span>
              <span className="font-semibold">Dec 31, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
