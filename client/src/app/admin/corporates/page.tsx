"use client";

import { useEffect, useState, useCallback } from "react";
import { corporatesApi, Corporate, CorporateStats } from "@/lib/api/corporates";
import { formatPKRShort } from "@/lib/format";

const STATUS_OPTIONS = ["", "Active", "Inactive", "Suspended"] as const;

export default function AdminCorporatesPage() {
  const [corporates, setCorporates] = useState<Corporate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Detail drawer
  const [selectedCorp, setSelectedCorp] = useState<Corporate | null>(null);
  const [corpStats, setCorpStats] = useState<CorporateStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Status update
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await corporatesApi.listCorporates({
        search: debouncedSearch || undefined,
        status: (statusFilter as "Active" | "Inactive" | "Suspended") || undefined,
        page,
        limit,
      });
      setCorporates(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (corp: Corporate) => {
    setSelectedCorp(corp);
    setStatsLoading(true);
    try {
      const stats = await corporatesApi.getCorporateStats(corp.id);
      setCorpStats(stats);
    } catch {
      setCorpStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "Active" | "Inactive" | "Suspended") => {
    setStatusUpdating(true);
    try {
      await corporatesApi.updateCorporate(id, { status });
      if (selectedCorp?.id === id) setSelectedCorp({ ...selectedCorp!, status });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Active: "bg-green-100 text-green-800",
      Inactive: "bg-gray-100 text-gray-700",
      Suspended: "bg-red-100 text-red-800",
    };
    return map[s] || "bg-gray-100 text-gray-700";
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Corporates</h1>
        <p className="text-gray-500">{total} corporate client{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company name..." className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "All Status"}</option>)}
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton-shimmer rounded-lg" />)}</div>
        ) : corporates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No corporates found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {corporates.map((c) => (
                  <tr key={c.id} onClick={() => openDetail(c)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4"><div className="font-medium text-gray-900">{c.name}</div></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.city}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.employeeCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.contactName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(c.contractStartDate).toLocaleDateString()} — {new Date(c.contractEndDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(c.status)}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedCorp && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedCorp(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCorp.name}</h2>
                  <p className="text-sm text-gray-500">{selectedCorp.city}, {selectedCorp.province}</p>
                </div>
                <button onClick={() => setSelectedCorp(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>

              {/* Status controls */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
                <div className="flex gap-2">
                  {(["Active", "Inactive", "Suspended"] as const).map((s) => (
                    <button key={s} onClick={() => updateStatus(selectedCorp.id, s)} disabled={statusUpdating || selectedCorp.status === s}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${selectedCorp.status === s ? statusBadge(s) + " border-transparent" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <InfoField label="Contact" value={selectedCorp.contactName} />
                <InfoField label="Email" value={selectedCorp.contactEmail} />
                <InfoField label="Phone" value={selectedCorp.contactPhone} />
                <InfoField label="Employees" value={String(selectedCorp.employeeCount)} />
                <InfoField label="Dependents" value={String(selectedCorp.dependentCount)} />
                <InfoField label="Amount Used" value={formatPKRShort(Number(selectedCorp.totalAmountUsed))} />
                <InfoField label="Contract Start" value={new Date(selectedCorp.contractStartDate).toLocaleDateString()} />
                <InfoField label="Contract End" value={new Date(selectedCorp.contractEndDate).toLocaleDateString()} />
              </div>

              {/* Stats */}
              {statsLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 skeleton-shimmer rounded" />)}</div>
              ) : corpStats && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Coverage & Claims</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Active Employees" value={String(corpStats.activeEmployees)} />
                    <StatCard label="Active Dependents" value={String(corpStats.activeDependents)} />
                    <StatCard label="Total Coverage" value={formatPKRShort(Number(corpStats.totalCoverageAmount))} />
                    <StatCard label="Used" value={formatPKRShort(Number(corpStats.usedCoverageAmount))} />
                    <StatCard label="Approved Claims" value={String(corpStats.approvedClaimsCount)} color="green" />
                    <StatCard label="Pending Claims" value={String(corpStats.pendingClaimsCount)} color="amber" />
                    <StatCard label="Rejected Claims" value={String(corpStats.rejectedClaimsCount)} color="red" />
                    <StatCard label="Remaining" value={formatPKRShort(Number(corpStats.remainingCoverageAmount))} color="blue" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function StatCard({ label, value, color = "indigo" }: { label: string; value: string; color?: string }) {
  const bg: Record<string, string> = { indigo: "bg-indigo-50", green: "bg-green-50", amber: "bg-amber-50", red: "bg-red-50", blue: "bg-blue-50" };
  return (
    <div className={`${bg[color] || bg.indigo} rounded-lg p-3`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
