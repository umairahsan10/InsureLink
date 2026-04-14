"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/AuthContext";
import { adminApi, InsurerOption } from "@/lib/api/admin";

type UserRole = "admin" | "patient" | "corporate" | "hospital" | "insurer";

const STEPS = [
  { id: 1, title: "User Information" },
  { id: 2, title: "Select Role" },
  { id: 3, title: "Profile Details" },
];

export default function AdminCreateUserPage() {
  const router = useRouter();
  const auth = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [insurers, setInsurers] = useState<InsurerOption[]>([]);

  // User info form state
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    dob: "",
    gender: "",
    cnic: "",
    address: "",
  });

  // Selected role
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");

  // Hospital profile form state
  const [hospitalForm, setHospitalForm] = useState({
    hospitalName: "",
    licenseNumber: "",
    city: "",
    address: "",
    emergencyPhone: "",
    hospitalType: "reimbursable",
    hasEmergencyUnit: true,
  });

  // Insurer profile form state
  const [insurerForm, setInsurerForm] = useState({
    companyName: "",
    licenseNumber: "",
    address: "",
    city: "",
    province: "",
    maxCoverageLimit: "",
    networkHospitalCount: "",
    corporateClientCount: "",
    operatingSince: "",
  });

  // Corporate profile form state
  const [corporateForm, setCorporateForm] = useState({
    name: "",
    address: "",
    city: "",
    province: "",
    employeeCount: "",
    insurerId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contractStartDate: "",
    contractEndDate: "",
  });

  // Check if user is admin
  useEffect(() => {
    if (auth?.user && auth.user.role !== "admin") {
      router.push("/");
    }
  }, [auth, router]);

  // Load insurers for corporate dropdown
  useEffect(() => {
    if (selectedRole === "corporate") {
      loadInsurers();
    }
  }, [selectedRole]);

  const loadInsurers = async () => {
    try {
      const data = await adminApi.getInsurers();
      setInsurers(data);
    } catch {
      console.error("Failed to load insurers");
    }
  };

  const handleUserChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setUserForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleHospitalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setHospitalForm((prev) => ({ ...prev, [e.target.id]: value }));
  };

  const handleInsurerChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setInsurerForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleCorporateChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setCorporateForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const validateStep1 = (): boolean => {
    if (
      !userForm.email ||
      !userForm.password ||
      !userForm.firstName ||
      !userForm.phone
    ) {
      setError("Please fill in all required fields");
      return false;
    }
    if (userForm.password !== userForm.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (userForm.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(userForm.password)) {
      setError("Password must contain uppercase, lowercase, and a number");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!selectedRole) {
      setError("Please select a role");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const payload: Parameters<typeof adminApi.createUserWithProfile>[0] = {
        user: {
          email: userForm.email,
          password: userForm.password,
          firstName: userForm.firstName,
          lastName: userForm.lastName || undefined,
          phone: userForm.phone,
          dob: userForm.dob || undefined,
          gender: userForm.gender as "Male" | "Female" | "Other" | undefined,
          cnic: userForm.cnic || undefined,
          address: userForm.address || undefined,
        },
        role: selectedRole as UserRole,
      };

      // Add role-specific profile
      if (selectedRole === "hospital") {
        payload.hospitalProfile = {
          hospitalName: hospitalForm.hospitalName,
          licenseNumber: hospitalForm.licenseNumber,
          city: hospitalForm.city,
          address: hospitalForm.address,
          emergencyPhone: hospitalForm.emergencyPhone,
          hospitalType: hospitalForm.hospitalType as
            | "reimbursable"
            | "non_reimbursable",
          hasEmergencyUnit: hospitalForm.hasEmergencyUnit,
        };
      } else if (selectedRole === "insurer") {
        payload.insurerProfile = {
          companyName: insurerForm.companyName,
          licenseNumber: insurerForm.licenseNumber,
          address: insurerForm.address,
          city: insurerForm.city,
          province: insurerForm.province,
          maxCoverageLimit: Number(insurerForm.maxCoverageLimit),
          networkHospitalCount: insurerForm.networkHospitalCount
            ? Number(insurerForm.networkHospitalCount)
            : undefined,
          corporateClientCount: insurerForm.corporateClientCount
            ? Number(insurerForm.corporateClientCount)
            : undefined,
          operatingSince: insurerForm.operatingSince,
        };
      } else if (selectedRole === "corporate") {
        payload.corporateProfile = {
          name: corporateForm.name,
          address: corporateForm.address,
          city: corporateForm.city,
          province: corporateForm.province,
          employeeCount: Number(corporateForm.employeeCount),
          insurerId: corporateForm.insurerId,
          contactName: corporateForm.contactName,
          contactEmail: corporateForm.contactEmail,
          contactPhone: corporateForm.contactPhone,
          contractStartDate: corporateForm.contractStartDate,
          contractEndDate: corporateForm.contractEndDate,
        };
      }

      await adminApi.createUserWithProfile(payload);
      setSuccess(`User "${userForm.email}" created successfully!`);

      // Redirect to dashboard after 3 seconds to show the newly created user
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 3000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create user";
      try {
        const parsed = JSON.parse(message);
        setError(parsed.message || message);
      } catch {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUserForm({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      dob: "",
      gender: "",
      cnic: "",
      address: "",
    });
    setSelectedRole("");
    setHospitalForm({
      hospitalName: "",
      licenseNumber: "",
      city: "",
      address: "",
      emergencyPhone: "",
      hospitalType: "reimbursable",
      hasEmergencyUnit: true,
    });
    setInsurerForm({
      companyName: "",
      licenseNumber: "",
      address: "",
      city: "",
      province: "",
      maxCoverageLimit: "",
      networkHospitalCount: "",
      corporateClientCount: "",
      operatingSince: "",
    });
    setCorporateForm({
      name: "",
      address: "",
      city: "",
      province: "",
      employeeCount: "",
      insurerId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contractStartDate: "",
      contractEndDate: "",
    });
  };

  // Role selection cards data
  const roleOptions: {
    value: UserRole;
    label: string;
    description: string;
    icon: string;
  }[] = [
    {
      value: "admin",
      label: "Admin",
      description: "System administrator with full access",
      icon: "🛡️",
    },
    {
      value: "patient",
      label: "Patient",
      description: "Individual healthcare consumer",
      icon: "👤",
    },
    {
      value: "hospital",
      label: "Hospital",
      description: "Healthcare facility provider",
      icon: "🏥",
    },
    {
      value: "insurer",
      label: "Insurer",
      description: "Insurance company",
      icon: "🏢",
    },
    {
      value: "corporate",
      label: "Corporate",
      description: "Corporate client with employees",
      icon: "🏛️",
    },
  ];

  const needsProfileStep =
    selectedRole === "hospital" ||
    selectedRole === "insurer" ||
    selectedRole === "corporate";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New User
          </h1>
          <p className="text-gray-600">
            Admin panel for creating users with their profiles
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isLast = index === STEPS.length - 1;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCompleted ? "✓" : step.id}
                    </div>
                    <span
                      className={`ml-3 font-medium ${
                        isActive ? "text-indigo-600" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="font-semibold text-green-800">{success}</p>
                  <p className="text-sm text-green-700 mt-1">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: User Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      value={userForm.firstName}
                      onChange={handleUserChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={userForm.lastName}
                      onChange={handleUserChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={userForm.email}
                    onChange={handleUserChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      required
                      value={userForm.password}
                      onChange={handleUserChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="••••••••"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Min 8 chars, uppercase, lowercase, and number required
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      required
                      value={userForm.confirmPassword}
                      onChange={handleUserChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={userForm.phone}
                    onChange={handleUserChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="dob"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dob"
                      value={userForm.dob}
                      onChange={handleUserChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={userForm.gender}
                      onChange={handleUserChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="cnic"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      CNIC
                    </label>
                    <input
                      type="text"
                      id="cnic"
                      value={userForm.cnic}
                      onChange={handleUserChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                      placeholder="12345-1234567-1"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Address
                  </label>
                  <textarea
                    id="address"
                    rows={2}
                    value={userForm.address}
                    onChange={handleUserChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                    placeholder="House #, Street, City"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Role Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Select User Role
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`p-6 border-2 rounded-xl text-left transition-all ${
                        selectedRole === role.value
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-3xl mb-2">{role.icon}</div>
                      <h3 className="font-semibold text-gray-900">
                        {role.label}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {role.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Profile Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {!needsProfileStep ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Ready to Create User
                    </h2>
                    <p className="text-gray-600">
                      No additional profile information is required for{" "}
                      {selectedRole} role.
                    </p>
                  </div>
                ) : selectedRole === "hospital" ? (
                  <>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Hospital Profile
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="hospitalName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Hospital Name *
                        </label>
                        <input
                          type="text"
                          id="hospitalName"
                          required
                          value={hospitalForm.hospitalName}
                          onChange={handleHospitalChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="Shifa International Hospital"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="licenseNumber"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          License Number *
                        </label>
                        <input
                          type="text"
                          id="licenseNumber"
                          required
                          value={hospitalForm.licenseNumber}
                          onChange={handleHospitalChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="HOS-2024-001"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Address *
                      </label>
                      <input
                        type="text"
                        id="address"
                        required
                        value={hospitalForm.address}
                        onChange={handleHospitalChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        placeholder="Sector H-8/4, Islamabad"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          City *
                        </label>
                        <input
                          type="text"
                          id="city"
                          required
                          value={hospitalForm.city}
                          onChange={handleHospitalChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="Islamabad"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="emergencyPhone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Emergency Phone *
                        </label>
                        <input
                          type="tel"
                          id="emergencyPhone"
                          required
                          value={hospitalForm.emergencyPhone}
                          onChange={handleHospitalChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="+92 51 846 4646"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="hospitalType"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Hospital Type
                        </label>
                        <select
                          id="hospitalType"
                          value={hospitalForm.hospitalType}
                          onChange={handleHospitalChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        >
                          <option value="reimbursable">Reimbursable</option>
                          <option value="non_reimbursable">
                            Non-Reimbursable
                          </option>
                        </select>
                      </div>

                      <div className="flex items-center pt-6">
                        <input
                          type="checkbox"
                          id="hasEmergencyUnit"
                          checked={hospitalForm.hasEmergencyUnit}
                          onChange={handleHospitalChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="hasEmergencyUnit"
                          className="ml-2 text-sm text-gray-700"
                        >
                          Has Emergency Unit
                        </label>
                      </div>
                    </div>
                  </>
                ) : selectedRole === "insurer" ? (
                  <>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Insurer Profile
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="companyName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Company Name *
                        </label>
                        <input
                          type="text"
                          id="companyName"
                          required
                          value={insurerForm.companyName}
                          onChange={handleInsurerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="EFU Health Insurance"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="licenseNumber"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          License Number *
                        </label>
                        <input
                          type="text"
                          id="licenseNumber"
                          required
                          value={insurerForm.licenseNumber}
                          onChange={handleInsurerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="INS-2024-001"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Address *
                      </label>
                      <textarea
                        id="address"
                        rows={2}
                        required
                        value={insurerForm.address}
                        onChange={handleInsurerChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        placeholder="85-F, Block 6, P.E.C.H.S., Karachi"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          City *
                        </label>
                        <input
                          type="text"
                          id="city"
                          required
                          value={insurerForm.city}
                          onChange={handleInsurerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="Karachi"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="province"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Province *
                        </label>
                        <select
                          id="province"
                          required
                          value={insurerForm.province}
                          onChange={handleInsurerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        >
                          <option value="">Select province</option>
                          <option value="Punjab">Punjab</option>
                          <option value="Sindh">Sindh</option>
                          <option value="KPK">Khyber Pakhtunkhwa</option>
                          <option value="Balochistan">Balochistan</option>
                          <option value="ICT">
                            Islamabad Capital Territory
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="operatingSince"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Operating Since *
                        </label>
                        <input
                          type="date"
                          id="operatingSince"
                          required
                          value={insurerForm.operatingSince}
                          onChange={handleInsurerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="maxCoverageLimit"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Max Coverage Limit (PKR) *
                        </label>
                        <input
                          type="number"
                          id="maxCoverageLimit"
                          required
                          value={insurerForm.maxCoverageLimit}
                          onChange={handleInsurerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="5000000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="networkHospitalCount"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Network Hospitals
                        </label>
                        <input
                          type="number"
                          id="networkHospitalCount"
                          value={insurerForm.networkHospitalCount}
                          onChange={handleInsurerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="120"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="corporateClientCount"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Corporate Clients
                        </label>
                        <input
                          type="number"
                          id="corporateClientCount"
                          value={insurerForm.corporateClientCount}
                          onChange={handleInsurerChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="45"
                        />
                      </div>
                    </div>
                  </>
                ) : selectedRole === "corporate" ? (
                  <>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Corporate Profile
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Company Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          value={corporateForm.name}
                          onChange={handleCorporateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="Tech Corp Ltd"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="insurerId"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Insurer *
                        </label>
                        <select
                          id="insurerId"
                          required
                          value={corporateForm.insurerId}
                          onChange={handleCorporateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        >
                          <option value="">Select insurer</option>
                          {insurers.map((insurer) => (
                            <option key={insurer.id} value={insurer.id}>
                              {insurer.companyName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Address *
                      </label>
                      <textarea
                        id="address"
                        rows={2}
                        required
                        value={corporateForm.address}
                        onChange={handleCorporateChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        placeholder="Plot 123, Block A, Industrial Area"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          City *
                        </label>
                        <input
                          type="text"
                          id="city"
                          required
                          value={corporateForm.city}
                          onChange={handleCorporateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="Lahore"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="province"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Province *
                        </label>
                        <select
                          id="province"
                          required
                          value={corporateForm.province}
                          onChange={handleCorporateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        >
                          <option value="">Select province</option>
                          <option value="Punjab">Punjab</option>
                          <option value="Sindh">Sindh</option>
                          <option value="KPK">Khyber Pakhtunkhwa</option>
                          <option value="Balochistan">Balochistan</option>
                          <option value="ICT">
                            Islamabad Capital Territory
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="employeeCount"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Employee Count *
                      </label>
                      <input
                        type="number"
                        id="employeeCount"
                        required
                        value={corporateForm.employeeCount}
                        onChange={handleCorporateChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        placeholder="100"
                      />
                    </div>

                    <h3 className="text-lg font-medium text-gray-800 mt-6 mb-4">
                      Contact Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="contactName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Contact Person *
                        </label>
                        <input
                          type="text"
                          id="contactName"
                          required
                          value={corporateForm.contactName}
                          onChange={handleCorporateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="Ali Khan"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="contactEmail"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Contact Email *
                        </label>
                        <input
                          type="email"
                          id="contactEmail"
                          required
                          value={corporateForm.contactEmail}
                          onChange={handleCorporateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="hr@techcorp.com"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="contactPhone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Contact Phone *
                        </label>
                        <input
                          type="tel"
                          id="contactPhone"
                          required
                          value={corporateForm.contactPhone}
                          onChange={handleCorporateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                          placeholder="+92 42 1234567"
                        />
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-800 mt-6 mb-4">
                      Contract Period
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contractStartDate"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Contract Start Date *
                        </label>
                        <input
                          type="date"
                          id="contractStartDate"
                          required
                          value={corporateForm.contractStartDate}
                          onChange={handleCorporateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="contractEndDate"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Contract End Date *
                        </label>
                        <input
                          type="date"
                          id="contractEndDate"
                          required
                          value={corporateForm.contractEndDate}
                          onChange={handleCorporateChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={
                  currentStep === 1
                    ? () => router.push("/admin/dashboard")
                    : handleBack
                }
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← {currentStep === 1 ? "Back to Dashboard" : "Back"}
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating User..." : "Create User"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
