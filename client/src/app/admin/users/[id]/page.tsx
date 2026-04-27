"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, UserDetail, UpdateUserPayload } from "@/lib/api/admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-indigo-100 text-indigo-800";
    case "hospital":
      return "bg-green-100 text-green-800";
    case "insurer":
      return "bg-red-100 text-red-800";
    case "corporate":
      return "bg-purple-100 text-purple-800";
    case "patient":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString() : "—";

const fmtDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleString() : "—";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Data
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateUserPayload>({});
  const [saving, setSaving] = useState(false);

  // Password reset
  const [showResetPw, setShowResetPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Load user ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminApi.getUserById(id);
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  // ─── Flash success ──────────────────────────────────────────────────────
  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  // ─── Start editing ──────────────────────────────────────────────────────
  const startEditing = () => {
    if (!user) return;
    const base: UpdateUserPayload = {
      firstName: user.firstName,
      lastName: user.lastName || "",
      phone: user.phone,
      dob: user.dob || "",
      gender: user.gender || "",
      cnic: user.cnic || "",
      address: user.address || "",
    };

    if (user.hospital) {
      const h = user.hospital as Record<string, unknown>;
      base.hospitalProfile = {
        hospitalName: h.hospitalName as string,
        city: h.city as string,
        address: h.address as string,
        emergencyPhone: h.emergencyPhone as string,
        hospitalType: h.hospitalType as "reimbursable" | "non_reimbursable",
        hasEmergencyUnit: h.hasEmergencyUnit as boolean,
      };
    }
    if (user.insurer) {
      const ins = user.insurer as Record<string, unknown>;
      base.insurerProfile = {
        companyName: ins.companyName as string,
        address: ins.address as string,
        city: ins.city as string,
        province: ins.province as string,
        maxCoverageLimit: Number(ins.maxCoverageLimit),
        networkHospitalCount: Number(ins.networkHospitalCount),
        corporateClientCount: Number(ins.corporateClientCount),
      };
    }
    if (user.corporate) {
      const c = user.corporate as Record<string, unknown>;
      base.corporateProfile = {
        name: c.name as string,
        address: c.address as string,
        city: c.city as string,
        province: c.province as string,
        employeeCount: Number(c.employeeCount),
        contactName: c.contactName as string,
        contactEmail: c.contactEmail as string,
        contactPhone: c.contactPhone as string,
      };
    }

    setEditForm(base);
    setIsEditing(true);
  };

  // ─── Save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.updateUser(id, editForm);
      setUser(updated);
      setIsEditing(false);
      flash("User updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle active ──────────────────────────────────────────────────────
  const handleToggleActive = async () => {
    try {
      const res = await adminApi.toggleUserActive(id);
      setUser((prev) => (prev ? { ...prev, isActive: res.isActive } : prev));
      flash(res.isActive ? "User activated" : "User deactivated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  // ─── Reset password ─────────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setResetLoading(true);
    try {
      await adminApi.resetPassword(id, newPassword);
      setShowResetPw(false);
      setNewPassword("");
      flash("Password reset successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminApi.deleteUser(id);
      router.push("/admin/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Form helpers ───────────────────────────────────────────────────────
  const updateBase = (field: string, value: string) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  const updateProfile = (
    profileKey: "hospitalProfile" | "insurerProfile" | "corporateProfile",
    field: string,
    value: unknown,
  ) =>
    setEditForm((prev) => ({
      ...prev,
      [profileKey]: {
        ...((prev[profileKey] as Record<string, unknown>) || {}),
        [field]: value,
      },
    }));

  // ─── Render helpers ─────────────────────────────────────────────────────
  const Field = ({
    label,
    value,
    editKey,
    profileKey,
    type = "text",
  }: {
    label: string;
    value: string | number | boolean | null | undefined;
    editKey?: string;
    profileKey?: "hospitalProfile" | "insurerProfile" | "corporateProfile";
    type?: string;
  }) => (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1">
        {isEditing && editKey ? (
          <input
            type={type}
            value={
              profileKey
                ? String(
                    ((editForm[profileKey] as Record<string, unknown>) || {})[
                      editKey
                    ] ?? "",
                  )
                : String((editForm as Record<string, unknown>)[editKey] ?? "")
            }
            onChange={(e) =>
              profileKey
                ? updateProfile(
                    profileKey,
                    editKey,
                    type === "number" ? Number(e.target.value) : e.target.value,
                  )
                : updateBase(editKey, e.target.value)
            }
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        ) : (
          <span className="text-sm text-gray-900">
            {typeof value === "boolean"
              ? value
                ? "Yes"
                : "No"
              : String(value ?? "—")}
          </span>
        )}
      </dd>
    </div>
  );

  // ─── Loading / error states ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-800 font-medium">
            {error || "User not found"}
          </p>
          <Link
            href="/admin/users"
            className="mt-4 inline-block text-indigo-600 hover:underline"
          >
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const hosp = user.hospital as Record<string, unknown> | null;
  const ins = user.insurer as Record<string, unknown> | null;
  const corp = user.corporate as Record<string, unknown> | null;
  const emp = user.employee as Record<string, unknown> | null;
  const corporateInsurer =
    corp && typeof corp.insurer === "object" && corp.insurer !== null
      ? (corp.insurer as Record<string, unknown>)
      : null;
  const employeeCorporate =
    emp && typeof emp.corporate === "object" && emp.corporate !== null
      ? (emp.corporate as Record<string, unknown>)
      : null;
  const employeePlan =
    emp && typeof emp.plan === "object" && emp.plan !== null
      ? (emp.plan as Record<string, unknown>)
      : null;
  const insurerPlans = (Array.isArray(ins?.plans) ? ins.plans : []) as Array<{
    planName: string;
    planCode: string;
    isActive: boolean;
  }>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={() => setError("")}
            className="text-red-500 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/users"
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
        >
          &larr; Back to Users
        </Link>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={startEditing}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleToggleActive}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  user.isActive
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {user.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => setShowResetPw(true)}
                className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reset Password
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetPw && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reset Password
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Set a new temporary password for{" "}
              <strong>
                {user.firstName} {user.lastName}
              </strong>
            </p>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm mb-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mb-4">
              Must contain uppercase, lowercase, and a number
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowResetPw(false);
                  setNewPassword("");
                }}
                className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetLoading || newPassword.length < 8}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Delete User
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to permanently delete{" "}
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              ? This action cannot be undone and will remove all associated
              data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── User Info Card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold shrink-0">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.userRole)}`}
              >
                {user.userRole}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  user.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`}
                />
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <Field
            label="First Name"
            value={user.firstName}
            editKey="firstName"
          />
          <Field label="Last Name" value={user.lastName} editKey="lastName" />
          <Field label="Phone" value={user.phone} editKey="phone" />
          <Field label="Email" value={user.email} />
          <Field label="Gender" value={user.gender} editKey="gender" />
          <Field label="CNIC" value={user.cnic} editKey="cnic" />
          <Field
            label="Date of Birth"
            value={user.dob ? fmtDate(user.dob) : null}
            editKey="dob"
            type="date"
          />
          <Field label="Address" value={user.address} editKey="address" />
        </dl>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {fmtDateTime(user.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {fmtDateTime(user.updatedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Login</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {fmtDateTime(user.lastLoginAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">User ID</dt>
            <dd className="mt-1 text-xs text-gray-500 font-mono break-all">
              {user.id}
            </dd>
          </div>
        </div>
      </div>

      {/* ─── Hospital Profile ──────────────────────────────────────────── */}
      {hosp && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Hospital Profile
          </h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <Field
              label="Hospital Name"
              value={hosp.hospitalName as string}
              editKey="hospitalName"
              profileKey="hospitalProfile"
            />
            <Field
              label="License Number"
              value={hosp.licenseNumber as string}
            />
            <Field
              label="City"
              value={hosp.city as string}
              editKey="city"
              profileKey="hospitalProfile"
            />
            <Field
              label="Address"
              value={hosp.address as string}
              editKey="address"
              profileKey="hospitalProfile"
            />
            <Field
              label="Emergency Phone"
              value={hosp.emergencyPhone as string}
              editKey="emergencyPhone"
              profileKey="hospitalProfile"
            />
            <Field label="Type" value={hosp.hospitalType as string} />
            <Field
              label="Emergency Unit"
              value={hosp.hasEmergencyUnit as boolean}
            />
            <Field label="Active" value={hosp.isActive as boolean} />
          </dl>
        </div>
      )}

      {/* ─── Insurer Profile ───────────────────────────────────────────── */}
      {ins && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Insurer Profile
          </h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <Field
              label="Company Name"
              value={ins.companyName as string}
              editKey="companyName"
              profileKey="insurerProfile"
            />
            <Field label="License Number" value={ins.licenseNumber as string} />
            <Field
              label="City"
              value={ins.city as string}
              editKey="city"
              profileKey="insurerProfile"
            />
            <Field
              label="Province"
              value={ins.province as string}
              editKey="province"
              profileKey="insurerProfile"
            />
            <Field
              label="Address"
              value={ins.address as string}
              editKey="address"
              profileKey="insurerProfile"
            />
            <Field
              label="Max Coverage Limit"
              value={`PKR ${Number(ins.maxCoverageLimit).toLocaleString()}`}
              editKey="maxCoverageLimit"
              profileKey="insurerProfile"
              type="number"
            />
            <Field
              label="Network Hospitals"
              value={Number(ins.networkHospitalCount)}
              editKey="networkHospitalCount"
              profileKey="insurerProfile"
              type="number"
            />
            <Field
              label="Corporate Clients"
              value={Number(ins.corporateClientCount)}
              editKey="corporateClientCount"
              profileKey="insurerProfile"
              type="number"
            />
            <Field label="Status" value={ins.status as string} />
            <Field label="Active" value={ins.isActive as boolean} />
            <Field
              label="Operating Since"
              value={fmtDate(ins.operatingSince as string)}
            />
          </dl>
          {insurerPlans.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Plans
              </h4>
              <div className="flex flex-wrap gap-2">
                {insurerPlans.map((p) => (
                  <span
                    key={p.planCode}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                  >
                    {p.planName} ({p.planCode})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Corporate Profile ─────────────────────────────────────────── */}
      {corp && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Corporate Profile
          </h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <Field
              label="Company Name"
              value={corp.name as string}
              editKey="name"
              profileKey="corporateProfile"
            />
            <Field
              label="City"
              value={corp.city as string}
              editKey="city"
              profileKey="corporateProfile"
            />
            <Field
              label="Province"
              value={corp.province as string}
              editKey="province"
              profileKey="corporateProfile"
            />
            <Field
              label="Address"
              value={corp.address as string}
              editKey="address"
              profileKey="corporateProfile"
            />
            <Field
              label="Employee Count"
              value={Number(corp.employeeCount)}
              editKey="employeeCount"
              profileKey="corporateProfile"
              type="number"
            />
            <Field
              label="Contact Name"
              value={corp.contactName as string}
              editKey="contactName"
              profileKey="corporateProfile"
            />
            <Field
              label="Contact Email"
              value={corp.contactEmail as string}
              editKey="contactEmail"
              profileKey="corporateProfile"
            />
            <Field
              label="Contact Phone"
              value={corp.contactPhone as string}
              editKey="contactPhone"
              profileKey="corporateProfile"
            />
            <Field label="Status" value={corp.status as string} />
            <Field
              label="Contract Start"
              value={fmtDate(corp.contractStartDate as string)}
            />
            <Field
              label="Contract End"
              value={fmtDate(corp.contractEndDate as string)}
            />
            {corporateInsurer && (
              <Field
                label="Insurer"
                value={String(corporateInsurer.companyName ?? "—")}
              />
            )}
          </dl>
        </div>
      )}

      {/* ─── Employee Profile ──────────────────────────────────────────── */}
      {emp && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Employee Profile
          </h3>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Employee Number
              </dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {emp.employeeNumber as string}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Designation</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {(emp.designation as string) || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {(emp.department as string) || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {(emp.status as string) || "—"}
              </dd>
            </div>
            {employeeCorporate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Corporate</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {String(employeeCorporate.name ?? "—")}
                </dd>
              </div>
            )}
            {employeePlan && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {String(employeePlan.planName ?? "—")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* No profile */}
      {!hosp && !ins && !corp && !emp && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
          No role-specific profile linked to this user.
        </div>
      )}
    </div>
  );
}
