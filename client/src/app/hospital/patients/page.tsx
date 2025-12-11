"use client";

import { useMemo, useState, useEffect } from "react";
import PatientDetailsModal from "@/components/modals/PatientDetailsModal";
import PatientRegistrationModal from "@/components/modals/PatientRegistrationModal";
import patientsDataRaw from "@/data/patients.json";
import type { Patient } from "@/types/patient";

const patientsData = patientsDataRaw as Patient[];

export default function HospitalPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [insuranceFilter, setInsuranceFilter] = useState("All Insurance Types");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [registeredPatients, setRegisteredPatients] = useState<Patient[]>([]);

  const patients = useMemo(() => {
    const allPatients = [...patientsData, ...registeredPatients];
    return allPatients.map((patient) => ({
      ...patient,
      lastVisitDate: new Date(patient.lastVisitDate),
    }));
  }, [registeredPatients]);

  // Get unique insurance types from patients data
  const insuranceTypes = useMemo(() => {
    const types = new Set(patients.map((p) => p.insurance));
    return Array.from(types).sort();
  }, [patients]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const today = new Date("2025-10-06");
    return {
      totalPatients: patients.length,
      todaysVisits: patients.filter(
        (p) => p.lastVisitDate.toDateString() === today.toDateString()
      ).length,
      withInsurance: patients.filter((p) => p.insured).length,
      activeClaims: patients.filter((p) => p.status === "Active").length,
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        insuranceFilter === "All Insurance Types" ||
        patient.insurance === insuranceFilter;

      return matchesSearch && matchesFilter;
    });
  }, [patients, searchQuery, insuranceFilter]);

  // Reset page when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, insuranceFilter, itemsPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / itemsPerPage)
  );

  const displayedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(start, start + itemsPerPage);
  }, [filteredPatients, currentPage, itemsPerPage]);

  const handlePatientRegistration = (newPatientData: any) => {
    // Generate a unique patient ID based on total existing patients
    const totalExistingPatients =
      patientsData.length + registeredPatients.length;
    const newPatientId = `PAT-${1001 + totalExistingPatients}`;

    // Create new patient object with all required fields
    const newPatient: Patient = {
      id: newPatientId,
      employeeId: null,
      name: newPatientData.name,
      age: parseInt(newPatientData.age),
      gender: newPatientData.gender,
      dateOfBirth: new Date(
        new Date().getFullYear() - parseInt(newPatientData.age),
        0,
        1
      )
        .toISOString()
        .split("T")[0],
      email: newPatientData.email,
      mobile: newPatientData.phone,
      cnic: newPatientData.cnic,
      address: newPatientData.address,
      corporateId: null,
      corporateName: null,
      planId: null,
      designation: null,
      department: null,
      coverageStart: null,
      coverageEnd: null,
      insured: newPatientData.insurance !== "None",
      insurance: newPatientData.insurance,
      status: newPatientData.status,
      bloodGroup: "Unknown",
      emergencyContact: {
        name: "",
        relation: "",
        phone: "",
      },
      medicalHistory: [],
      allergies: [],
      lastVisit: new Date().toISOString().split("T")[0],
      lastVisitDate: new Date().toISOString().split("T")[0],
      registrationDate: new Date().toISOString().split("T")[0],
      hasActiveClaims: false,
    };

    setRegisteredPatients([...registeredPatients, newPatient]);
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Patient Records
          </h1>
          <p className="text-xs lg:text-sm text-gray-600">
            Manage patient information and records
          </p>
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-green-700 text-sm lg:text-base"
        >
          + Register Patient
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Patients</p>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.totalPatients}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Today&apos;s Visits</p>
          <p className="text-2xl font-bold text-blue-600">
            {analytics.todaysVisits}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">With Insurance</p>
          <p className="text-2xl font-bold text-green-600">
            {analytics.withInsurance}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Claims</p>
          <p className="text-2xl font-bold text-orange-600">
            {analytics.activeClaims}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-3 lg:p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
            <input
              type="text"
              placeholder="Search by name or patient ID..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1 px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
            />
            <select
              value={insuranceFilter}
              onChange={(event) => setInsuranceFilter(event.target.value)}
              className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm lg:text-base"
            >
              <option>All Insurance Types</option>
              {insuranceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Patient ID
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Age
                </th>
                <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Visit
                </th>
                <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Insurance
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No patients match your current filters.
                  </td>
                </tr>
              ) : (
                displayedPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm font-medium text-gray-900">
                      {patient.id}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-900">
                      {patient.name}
                    </td>
                    <td className="hidden sm:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                      {patient.age}
                    </td>
                    <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                      {patient.lastVisit}
                    </td>
                    <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                      {patient.insurance}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          patient.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm">
                      <button
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setIsPatientDetailsOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
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

      {/* Pagination Info */}
      {filteredPatients.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden border border-gray-200 px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {filteredPatients.length === 0
                    ? 0
                    : (currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    filteredPatients.length,
                    currentPage * itemsPerPage
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filteredPatients.length}</span>{" "}
                patients
                {filteredPatients.length !== patients.length && (
                  <span className="text-gray-500">
                    {" "}
                    (filtered from {patients.length} total)
                  </span>
                )}
              </p>

              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-sm rounded-md border ${
                  currentPage === 1
                    ? "text-gray-300 border-gray-200 bg-gray-50"
                    : "text-gray-500 border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 text-sm rounded-md border ${
                    p === currentPage
                      ? "text-white bg-blue-600 border-blue-600"
                      : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-sm rounded-md border ${
                  currentPage === totalPages
                    ? "text-gray-300 border-gray-200 bg-gray-50"
                    : "text-gray-500 border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <PatientRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handlePatientRegistration}
      />

      {selectedPatientId && (
        <PatientDetailsModal
          isOpen={isPatientDetailsOpen}
          onClose={() => {
            setIsPatientDetailsOpen(false);
            setSelectedPatientId(null);
          }}
          patientId={selectedPatientId}
          patientData={
            patients.find((p) => p.id === selectedPatientId)
              ? ({
                  ...patients.find((p) => p.id === selectedPatientId)!,
                  lastVisitDate: patients
                    .find((p) => p.id === selectedPatientId)!
                    .lastVisitDate.toISOString()
                    .split("T")[0],
                } as any)
              : undefined
          }
        />
      )}
    </div>
  );
}
