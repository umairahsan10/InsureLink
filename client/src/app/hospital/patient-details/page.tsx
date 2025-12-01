"use client";

import { useState } from "react";
import HospitalSidebar from "@/components/hospital/HospitalSidebar";
import employeesData from "@/data/employees.json";
import plansData from "@/data/plans.json";
import corporatesData from "@/data/corporates.json";
import claimsData from "@/data/claims.json";

interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  mobile: string;
  corporateId: string;
  planId: string;
  coverageStart: string;
  coverageEnd: string;
  designation: string;
  department: string;
}

interface Plan {
  id: string;
  name: string;
  corporateId: string;
  sumInsured: number;
  deductible: number;
  copayPercent: number;
  coveredServices: string[];
  limits: { [key: string]: number };
  validFrom: string;
  validUntil: string;
}

interface Corporate {
  id: string;
  name: string;
  hrContact: {
    name: string;
    email: string;
    phone: string;
  };
  totalEmployees: number;
  plans: string[];
  contractStart: string;
  contractEnd: string;
}

interface Claim {
  id: string;
  claimNumber: string;
  employeeId: string;
  employeeName: string;
  corporateId: string;
  corporateName: string;
  hospitalId: string;
  hospitalName: string;
  planId: string;
  status: string;
  amountClaimed: number;
  approvedAmount: number;
  admissionDate: string;
  dischargeDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function HospitalPatientDetailsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Employee | null>(null);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);

  const employees = employeesData as Employee[];
  const plans = plansData as Plan[];
  const corporates = corporatesData as Corporate[];
  const claims = claimsData as Claim[];

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);

    // Simulate API call delay
    setTimeout(() => {
      const results = employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.mobile.includes(searchTerm) ||
          employee.employeeNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const handleSelectPatient = (patient: Employee) => {
    setSelectedPatient(patient);

    // Filter claims for this patient
    const patientClaims = claims.filter(
      (claim) => claim.employeeId === patient.id
    );
    setFilteredClaims(patientClaims);

    // Scroll to top of detailed view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewSearch = () => {
    setSelectedPatient(null);
    setFilteredClaims([]);
    setSearchResults([]);
    setSearchTerm("");
  };

  const getPlanDetails = (planId: string) => {
    return plans.find((plan) => plan.id === planId);
  };

  const getCorporateDetails = (corporateId: string) => {
    return corporates.find((corp) => corp.id === corporateId);
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <HospitalSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="ml-0 lg:ml-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Patient Details
                </h1>
                <p className="text-xs lg:text-sm text-gray-600">
                  Search and view comprehensive patient information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Search Section - Always Visible */}
          <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 mb-4 lg:mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search by name, email, mobile, or employee number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Patient Details View */}
          {selectedPatient && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={handleNewSearch}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                New Search
              </button>

              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Personal Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPatient.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employee Number</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPatient.employeeNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPatient.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mobile</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPatient.mobile}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Designation</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPatient.designation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPatient.department}
                    </p>
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Insurance Coverage
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Coverage Start</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(selectedPatient.coverageStart)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Coverage End</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(selectedPatient.coverageEnd)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              {(() => {
                const plan = getPlanDetails(selectedPatient.planId);
                if (!plan) return null;
                return (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Plan Details: {plan.name}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Sum Insured</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(plan.sumInsured)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Deductible</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(plan.deductible)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Copay</p>
                        <p className="font-semibold text-gray-900">
                          {plan.copayPercent}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Valid From</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(plan.validFrom)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Covered Services
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {plan.coveredServices.map((service) => (
                          <span
                            key={service}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Corporate Information */}
              {(() => {
                const corporate = getCorporateDetails(
                  selectedPatient.corporateId
                );
                if (!corporate) return null;
                return (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      Corporate: {corporate.name}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">HR Contact</p>
                        <p className="font-semibold text-gray-900">
                          {corporate.hrContact.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">
                          {corporate.hrContact.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-semibold text-gray-900">
                          {corporate.hrContact.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Employees</p>
                        <p className="font-semibold text-gray-900">
                          {corporate.totalEmployees}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Claims History */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Claims History ({filteredClaims.length})
                </h2>
                {filteredClaims.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No claims found for this patient.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Claim Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hospital
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Admission Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount Claimed
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClaims.map((claim) => (
                          <tr key={claim.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {claim.claimNumber}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {claim.hospitalName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(claim.admissionDate)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(claim.amountClaimed)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  claim.status === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : claim.status === "Rejected"
                                    ? "bg-red-100 text-red-800"
                                    : claim.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {claim.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Results */}
          {!selectedPatient && searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Results ({searchResults.length})
              </h2>
              <div className="space-y-3">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {patient.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {patient.email} • {patient.mobile}
                        </p>
                        <p className="text-sm text-gray-500">
                          #{patient.employeeNumber} • {patient.designation}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!selectedPatient &&
            searchTerm &&
            searchResults.length === 0 &&
            !isSearching && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500">
                  No patients found. Try a different search term.
                </p>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
