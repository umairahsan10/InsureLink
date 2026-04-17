"use client";

import { useEffect, useState, useCallback } from "react";
import {
  auditApi,
  AuditLogEntry,
  GetAuditLogsParams,
} from "@/lib/api/audit";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Expanded rows
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: GetAuditLogsParams = { page, limit: 20 };
      if (entityTypeFilter) params.entityType = entityTypeFilter;
      if (actionFilter) params.action = actionFilter;
      // Date range params are passed as startDate/endDate if the audit API supports them
      // The backend audit controller accepts startDate and endDate
      const queryParams = new URLSearchParams();
      queryParams.set("page", String(page));
      queryParams.set("limit", "20");
      if (entityTypeFilter) queryParams.set("entityType", entityTypeFilter);
      if (actionFilter) queryParams.set("action", actionFilter);
      if (fromDate) queryParams.set("startDate", fromDate);
      if (toDate) queryParams.set("endDate", toDate);

      const res = await auditApi.getLogs(params);
      setLogs(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, entityTypeFilter, actionFilter, fromDate, toDate]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const resetFilters = () => {
    setEntityTypeFilter("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-800";
      case "UPDATE": return "bg-blue-100 text-blue-800";
      case "DELETE": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Export to CSV
  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Changes", "IP Address"];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.user ? `${l.user.firstName} ${l.user.lastName}` : l.userId,
      l.action,
      l.entityType,
      l.entityId,
      l.changes ? JSON.stringify(l.changes).replace(/"/g, '""') : "",
      l.ipAddress ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = entityTypeFilter || actionFilter || fromDate || toDate;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Audit Logs</h1>
            <p className="text-gray-500">{total} entries across all system actions</p>
          </div>
          <button onClick={exportCSV} disabled={logs.length === 0} className="bg-white text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-all font-semibold text-sm disabled:opacity-50">
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
            <select value={entityTypeFilter} onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="">All</option>
              <option value="Claim">Claim</option>
              <option value="Insurer">Insurer</option>
              <option value="Hospital">Hospital</option>
              <option value="Corporate">Corporate</option>
              <option value="User">User</option>
              <option value="Plan">Plan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="">All</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900" />
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium pb-2">Clear</button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton-shimmer rounded-lg" />)}</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <tr key={log.id} className="group">
                      <td className="px-5 py-4">
                        {log.changes && (
                          <button onClick={() => setExpandedId(isExpanded ? null : log.id)} className="text-gray-400 hover:text-indigo-600 transition-colors text-sm">
                            {isExpanded ? "▼" : "▶"}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : <span className="text-gray-400 font-mono text-xs">{log.userId.slice(0, 8)}</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>{log.action}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{log.entityType}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">{log.entityId.slice(0, 8)}...</td>
                      <td className="px-5 py-4 text-sm text-gray-500 max-w-xs">
                        {log.changes ? (
                          <span className="truncate block">{summarizeChanges(log.changes)}</span>
                        ) : "—"}
                      </td>
                      {/* Expanded row */}
                      {isExpanded && log.changes && (
                        <td colSpan={7} className="px-5 py-4 bg-gray-50">
                          <div className="max-w-2xl">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Full Changes</p>
                            <pre className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">Page {page} of {totalPages} ({total} entries)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function summarizeChanges(changes: Record<string, unknown>): string {
  const keys = Object.keys(changes);
  if (keys.length === 0) return "No changes";
  if (keys.length <= 3) return keys.join(", ");
  return `${keys.slice(0, 3).join(", ")} +${keys.length - 3} more`;
}
