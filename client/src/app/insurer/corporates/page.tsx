"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import CorporateEmployeesModal from "@/components/insurer/CorporateEmployeesModal";
import { corporatesApi, Corporate } from "@/lib/api/corporates";
import { useNotifications } from "@/hooks/useNotifications";

export default function InsurerCorporatesPage() {
  const router = useRouter();
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [totalCorporates, setTotalCorporates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCorporate, setSelectedCorporate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const { notifications: insurerNotifications, dismiss, markAsRead } = useNotifications();

  const fetchCorporates = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await corporatesApi.listCorporates({
        search: searchQuery || undefined,
        status: (statusFilter as "Active" | "Inactive" | "Suspended") || undefined,
        page: currentPage,
        limit: 20,
      });
      setCorporates(result.items);
      setTotalCorporates(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load corporates");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    fetchCorporates();
  }, [fetchCorporates]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Calculate analytics from loaded data
  const analytics = useMemo(() => {
    const activePolicies = corporates.filter(
      (c) => c.status === "Active"
    ).length;
    const coveredEmployees = corporates.reduce(
      (sum, corp) => sum + (corp.employeeCount || 0),
      0
    );

    return {
      totalCorporates,
      activePolicies,
      coveredEmployees,
    };
  }, [corporates, totalCorporates]);

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "Suspended":
        return "bg-yellow-100 text-yellow-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const handleViewClick = (corporateId: string, corporateName: string) => {
    setSelectedCorporate({ id: corporateId, name: corporateName });
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout
      userRole="insurer"
      userName="HealthGuard Insurance"
      notifications={insurerNotifications}
      onNotificationDismiss={(id) => dismiss(id)}
      onNotificationSelect={(notification) => {
        if (!notification.isRead) markAsRead(notification.id);
        if (notification.category === "messaging") {
          router.push("/insurer/claims");
        }
      }}
    >
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Corporate Clients
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total Corporates</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.totalCorporates}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Active Policies</p>
            <p className="text-2xl font-bold text-green-600">
              {analytics.activePolicies}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Covered Employees</p>
            <p className="text-2xl font-bold text-blue-600">
              {analytics.coveredEmployees}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search corporate clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading && corporates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : corporates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      No corporate clients found.
                    </td>
                  </tr>
                ) : (
                  corporates.map((corporate) => (
                    <tr key={corporate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {corporate.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {corporate.city}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {corporate.employeeCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {corporate.contactName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClasses(
                            corporate.status || "Active"
                          )}`}
                        >
                          {corporate.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() =>
                            handleViewClick(corporate.id, corporate.name)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Corporate Employees Modal */}
      {selectedCorporate && (
        <CorporateEmployeesModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCorporate(null);
          }}
          corporateId={selectedCorporate.id}
          corporateName={selectedCorporate.name}
        />
      )}
    </DashboardLayout>
  );
}
