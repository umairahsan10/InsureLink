"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { formatPKRShort } from "@/lib/format";

interface FlaggedClaim {
  id: string;
  claimNumber: string;
  amount: number;
  status: string;
  priority: string;
  date: string;
  hospital: string;
  patient: string;
  corporate: string;
}

interface FraudAnalysis {
  summary: {
    totalClaimsAnalyzed: number;
    flaggedCount: number;
    duplicateAmountCount: number;
    highFrequencyCount: number;
    periodDays: number;
  };
  duplicateAmountClaims: FlaggedClaim[];
  highFrequencyClaims: FlaggedClaim[];
  highValueClaims: FlaggedClaim[];
}

type TabKey = "duplicates" | "frequency" | "highValue";

export default function AdminFraudPage() {
  const [data, setData] = useState<FraudAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("duplicates");

  useEffect(() => {
    loadFraud();
  }, []);

  const loadFraud = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<FraudAnalysis>("/api/admin/fraud");
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load fraud analysis");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      Pending: "bg-amber-100 text-amber-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      OnHold: "bg-blue-100 text-blue-800",
      Paid: "bg-indigo-100 text-indigo-800",
    };
    return m[s] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-24 skeleton-shimmer rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}</div>
        <div className="h-64 skeleton-shimmer rounded-xl" />
      </div>
    );
  }

  const s = data?.summary;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "duplicates", label: "Duplicate Amounts", count: data?.duplicateAmountClaims.length ?? 0 },
    { key: "frequency", label: "High Frequency", count: data?.highFrequencyClaims.length ?? 0 },
    { key: "highValue", label: "High Value", count: data?.highValueClaims.length ?? 0 },
  ];

  const activeClaims =
    activeTab === "duplicates" ? data?.duplicateAmountClaims :
    activeTab === "frequency" ? data?.highFrequencyClaims :
    data?.highValueClaims;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Fraud Monitor</h1>
            <p className="text-gray-500">Automated anomaly detection across claims (last {s?.periodDays ?? 30} days)</p>
          </div>
          <button onClick={loadFraud} className="bg-white text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-all font-semibold text-sm">
            Refresh Analysis
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Claims Analyzed" value={String(s?.totalClaimsAnalyzed ?? 0)} color="gray" />
        <SummaryCard label="Flagged Claims" value={String(s?.flaggedCount ?? 0)} color={s?.flaggedCount ? "red" : "green"} />
        <SummaryCard label="Duplicate Amounts" value={String(s?.duplicateAmountCount ?? 0)} color={s?.duplicateAmountCount ? "amber" : "green"} />
        <SummaryCard label="High Frequency" value={String(s?.highFrequencyCount ?? 0)} color={s?.highFrequencyCount ? "amber" : "green"} />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? "text-indigo-700 bg-indigo-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? "bg-indigo-200 text-indigo-800" : "bg-gray-200 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {!activeClaims || activeClaims.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">
              {activeTab === "duplicates" ? "=" : activeTab === "frequency" ? "~" : "$"}
            </div>
            <p className="text-gray-500">No {tabs.find((t) => t.key === activeTab)?.label.toLowerCase()} anomalies detected</p>
            <p className="text-xs text-gray-400 mt-1">This is good — no suspicious patterns found in the last {s?.periodDays ?? 30} days</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim #</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Corporate</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeClaims.map((c) => (
                  <tr key={`${c.id}-${activeTab}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono font-medium text-indigo-600">{c.claimNumber}</td>
                    <td className="px-5 py-4 text-sm text-gray-900">{c.patient}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.hospital}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.corporate}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatPKRShort(c.amount)}</td>
                    <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(c.status)}`}>{c.status}</span></td>
                    <td className="px-5 py-4 text-sm text-gray-500">{new Date(c.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detection Rules Info */}
      <div className="mt-6 bg-gray-50 rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Detection Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-1">Duplicate Amounts</p>
            <p className="text-xs text-gray-500">Flags claims where the same employee has multiple claims with the exact same amount within {s?.periodDays ?? 30} days.</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-1">High Frequency</p>
            <p className="text-xs text-gray-500">Flags employees with more than 3 claims in {s?.periodDays ?? 30} days, indicating unusually high claim activity.</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-1">High Value</p>
            <p className="text-xs text-gray-500">Shows the top 10 highest-value claims in the last {s?.periodDays ?? 30} days for manual review.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-50",
    green: "bg-green-50",
    red: "bg-red-50",
    amber: "bg-amber-50",
  };
  const textColors: Record<string, string> = {
    gray: "text-gray-900",
    green: "text-green-800",
    red: "text-red-800",
    amber: "text-amber-800",
  };
  return (
    <div className={`${colors[color] || colors.gray} rounded-xl p-5 border border-gray-100`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold ${textColors[color] || textColors.gray}`}>{value}</p>
    </div>
  );
}
