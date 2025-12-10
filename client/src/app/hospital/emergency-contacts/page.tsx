"use client";

import { useMemo } from "react";
import contactsData from "@/data/hospitalEmergencyContacts.json";
import { HospitalEmergencyContact } from "@/types";

export default function HospitalEmergencyContactsPage() {
  const contacts = useMemo(
    () =>
      (contactsData as HospitalEmergencyContact[]).sort(
        (a, b) => a.level - b.level
      ),
    []
  );

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Emergency Contacts
        </h1>
        <p className="text-sm lg:text-base text-gray-600 mt-2">
          Quickly reach the insurer hierarchy for urgent claim escalations
        </p>
      </div>

      <section className="bg-white rounded-lg shadow">
        <div className="px-4 lg:px-6 py-5 border-b border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">
              Escalation Ladder
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 mt-1">
              Start from the first point of contact and escalate through the
              levels if response is delayed.
            </p>
          </div>
        </div>

        <div className="px-4 lg:px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((contact) => {
              const style = levelStyles[contact.level] ?? levelStyles[4];
              return (
                <article
                  key={contact.level}
                  className={`rounded-xl border ${style.accent} bg-gradient-to-br ${style.gradient} shadow-sm transition-shadow hover:shadow-md`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-full font-semibold ${style.iconBg}`}
                        >
                          L{contact.level}
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
                        Escalation L{contact.level}
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
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
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
                              d="M9 12h6m-6 4h6M7 8h10M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Notes
                          </p>
                          <p className="text-sm text-gray-600">
                            {contact.remarks}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-b-xl border-t border-dashed border-gray-200 bg-white/60 px-5 py-3 text-xs text-gray-500">
                    Escalate to next level if no response within 15 minutes.
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-4 lg:px-6 py-5">
          <div className="flex flex-col gap-3 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2h2"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 12v9m-3-9v9m6-9v9M9 8l3-3 3 3M4 8h16"
                />
              </svg>
              <span>
                Keep a record in the hospital incident log after each escalation
                attempt.
              </span>
            </div>
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
      </section>
    </div>
  );
}
