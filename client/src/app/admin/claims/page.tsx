"use client";

import { useEffect, useState, useCallback } from "react";
import { claimsApi, Claim, ClaimFilters, PaginatedResponse } from "@/lib/api/claims";
import { formatPKRShort } from "@/lib/format";

const STATUSES = ["", "Pending", "Approved", "Rejected", "OnHold", "Paid"];
const PRIORITIES = ["", "Low", "Normal", "High"];

export default function AdminClaimsPage() {
  const [data, setData] = useState<PaginatedResponse<Claim> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Detail
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load stats once
  useEffect(() => {
    claimsApi.getClaimStats().then(setStats).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ClaimFilters = {
        page,
        limit,
        sortBy: "createdAt",
        order: "desc",
      };
      if (debouncedSearch) filters.claimNumber = debouncedSearch;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (fromDate) filters.fromDate = fromDate;
      if (toDate) filters.toDate = toDate;

      const res = await claimsApi.getClaims(filters);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, priority, fromDate, toDate, page]);

  useEffect(() => { load(); }, [load]);

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

  const priorityBadge = (p: string) => {
    const m: Record<string, string> = { High: "bg-red-100 text-red-700", Normal: "bg-gray-100 text-gray-700", Low: "bg-gray-50 text-gray-500" };
    return m[p] || "bg-gray-100 text-gray-700";
  };

  const claims = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Claims Oversight</h1>
        <p className="text-gray-500">System-wide view of all insurance claims</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "bg-gray-50" },
            { label: "Pending", value: stats.Pending, color: "bg-amber-50" },
            { label: "Approved", value: stats.Approved, color: "bg-green-50" },
            { label: "Rejected", value: stats.Rejected, color: "bg-red-50" },
            { label: "On Hold", value: stats.OnHold, color: "bg-blue-50" },
            { label: "Paid", value: stats.Paid, color: "bg-indigo-50" },
            { label: "High Priority", value: stats.highPriority, color: "bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-xl p-4 border border-gray-100`}>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by claim number..." className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900">
            {STATUSES.map((s) => <option key={s} value={s}>{s || "All Status"}</option>)}
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p || "All Priority"}</option>)}
          </select>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">From</span>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">To</span>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900" />
          </div>
          {(status || priority || fromDate || toDate || debouncedSearch) && (
            <button onClick={() => { setSearch(""); setStatus(""); setPriority(""); setFromDate(""); setToDate(""); setPage(1); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Clear Filters</button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton-shimmer rounded-lg" />)}</div>
        ) : claims.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No claims found</div>
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
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {claims.map((c) => {
                  const patient = c.hospitalVisit?.employee?.user
                    ? `${c.hospitalVisit.employee.user.firstName} ${c.hospitalVisit.employee.user.lastName}`
                    : c.hospitalVisit?.dependent
                      ? `${c.hospitalVisit.dependent.firstName} ${c.hospitalVisit.dependent.lastName}`
                      : "—";
                  return (
                    <tr key={c.id} onClick={() => setSelectedClaim(c)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-5 py-4 text-sm font-mono font-medium text-indigo-600">{c.claimNumber}</td>
                      <td className="px-5 py-4 text-sm text-gray-900">{patient}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{c.hospitalVisit?.hospital?.hospitalName || "—"}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{c.corporate?.name || "—"}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatPKRShort(Number(c.amountClaimed))}</td>
                      <td className="px-5 py-4"><span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityBadge(c.priority)}`}>{c.priority}</span></td>
                      <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(c.claimStatus)}`}>{c.claimStatus}</span></td>
                      <td className="px-5 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">Page {page} of {totalPages} ({total} claims)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Claim Detail Drawer */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedClaim(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedClaim.claimNumber}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(selectedClaim.claimStatus)}`}>{selectedClaim.claimStatus}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityBadge(selectedClaim.priority)}`}>{selectedClaim.priority}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedClaim(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>

              <div className="space-y-6">
                {/* Amounts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Claimed</p>
                    <p className="text-xl font-bold text-gray-900">{formatPKRShort(Number(selectedClaim.amountClaimed))}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Approved</p>
                    <p className="text-xl font-bold text-green-800">{Number(selectedClaim.approvedAmount) > 0 ? formatPKRShort(Number(selectedClaim.approvedAmount)) : "—"}</p>
                  </div>
                </div>

                {/* Patient */}
                <Section title="Patient">
                  {selectedClaim.hospitalVisit?.employee?.user && (
                    <div className="grid grid-cols-2 gap-3">
                      <F label="Name" value={`${selectedClaim.hospitalVisit.employee.user.firstName} ${selectedClaim.hospitalVisit.employee.user.lastName}`} />
                      <F label="Employee #" value={selectedClaim.hospitalVisit.employee.employeeNumber} />
                      {selectedClaim.hospitalVisit.employee.user.cnic && <F label="CNIC" value={selectedClaim.hospitalVisit.employee.user.cnic} />}
                    </div>
                  )}
                  {selectedClaim.hospitalVisit?.dependent && (
                    <div className="grid grid-cols-2 gap-3">
                      <F label="Dependent" value={`${selectedClaim.hospitalVisit.dependent.firstName} ${selectedClaim.hospitalVisit.dependent.lastName}`} />
                      <F label="Relationship" value={selectedClaim.hospitalVisit.dependent.relationship} />
                    </div>
                  )}
                </Section>

                {/* Hospital & Visit */}
                <Section title="Hospital & Visit">
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Hospital" value={selectedClaim.hospitalVisit?.hospital?.hospitalName || "—"} />
                    <F label="City" value={selectedClaim.hospitalVisit?.hospital?.city || "—"} />
                    <F label="Visit Date" value={selectedClaim.hospitalVisit?.visitDate ? new Date(selectedClaim.hospitalVisit.visitDate).toLocaleDateString() : "—"} />
                    <F label="Discharge" value={selectedClaim.hospitalVisit?.dischargeDate ? new Date(selectedClaim.hospitalVisit.dischargeDate).toLocaleDateString() : "—"} />
                  </div>
                </Section>

                {/* Corporate & Plan */}
                <Section title="Corporate & Insurance">
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Corporate" value={selectedClaim.corporate?.name || "—"} />
                    <F label="Insurer" value={selectedClaim.insurer?.companyName || "—"} />
                    <F label="Plan" value={selectedClaim.plan?.planName || "—"} />
                    <F label="Plan Code" value={selectedClaim.plan?.planCode || "—"} />
                  </div>
                </Section>

                {/* Notes */}
                {selectedClaim.notes && (
                  <Section title="Notes">
                    <p className="text-sm text-gray-700">{selectedClaim.notes}</p>
                  </Section>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <F label="Submitted" value={new Date(selectedClaim.createdAt).toLocaleString()} />
                  <F label="Last Updated" value={new Date(selectedClaim.updatedAt).toLocaleString()} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function F({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}
