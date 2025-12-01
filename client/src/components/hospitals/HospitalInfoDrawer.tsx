'use client';

import { useEffect, useMemo } from 'react';

interface HospitalInfo {
  id: string;
  name: string;
  location: string;
  specializations: string;
  phone: string;
  address: string;
  status: 'Active' | 'Pending' | 'Rejected';
}

interface HospitalInfoDrawerProps {
  hospital: HospitalInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onDecision?: (hospitalId: string, action: 'approve' | 'reject') => void;
}

export default function HospitalInfoDrawer({ hospital, isOpen, onClose, onDecision }: HospitalInfoDrawerProps) {
  const statusChip = useMemo(() => {
    if (!hospital) {
      return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
    switch (hospital.status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  }, [hospital]);

  const quickInsights = useMemo(
    () => [
      {
        label: 'Avg. Claim Value',
        value: 'Rs. 218k',
        accent: 'from-indigo-500/15 to-blue-500/15'
      },
      {
        label: 'SLA Compliance',
        value: '97%',
        accent: 'from-emerald-500/15 to-green-500/15'
      },
      {
        label: 'Dispute Rate',
        value: '0.8%',
        accent: 'from-amber-500/15 to-orange-500/15'
      }
    ],
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !hospital) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-fade-in">
        <div className="relative overflow-hidden border-b border-gray-100 px-8 py-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-blue-500/5 to-purple-600/5 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">Network Hospital</p>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold text-gray-900">{hospital.name}</h3>
                <span className="inline-flex items-center rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700">
                  ID: {hospital.id}
                </span>
              </div>
              <p className="text-sm text-gray-500">{hospital.location}</p>
            </div>
            <button
              onClick={onClose}
              className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ${statusChip}`}>
              {hospital.status}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-4 py-1 text-sm font-medium text-slate-700">
              📞 {hospital.phone}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-gray-500">Specializations</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{hospital.specializations}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickInsights.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border border-white/70 bg-gradient-to-br ${card.accent} p-4 shadow-sm`}
              >
                <p className="text-[11px] uppercase text-gray-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-gray-500">Engagement Snapshot</p>
            <ul className="mt-3 space-y-3 text-sm text-gray-700">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                98% of patients report positive experience
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Last dispute resolved 12 days ago
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Avg. document turnaround: 6 business hours
              </li>
            </ul>
          </div>

          {hospital.status === 'Pending' && (
            <div className="sticky bottom-0 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase text-gray-500">Decision</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onDecision?.(hospital.id, 'reject')}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
                >
                  Reject Hospital
                </button>
                <button
                  onClick={() => onDecision?.(hospital.id, 'approve')}
                  className="flex-1 rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                  Approve Hospital
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

