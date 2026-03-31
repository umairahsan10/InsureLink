"use client";

import { useEffect, useMemo, useState } from "react";
import { claimsApi, type Claim } from "@/lib/api/claims";
import { formatPKR } from "@/lib/format";

export default function CorporateClaimsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadClaims = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await claimsApi.getClaims({ page: 1, limit: 100 });
        if (active) {
          setClaims(response.data || []);
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load corporate claims:", err);
          setError("Could not load claims right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadClaims();
    return () => {
      active = false;
    };
  }, []);

  const normalizedClaims = useMemo(
    () =>
      claims.map((claim) => {
        const employeeUser = claim.hospitalVisit?.employee?.user;
        const dependent = claim.hospitalVisit?.dependent;
        const employeeName = employeeUser
          ? `${employeeUser.firstName}${employeeUser.lastName ? ` ${employeeUser.lastName}` : ""}`
          : dependent
            ? `${dependent.firstName} ${dependent.lastName}`
            : "Unknown";

        return {
          id: claim.id,
          claimNumber: claim.claimNumber,
          employeeName,
          createdAt: claim.createdAt,
          amountClaimed: Number(claim.amountClaimed || 0),
          status: claim.claimStatus,
        };
      }),
    [claims],
  );

  // Filter claims based on search term and status
  const filteredClaims = useMemo(() => {
    let filtered = normalizedClaims;

    // Filter by search term (employee name or claim ID)
    if (searchTerm) {
      filtered = filtered.filter(
        (claim) =>
          claim.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== "All Status") {
      filtered = filtered.filter((claim) => claim.status === selectedStatus);
    }

    return filtered;
  }, [normalizedClaims, searchTerm, selectedStatus]);

  // Display all filtered claims (not just first 10)
  const displayedClaims = filteredClaims;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Paid":
        return "bg-blue-100 text-blue-800";
      case "OnHold":
        return "bg-orange-100 text-orange-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplayName = (status: string) => {
    if (status === "OnHold") return "On Hold";
    return status;
  };

  const totalClaimedAmount = useMemo(
    () => normalizedClaims.reduce((sum, claim) => sum + claim.amountClaimed, 0),
    [normalizedClaims],
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Employee Claims</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Claims</p>
          <p className="text-2xl font-bold text-gray-900">
            {normalizedClaims.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {normalizedClaims.filter((claim) => claim.status === "Pending").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {normalizedClaims.filter((claim) => claim.status === "Approved").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600">{formatPKR(totalClaimedAmount)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by employee or claim ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>OnHold</option>
              <option>Paid</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading claims...
                  </td>
                </tr>
              ) : displayedClaims.length > 0 ? (
                displayedClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {claim.claimNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {claim.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPKR(claim.amountClaimed)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          claim.status
                        )}`}
                      >
                        {getStatusDisplayName(claim.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No claims found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">
                {filteredClaims.length}
              </span>{" "}
              of <span className="font-medium">{filteredClaims.length}</span>{" "}
              claims
              {filteredClaims.length !== normalizedClaims.length && (
                <span className="text-gray-500">
                  {" "}(filtered from {normalizedClaims.length} total)
                </span>
              )}
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 text-sm text-white bg-purple-600 border border-purple-600 rounded-md">
                1
              </button>
              <button className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
