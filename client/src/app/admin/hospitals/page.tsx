"use client";

import { useEffect, useState, useCallback } from "react";
import { hospitalsApi, Hospital } from "@/lib/api/hospitals";

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;
  const [total, setTotal] = useState(0);

  // Detail drawer
  const [selected, setSelected] = useState<Hospital | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hospitalsApi.getHospitals({
        page,
        limit,
        city: cityFilter || undefined,
        isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
        sortBy: "createdAt",
        order: "desc",
      });
      // The API returns an array; filter by search client-side since the endpoint doesn't have a search param
      let items = Array.isArray(res) ? res : (res as any).data || [];
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        items = items.filter((h: Hospital) =>
          h.hospitalName.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
        );
      }
      setHospitals(items);
      setTotal(items.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, cityFilter, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Get unique cities
  const cities = [...new Set(hospitals.map((h) => h.city))].sort();

  const typeBadge = (t: string) =>
    t === "reimbursable" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Hospitals</h1>
        <p className="text-gray-500">{total} hospital{total !== 1 ? "s" : ""} in network</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or city..." className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        <select value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900">
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton-shimmer rounded-lg" />)}</div>
        ) : hospitals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hospitals found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emergency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hospitals.map((h) => (
                  <tr key={h.id} onClick={() => setSelected(h)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4"><div className="font-medium text-gray-900">{h.hospitalName}</div></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{h.city}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{h.licenseNumber}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeBadge(h.hospitalType)}`}>{h.hospitalType === "reimbursable" ? "Reimbursable" : "Non-Reimbursable"}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{h.emergencyPhone}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${h.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${h.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        {h.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.hospitalName}</h2>
                  <p className="text-sm text-gray-500">{selected.city}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeBadge(selected.hospitalType)}`}>{selected.hospitalType === "reimbursable" ? "Reimbursable" : "Non-Reimbursable"}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selected.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{selected.isActive ? "Active" : "Inactive"}</span>
                  {selected.hasEmergencyUnit && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Emergency Unit</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs font-medium text-gray-500">License</p><p className="text-sm text-gray-900 font-mono">{selected.licenseNumber}</p></div>
                  <div><p className="text-xs font-medium text-gray-500">Emergency Phone</p><p className="text-sm text-gray-900">{selected.emergencyPhone}</p></div>
                  <div className="col-span-2"><p className="text-xs font-medium text-gray-500">Address</p><p className="text-sm text-gray-900">{selected.address}</p></div>
                  {selected.latitude && <div><p className="text-xs font-medium text-gray-500">Latitude</p><p className="text-sm text-gray-900">{selected.latitude}</p></div>}
                  {selected.longitude && <div><p className="text-xs font-medium text-gray-500">Longitude</p><p className="text-sm text-gray-900">{selected.longitude}</p></div>}
                  <div><p className="text-xs font-medium text-gray-500">Registered</p><p className="text-sm text-gray-900">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
