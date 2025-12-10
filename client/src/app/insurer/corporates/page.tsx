"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import CorporateEmployeesModal from "@/components/insurer/CorporateEmployeesModal";
import AddCorporateModal from "@/components/modals/AddCorporateModal";
import corporatesData from "@/data/corporates.json";
import employeesDataRaw from "@/data/employees.json";
import notificationsData from "@/data/insurerNotifications.json";
import { AlertNotification } from "@/types";

interface CorporateData {
  id: string;
  name: string;
  industry: string;
  planType: string;
  premium: string;
  status: string;
  totalEmployees?: number;
  hrContact?: {
    name: string;
    email: string;
    phone: string;
  };
  contractStart?: string;
  contractEnd?: string;
  plans?: string[];
}

interface EmployeeData {
  id: string;
  corporateId: string;
}

const CORPORATES_STORAGE_KEY = "insurer_corporates";

export default function InsurerCorporatesPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize with default data to avoid hydration mismatch
  const [localCorporates, setLocalCorporates] = useState<CorporateData[]>(
    corporatesData as CorporateData[]
  );

  const employees = employeesDataRaw as EmployeeData[];
  const corporates = localCorporates;

  // Load from localStorage and sync on client side only
  useEffect(() => {
    const saved = localStorage.getItem(CORPORATES_STORAGE_KEY);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setLocalCorporates(parsedData);
      } catch (e) {
        console.error("Failed to parse saved corporates", e);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever corporates change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        CORPORATES_STORAGE_KEY,
        JSON.stringify(localCorporates)
      );
      // Dispatch custom event to notify other pages
      window.dispatchEvent(
        new CustomEvent("corporatesUpdated", { detail: localCorporates })
      );
    }
  }, [localCorporates, isHydrated]);

  const insurerNotifications = useMemo(
    () =>
      (notificationsData as AlertNotification[]).map((notification) => ({
        ...notification,
      })),
    []
  );
  const industries = useMemo(
    () => [
      "All Industries",
      ...Array.from(
        new Set(
          localCorporates.map((corporate) => corporate.industry).filter(Boolean)
        )
      ),
    ],
    [localCorporates]
  );
  const planTypes = useMemo(
    () => [
      "All Plans",
      ...Array.from(
        new Set(
          localCorporates.map((corporate) => corporate.planType).filter(Boolean)
        )
      ),
    ],
    [localCorporates]
  );
  const [selectedCorporate, setSelectedCorporate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All Industries");
  const [planFilter, setPlanFilter] = useState("All Plans");

  // Calculate analytics from actual data
  const analytics = useMemo(() => {
    const totalCorporates = corporates.length;
    const activePolicies = corporates.filter(
      (c) => c.status === "Active"
    ).length;

    // Calculate covered employees by summing totalEmployees from each corporate
    const coveredEmployees = corporates.reduce(
      (sum, corp) => sum + (corp.totalEmployees || 0),
      0
    );

    // Calculate monthly premium by parsing K values
    // Premiums are in format "$45K", "$52K", "$31K"
    const monthlyPremiumInK = corporates.reduce((sum, corp) => {
      // Extract just the number from premium string (e.g., "45" from "$45K")
      const match = corp.premium.match(/(\d+)/);
      const kValue = match ? parseInt(match[1], 10) : 0;
      return sum + kValue;
    }, 0);

    // Total in K, convert to PKR format using formatPKR utility
    // Assuming 1K = 1000 PKR for display
    const monthlyPremiumPKR = `Rs. ${monthlyPremiumInK}K`;

    return {
      totalCorporates,
      activePolicies,
      coveredEmployees,
      monthlyPremium: monthlyPremiumPKR,
    };
  }, [corporates]);

  const filteredCorporates = useMemo(
    () =>
      localCorporates.filter((corporate) => {
        const matchesSearch =
          searchQuery === "" ||
          corporate.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIndustry =
          industryFilter === "All Industries" ||
          corporate.industry === industryFilter;
        const matchesPlan =
          planFilter === "All Plans" || corporate.planType === planFilter;
        return matchesSearch && matchesIndustry && matchesPlan;
      }),
    [localCorporates, industryFilter, planFilter, searchQuery]
  );

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "Pending Renewal":
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
      onNotificationSelect={(notification) => {
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
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Corporate
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Corporates</p>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.totalCorporates}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Active Policies</p>
            <p className="text-2xl font-bold text-green-600">
              {analytics.activePolicies}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Covered Employees</p>
            <p className="text-2xl font-bold text-blue-600">
              {analytics.coveredEmployees}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Monthly Premium</p>
            <p className="text-2xl font-bold text-purple-600">
              {analytics.monthlyPremium}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                {planTypes.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
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
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Premium
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
                {filteredCorporates.map((corporate) => (
                  <tr key={corporate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {corporate.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {corporate.industry}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {corporate.totalEmployees}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {corporate.planType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {corporate.premium}
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
                ))}
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

      <AddCorporateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newCorporate) => {
          setLocalCorporates([...localCorporates, newCorporate]);
          setIsAddModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
}
