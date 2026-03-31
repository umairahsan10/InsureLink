"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { corporatesApi } from "@/lib/api/corporates";
import { employeesApi } from "@/lib/api/employees";
import { insurersApi, type Plan } from "@/lib/api/insurers";
import { formatPKR } from "@/lib/format";

type PlanWithMembers = Plan & { enrolledEmployees: number };

const parseFeatureCount = (value: unknown): number => {
  if (!value) return 0;
  if (Array.isArray(value)) return value.length;
  if (typeof value === "object") return Object.keys(value as object).length;
  return 0;
};

export default function CorporatePlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const corporateId = user?.corporateId;
    if (!corporateId) {
      setError("Corporate profile is not linked to this account.");
      setLoading(false);
      return;
    }

    let active = true;

    const loadPlans = async () => {
      setLoading(true);
      setError(null);

      try {
        const corporate = await corporatesApi.getCorporateById(corporateId);
        const [planList, employees] = await Promise.all([
          insurersApi.getPlans(corporate.insurerId),
          employeesApi.list({ corporateId, page: 1, limit: 100 }),
        ]);

        if (!active) return;

        const planCounts = employees.items.reduce<Record<string, number>>((acc, employee) => {
          acc[employee.planId] = (acc[employee.planId] || 0) + 1;
          return acc;
        }, {});

        setPlans(
          planList.map((plan) => ({
            ...plan,
            enrolledEmployees: planCounts[plan.id] || 0,
          })),
        );
      } catch (err) {
        if (active) {
          console.error("Failed to load corporate plans:", err);
          setError("Could not load plans right now.");
          setPlans([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPlans();
    return () => {
      active = false;
    };
  }, [user?.corporateId]);

  const totals = useMemo(() => {
    const activePlans = plans.filter((plan) => plan.isActive).length;
    const enrolledEmployees = plans.reduce(
      (sum, plan) => sum + plan.enrolledEmployees,
      0,
    );
    const averageCoverage =
      plans.length > 0
        ? Math.round(
            plans.reduce((sum, plan) => sum + Number(plan.sumInsured || 0), 0) /
              plans.length,
          )
        : 0;

    return { activePlans, enrolledEmployees, averageCoverage };
  }, [plans]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Insurance Plans</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active Plans</p>
          <p className="text-2xl font-bold text-gray-900">{totals.activePlans}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Covered Employees</p>
          <p className="text-2xl font-bold text-gray-900">{totals.enrolledEmployees}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Average Coverage</p>
          <p className="text-2xl font-bold text-blue-600">{formatPKR(totals.averageCoverage)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            No plans found for this corporate account.
          </div>
        ) : (
          plans.map((plan) => {
            const featureCount = parseFeatureCount(plan.coveredServices);

            return (
              <div key={plan.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="bg-blue-600 text-white p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">{plan.planName}</h2>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        plan.isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-3xl font-bold">{formatPKR(Number(plan.sumInsured || 0))}</p>
                  <p className="text-sm opacity-90">Coverage per person</p>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Plan Code</p>
                    <p className="text-base font-semibold text-gray-900">{plan.planCode}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Enrolled Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{plan.enrolledEmployees}</p>
                  </div>

                  <div className="mb-6 flex-1">
                    <p className="text-sm text-gray-500">Covered Services</p>
                    <p className="text-lg font-semibold text-gray-900">{featureCount} configured</p>
                  </div>

                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-not-allowed mt-auto"
                  >
                    Managed By Insurer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

