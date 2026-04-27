"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import { formatPKRShort } from "@/lib/format";

interface Insurer {
  id: string;
  companyName: string;
  licenseNumber: string;
  address: string;
  city: string;
  province: string;
  maxCoverageLimit: number;
  networkHospitalCount: number;
  corporateClientCount: number;
  status: string;
  operatingSince: string;
  isActive: boolean;
  createdAt: string;
  plans?: { id: string; planName: string; planCode: string; isActive: boolean }[];
}

interface Plan {
  id: string;
  planName: string;
  planCode: string;
  sumInsured: number;
  isActive: boolean;
}

export default function AdminInsurersPage() {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Detail
  const [selected, setSelected] = useState<Insurer | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Insurer[]>("/api/v1/insurers?limit=100");
      setInsurers(Array.isArray(res.data) ? res.data : (res.data as any).insurers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (ins: Insurer) => {
    setSelected(ins);
    setPlansLoading(true);
    try {
      const res = await apiFetch<Plan[]>(`/api/v1/insurers/${ins.id}/plans`);
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { Active: "bg-green-100 text-green-800", Inactive: "bg-gray-100 text-gray-700", Suspended: "bg-red-100 text-red-800" };
    return m[s] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Insurers</h1>
        <p className="text-gray-500">{insurers.length} insurance compan{insurers.length !== 1 ? "ies" : "y"}</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 skeleton-shimmer rounded-lg" />)}</div>
        ) : insurers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No insurers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Coverage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospitals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Corporates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {insurers.map((ins) => (
                  <tr key={ins.id} onClick={() => openDetail(ins)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{ins.companyName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ins.city}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{ins.licenseNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{formatPKRShort(Number(ins.maxCoverageLimit))}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ins.networkHospitalCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ins.corporateClientCount}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(ins.status)}`}>{ins.status}</span></td>
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
                  <h2 className="text-xl font-bold text-gray-900">{selected.companyName}</h2>
                  <p className="text-sm text-gray-500">{selected.city}, {selected.province}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><p className="text-xs font-medium text-gray-500">License</p><p className="text-sm font-mono text-gray-900">{selected.licenseNumber}</p></div>
                <div><p className="text-xs font-medium text-gray-500">Status</p><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(selected.status)}`}>{selected.status}</span></div>
                <div><p className="text-xs font-medium text-gray-500">Max Coverage</p><p className="text-sm font-semibold text-gray-900">{formatPKRShort(Number(selected.maxCoverageLimit))}</p></div>
                <div><p className="text-xs font-medium text-gray-500">Operating Since</p><p className="text-sm text-gray-900">{new Date(selected.operatingSince).toLocaleDateString()}</p></div>
                <div><p className="text-xs font-medium text-gray-500">Network Hospitals</p><p className="text-sm text-gray-900">{selected.networkHospitalCount}</p></div>
                <div><p className="text-xs font-medium text-gray-500">Corporate Clients</p><p className="text-sm text-gray-900">{selected.corporateClientCount}</p></div>
                <div className="col-span-2"><p className="text-xs font-medium text-gray-500">Address</p><p className="text-sm text-gray-900">{selected.address}</p></div>
              </div>

              <h3 className="text-sm font-semibold text-gray-700 mb-3">Insurance Plans</h3>
              {plansLoading ? (
                <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-10 skeleton-shimmer rounded" />)}</div>
              ) : plans.length === 0 ? (
                <p className="text-sm text-gray-400">No plans configured</p>
              ) : (
                <div className="space-y-2">
                  {plans.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.planName}</p>
                        <p className="text-xs text-gray-500 font-mono">{p.planCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatPKRShort(Number(p.sumInsured))}</p>
                        <span className={`text-xs ${p.isActive ? "text-green-600" : "text-gray-400"}`}>{p.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
