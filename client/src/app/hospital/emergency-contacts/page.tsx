"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hospitalsApi,
  EmergencyContact,
  CreateEmergencyContactRequest,
  UpdateEmergencyContactRequest,
} from "@/lib/api/hospitals";

export default function HospitalEmergencyContactsPage() {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    contactLevel: "1",
    designation: "",
    name: "",
    contactNumber: "",
    isActive: true,
  });

  const fetchContacts = useCallback(async () => {
    if (!hospitalId) return;
    setIsLoading(true);
    try {
      const data = await hospitalsApi.getEmergencyContacts(hospitalId);
      setContacts(data.sort((a, b) => a.contactLevel - b.contactLevel));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const formatTelephoneHref = (number: string) =>
    `tel:${number.replace(/[^+\d]/g, "")}`;

  const levelStyles: Record<
    number,
    {
      accent: string;
      badge: string;
      gradient: string;
      iconBg: string;
      priority: string;
    }
  > = {
    1: {
      accent: "border-red-200",
      badge: "bg-red-100 text-red-700",
      gradient: "from-red-50 via-white to-white",
      iconBg: "bg-red-100 text-red-600",
      priority: "Critical",
    },
    2: {
      accent: "border-orange-200",
      badge: "bg-orange-100 text-orange-700",
      gradient: "from-orange-50 via-white to-white",
      iconBg: "bg-orange-100 text-orange-600",
      priority: "High",
    },
    3: {
      accent: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      gradient: "from-amber-50 via-white to-white",
      iconBg: "bg-amber-100 text-amber-600",
      priority: "Medium",
    },
    4: {
      accent: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      gradient: "from-emerald-50 via-white to-white",
      iconBg: "bg-emerald-100 text-emerald-600",
      priority: "First Contact",
    },
  };

  function openCreate() {
    setEditingContact(null);
    setForm({
      contactLevel: String(
        (contacts.length > 0
          ? Math.max(...contacts.map((c) => c.contactLevel))
          : 0) + 1,
      ),
      designation: "",
      name: "",
      contactNumber: "",
      isActive: true,
    });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(contact: EmergencyContact) {
    setEditingContact(contact);
    setForm({
      contactLevel: String(contact.contactLevel),
      designation: contact.designation,
      name: contact.name,
      contactNumber: contact.contactNumber,
      isActive: contact.isActive,
    });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!hospitalId) return;
    setIsSaving(true);
    setFormError("");

    try {
      if (editingContact) {
        const payload: UpdateEmergencyContactRequest = {
          contactLevel: Number(form.contactLevel),
          designation: form.designation,
          name: form.name,
          contactNumber: form.contactNumber,
          isActive: form.isActive,
        };
        await hospitalsApi.updateEmergencyContact(editingContact.id, payload);
      } else {
        const payload: CreateEmergencyContactRequest = {
          contactLevel: Number(form.contactLevel),
          designation: form.designation,
          name: form.name,
          contactNumber: form.contactNumber,
          isActive: form.isActive,
        };
        await hospitalsApi.createEmergencyContact(hospitalId, payload);
      }
      setShowModal(false);
      fetchContacts();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save contact",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(contactId: string) {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await hospitalsApi.deleteEmergencyContact(contactId);
      fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contact");
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Emergency Contacts
          </h1>
          <p className="text-sm lg:text-base text-gray-600 mt-2">
            Manage the insurer escalation hierarchy for urgent claim issues
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
        >
          + Add Contact
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <section className="bg-white rounded-lg shadow">
        <div className="px-4 lg:px-6 py-5 border-b border-gray-200">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900">
            Escalation Ladder
          </h2>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">
            Start from the first point of contact and escalate through the
            levels if response is delayed.
          </p>
        </div>

        <div className="px-4 lg:px-6 py-6">
          {contacts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No emergency contacts added yet. Click &quot;+ Add Contact&quot;
              to get started.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {contacts.map((contact) => {
                const style =
                  levelStyles[contact.contactLevel] ?? levelStyles[4];
                return (
                  <article
                    key={contact.id}
                    className={`rounded-xl border ${style.accent} bg-gradient-to-br ${style.gradient} shadow-sm transition-shadow hover:shadow-md`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-full font-semibold ${style.iconBg}`}
                          >
                            L{contact.contactLevel}
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {style.priority}
                            </p>
                            <h3 className="text-base font-semibold text-gray-900">
                              {contact.designation}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {contact.name}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${style.badge}`}
                        >
                          Escalation L{contact.contactLevel}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.07 3.208a1 1 0 01-.502 1.21l-1.29.645a11.05 11.05 0 005.165 5.165l.645-1.29a1 1 0 011.21-.502l3.208 1.07a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.613 21 4 15.387 4 8V7a2 2 0 012-2H5z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Direct Line
                            </p>
                            <a
                              href={formatTelephoneHref(contact.contactNumber)}
                              className="text-sm font-semibold text-green-700 hover:text-green-800"
                            >
                              {contact.contactNumber}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                        <button
                          onClick={() => openEdit(contact)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {contacts.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 lg:px-6 py-5">
            <div className="flex flex-col gap-3 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Keep a record in the hospital incident log after each escalation
                attempt.
              </span>
              <a
                href={formatTelephoneHref(contacts[0]?.contactNumber ?? "")}
                className="inline-flex items-center gap-2 self-start rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.07 3.208a1 1 0 01-.502 1.21l-1.29.645a11.05 11.05 0 005.165 5.165l.645-1.29a1 1 0 011.21-.502l3.208 1.07a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.613 21 4 15.387 4 8V7a2 2 0 012-2H5z"
                  />
                </svg>
                Call First Response
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingContact ? "Edit Contact" : "Add Emergency Contact"}
              </h2>

              {formError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Level *
                  </label>
                  <select
                    value={form.contactLevel}
                    onChange={(e) =>
                      setForm({ ...form, contactLevel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="1">Level 1 — Critical</option>
                    <option value="2">Level 2 — High</option>
                    <option value="3">Level 3 — Medium</option>
                    <option value="4">Level 4 — First Contact</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) =>
                      setForm({ ...form, designation: e.target.value })
                    }
                    placeholder="e.g. Chief Medical Officer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    value={form.contactNumber}
                    onChange={(e) =>
                      setForm({ ...form, contactNumber: e.target.value })
                    }
                    placeholder="+92-XXX-XXXXXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="contactActive"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="contactActive"
                    className="text-sm text-gray-700"
                  >
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSaving
                    ? "Saving..."
                    : editingContact
                      ? "Update Contact"
                      : "Add Contact"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
