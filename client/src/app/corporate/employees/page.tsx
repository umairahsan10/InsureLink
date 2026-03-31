"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AddEmployeeModal from "@/components/corporate/AddEmployeeModal";
import DependentRequestsTable from "@/components/corporate/DependentRequestsTable";
import DependentReviewModal from "@/components/corporate/DependentReviewModal";
import EmployeeDependentsModal from "@/components/corporate/EmployeeDependentsModal";
import BulkUploadModal from "@/components/corporate/BulkUploadModal";
import InvalidEmployeesTable from "@/components/corporate/InvalidEmployeesTable";
import type { EmployeePlanOption } from "@/components/forms/EmployeeForm";
import { useAuth } from "@/hooks/useAuth";
import { employeesApi, type CreateEmployeeRequest } from "@/lib/api/employees";
import { corporatesApi } from "@/lib/api/corporates";
import { insurersApi } from "@/lib/api/insurers";
import {
  dependentsApi,
  type Dependent as ApiDependent,
} from "@/lib/api/dependents";
import { Employee } from "@/types/employee";
import { Dependent } from "@/types/dependent";

const pageSize = 10;
const departmentOptions = [
  "R&D",
  "Product",
  "Finance",
  "People",
  "IT",
  "Engineering",
  "Sales",
  "Logistics",
  "Production",
  "Design",
  "Customer",
];

function parseApiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;

  try {
    const raw = JSON.parse(err.message) as {
      message?: string;
      errors?: string[];
    };
    if (Array.isArray(raw.errors) && raw.errors.length > 0) {
      return raw.errors.join(", ");
    }
    if (typeof raw.message === "string" && raw.message) {
      return raw.message;
    }
  } catch {
    // ignore parsing errors and use plain message
  }

  return err.message || fallback;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] || "Employee", lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function defaultCoverageStart(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultCoverageEnd(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function toUiEmployee(
  employee: Awaited<ReturnType<typeof employeesApi.getById>>,
): Employee {
  const fullName = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    name: fullName || employee.email,
    email: employee.email,
    mobile: employee.phone,
    corporateId: employee.corporateId,
    planId: employee.planId,
    coverageStart: new Date(employee.coverageStartDate)
      .toISOString()
      .slice(0, 10),
    coverageEnd: new Date(employee.coverageEndDate).toISOString().slice(0, 10),
    designation: employee.designation,
    department: employee.department,
  };
}

function toUiDependent(dep: ApiDependent, employeeName: string): Dependent {
  return {
    id: dep.id,
    employeeId: dep.employeeId,
    employeeName,
    corporateId: dep.corporateId,
    name: dep.name,
    relationship: dep.relationship as Dependent["relationship"],
    dateOfBirth: dep.dateOfBirth,
    gender: dep.gender as Dependent["gender"],
    cnic: dep.cnic || "",
    phoneNumber: dep.phoneNumber,
    status: dep.status as Dependent["status"],
    requestedAt: dep.requestedAt,
    reviewedAt: dep.reviewedAt,
    rejectionReason: dep.rejectionReason,
    documents: [],
    coverageStartDate: dep.coverageStartDate || "",
  };
}

export default function CorporateEmployeesPage() {
  const { user } = useAuth();
  const corporateId = user?.corporateId;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(
    null,
  );
  const [removedEmployeeMessage, setRemovedEmployeeMessage] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "employees" | "requests" | "invalid"
  >("employees");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [invalidReloadKey, setInvalidReloadKey] = useState(0);

  const [pendingRequests, setPendingRequests] = useState<Dependent[]>([]);
  const [selectedDependent, setSelectedDependent] = useState<Dependent | null>(
    null,
  );
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<{
    name: string;
    dependents: Dependent[];
  } | null>(null);
  const [isDependentsModalOpen, setIsDependentsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [defaultPlanId, setDefaultPlanId] = useState<string>("");
  const [planOptions, setPlanOptions] = useState<EmployeePlanOption[]>([]);
  const [contractStartDate, setContractStartDate] = useState<string>("");
  const [contractEndDate, setContractEndDate] = useState<string>("");

  const employeeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach((emp) => {
      map[emp.id] = emp.name;
    });
    return map;
  }, [employees]);

  const loadEmployees = useCallback(async () => {
    if (!corporateId) {
      setError("Corporate profile is not linked to this account.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await employeesApi.list({
        corporateId,
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        department:
          selectedDepartment === "All Departments"
            ? undefined
            : selectedDepartment === "Human Resources"
              ? "People"
              : selectedDepartment,
      });

      setEmployees(response.items.map(toUiEmployee));
      setTotalEmployees(response.total);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setError(
        parseApiErrorMessage(err, "Could not load employees right now."),
      );
      setEmployees([]);
      setTotalEmployees(0);
    } finally {
      setLoading(false);
    }
  }, [corporateId, currentPage, searchTerm, selectedDepartment]);

  const loadPendingRequests = useCallback(async () => {
    if (!corporateId) return;

    try {
      const response = await dependentsApi.list({
        corporateId,
        status: "Pending",
        page: 1,
        limit: 100,
      });

      const mapped = response.items.map((dep) =>
        toUiDependent(dep, employeeNameById[dep.employeeId] || "Employee"),
      );
      setPendingRequests(mapped);
    } catch (err) {
      console.error("Failed to load pending dependent requests:", err);
      setPendingRequests([]);
    }
  }, [corporateId, employeeNameById]);

  const loadDefaultPlan = useCallback(async () => {
    if (!corporateId) return;

    try {
      const corporate = await corporatesApi.getCorporateById(corporateId);
      setContractStartDate(
        new Date(corporate.contractStartDate).toISOString().slice(0, 10),
      );
      setContractEndDate(
        new Date(corporate.contractEndDate).toISOString().slice(0, 10),
      );
      const plans = await insurersApi.getPlans(corporate.insurerId, true);
      const fallbackPlan = plans[0]?.id;
      setPlanOptions(
        plans.map((plan) => ({
          id: plan.id,
          label: `${plan.planName} (${plan.planCode})`,
        })),
      );
      if (fallbackPlan) {
        setDefaultPlanId(fallbackPlan);
      }
    } catch (err) {
      console.error(
        "Failed to load default plan for employee onboarding:",
        err,
      );
    }
  }, [corporateId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadPendingRequests();
  }, [loadPendingRequests]);

  useEffect(() => {
    loadDefaultPlan();
  }, [loadDefaultPlan]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment]);

  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize));

  const handleRemoveClick = (employee: Employee) => {
    setEmployeeToRemove(employee);
  };

  const handleOpenDependents = async (employee: Employee) => {
    try {
      const response = await dependentsApi.list({
        employeeId: employee.id,
        page: 1,
        limit: 100,
      });

      const mapped = response.items.map((dep) =>
        toUiDependent(dep, employee.name),
      );
      setSelectedEmployeeForView({ name: employee.name, dependents: mapped });
      setIsDependentsModalOpen(true);
    } catch (err) {
      console.error("Failed to load employee dependents:", err);
      setError(
        parseApiErrorMessage(
          err,
          "Could not load dependents for this employee.",
        ),
      );
    }
  };

  const createEmployeePayload = (input: {
    employeeNumber: string;
    name: string;
    email: string;
    mobile: string;
    planId: string;
    designation: string;
    department: string;
    coverageStart?: string;
    coverageEnd?: string;
  }): CreateEmployeeRequest | null => {
    if (!corporateId) return null;

    const { firstName, lastName } = splitName(input.name);
    const coverageStartDate = input.coverageStart || defaultCoverageStart();
    const coverageEndDate = input.coverageEnd || defaultCoverageEnd();
    const effectivePlanId = input.planId || defaultPlanId;

    if (!effectivePlanId) {
      setError(
        "No insurer plan is assigned to this corporate yet. Please configure at least one plan first.",
      );
      return null;
    }

    const generatedPassword = `${input.employeeNumber}@Temp123`;

    return {
      corporateId,
      planId: effectivePlanId,
      employeeNumber: input.employeeNumber,
      email: input.email,
      password: generatedPassword,
      firstName,
      lastName: lastName || undefined,
      phone: input.mobile,
      coverageStartDate,
      coverageEndDate,
      designation: input.designation || "Employee",
      department: input.department || "General",
      cnic: undefined,
      dob: undefined,
      gender: undefined,
      address: undefined,
    };
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Employees
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-initial bg-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base"
          >
            + Add Employee
          </button>
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex-1 sm:flex-initial bg-green-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
          >
            📤 Bulk Upload
          </button>
          <button
            onClick={() => setIsRemoveMode((prev) => !prev)}
            className={`flex-1 sm:flex-initial px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
              isRemoveMode
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            − Remove Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {removedEmployeeMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg">
          {removedEmployeeMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">
            {totalEmployees}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Policies</p>
          <p className="text-xl md:text-2xl font-bold text-green-600">
            {totalEmployees}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending Dependent Requests</p>
          <p className="text-xl md:text-2xl font-bold text-orange-600">
            {pendingRequests.length}
          </p>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("employees")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "employees"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
              activeTab === "requests"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Dependent Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("invalid")}
            className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
              activeTab === "invalid"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Invalid Employees
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === "employees" ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm md:text-base text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm md:text-base text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option>All Departments</option>
                  {departmentOptions.map((department) => (
                    <option key={department}>
                      {department === "People" ? "Human Resources" : department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dependents
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Policy Status
                    </th>
                    {isRemoveMode && (
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remove
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={isRemoveMode ? 8 : 7}
                        className="px-4 md:px-6 py-8 text-center text-gray-500"
                      >
                        Loading employees...
                      </td>
                    </tr>
                  ) : employees.length > 0 ? (
                    employees.map((employee) => {
                      const dependentCount = pendingRequests.filter(
                        (dep) => dep.employeeId === employee.id,
                      ).length;

                      return (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {employee.name}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.employeeNumber}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.department}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.designation}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {employee.email}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                void handleOpenDependents(employee);
                              }}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              👥 {dependentCount}
                            </button>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          {isRemoveMode && (
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => handleRemoveClick(employee)}
                                title="Remove Employee"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 text-white text-2xl hover:bg-red-700 transition-colors"
                              >
                                &minus;
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={isRemoveMode ? 8 : 7}
                        className="px-4 md:px-6 py-8 text-center text-gray-500"
                      >
                        No employees found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : activeTab === "requests" ? (
          <div className="p-4">
            <DependentRequestsTable
              requests={pendingRequests}
              onReview={(dependent) => {
                setSelectedDependent(dependent);
                setIsReviewModalOpen(true);
              }}
            />
          </div>
        ) : (
          <div className="p-4">
            <InvalidEmployeesTable
              corporateId={corporateId || ""}
              reloadKey={invalidReloadKey}
              contractStartDate={contractStartDate}
              contractEndDate={contractEndDate}
            />
          </div>
        )}

        {activeTab === "employees" && (
          <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs md:text-sm text-gray-700 text-center sm:text-left">
              Showing{" "}
              <span className="font-medium">
                {Math.max(
                  (currentPage - 1) * pageSize + 1,
                  totalEmployees === 0 ? 0 : 1,
                )}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, totalEmployees)}
              </span>{" "}
              of <span className="font-medium">{totalEmployees}</span> employees
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 md:px-3 py-1 text-xs md:text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              <div className="hidden sm:flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded-md ${
                      currentPage === i + 1
                        ? "bg-purple-600 text-white border border-purple-600"
                        : "bg-white text-gray-500 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-2 md:px-3 py-1 text-xs md:text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        corporateId={corporateId || ""}
        onUploadComplete={() => {
          // Refresh the employees list and invalid employees
          loadEmployees();
          setInvalidReloadKey((prev) => prev + 1);
        }}
      />

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        planOptions={planOptions}
        departmentOptions={departmentOptions}
        onAddEmployee={async (employeeData) => {
          const payload = createEmployeePayload({
            employeeNumber: employeeData.employeeNumber,
            name: employeeData.name,
            email: employeeData.email,
            mobile: employeeData.mobile,
            planId: employeeData.planId,
            designation: employeeData.designation,
            department: employeeData.department,
            coverageStart: employeeData.coverageStartDate,
            coverageEnd: employeeData.coverageEndDate,
          });

          if (!payload) {
            throw new Error(
              "No valid insurance plan is available for this corporate account.",
            );
          }

          try {
            await employeesApi.create(payload);
            await loadEmployees();
            setRemovedEmployeeMessage(
              `Employee ${employeeData.name} added successfully!`,
            );
          } catch (err) {
            throw new Error(
              parseApiErrorMessage(
                err,
                "Failed to add employee. Please verify details and try again.",
              ),
            );
          }
        }}
        coverageMinDate={contractStartDate}
        coverageMaxDate={contractEndDate}
      />

      {employeeToRemove && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
              <h2 className="text-lg font-bold text-black text-center">
                Confirm Removal
              </h2>
            </div>
            <div className="p-6 text-black">
              <p className="mb-6 text-center">
                Are you sure you want to remove{" "}
                <span className="font-semibold">{employeeToRemove.name}</span>?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setEmployeeToRemove(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-black hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await employeesApi.remove(employeeToRemove.id);
                      setRemovedEmployeeMessage(
                        `Employee ${employeeToRemove.name} removed successfully!`,
                      );
                      setEmployeeToRemove(null);
                      await loadEmployees();
                      setTimeout(() => setRemovedEmployeeMessage(null), 3000);
                    } catch (err) {
                      setError(
                        parseApiErrorMessage(err, "Failed to remove employee."),
                      );
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DependentReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedDependent(null);
        }}
        dependent={selectedDependent}
        onApprove={async (dependentId) => {
          await dependentsApi.approve(dependentId);
        }}
        onReject={async (dependentId, rejectionReason) => {
          await dependentsApi.reject(dependentId, rejectionReason);
        }}
        onSuccess={() => {
          void loadPendingRequests();
        }}
      />

      {selectedEmployeeForView && (
        <EmployeeDependentsModal
          isOpen={isDependentsModalOpen}
          onClose={() => {
            setIsDependentsModalOpen(false);
            setSelectedEmployeeForView(null);
          }}
          employeeName={selectedEmployeeForView.name}
          dependents={selectedEmployeeForView.dependents}
        />
      )}
    </div>
  );
}
