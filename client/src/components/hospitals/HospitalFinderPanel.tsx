"use client";

import { useEffect, useMemo, useState } from "react";
import type { HospitalEntity, HospitalType } from "@/types/hospital";
import { HospitalMap } from "@/components/hospitals/HospitalMap";
import { Coordinates, DEFAULT_CITY_CENTER, formatDistance, haversineDistance } from "@/utils/location";
import { useGeolocation } from "@/hooks/useGeolocation";

type FinderFilters = {
  search: string;
  type: HospitalType | "all";
  requireEmergency: boolean;
  require24Hours: boolean;
};

type FinderState = FinderFilters & {
  activeHospitalId?: string;
};

const STORAGE_KEY = "insurelink:hospital-finder";

const defaultFilters: FinderFilters = {
  search: "",
  type: "all",
  requireEmergency: false,
  require24Hours: false,
};

type HospitalFinderPanelProps = {
  hospitals: HospitalEntity[];
};

const getStoredState = (): FinderState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...defaultFilters,
      ...(parsed ?? {}),
    };
  } catch (error) {
    console.warn("Unable to read hospital finder state", error);
    return null;
  }
};

export function HospitalFinderPanel({ hospitals }: HospitalFinderPanelProps) {
  const storedState = useMemo(() => getStoredState(), []);
  const [filters, setFilters] = useState<FinderFilters>(() => ({
    ...defaultFilters,
    ...(storedState ?? {}),
  }));
  const [activeHospitalId, setActiveHospitalId] = useState<string | undefined>(storedState?.activeHospitalId);

  const { status, position, requestPermission, error, isLoading } = useGeolocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: FinderState = {
      ...filters,
      activeHospitalId,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [activeHospitalId, filters]);

  const hospitalsWithDistance = useMemo(() => {
    const poised: Array<HospitalEntity & { distanceKm?: number; coords?: Coordinates }> = [];

    hospitals.forEach((hospital) => {
      if (typeof hospital.lat === "number" && typeof hospital.lng === "number") {
        const coords = { lat: hospital.lat, lng: hospital.lng };
        poised.push({
          ...hospital,
          coords,
          distanceKm: haversineDistance(position, coords),
        });
      }
    });

    return poised;
  }, [hospitals, position]);

  const filteredHospitals = useMemo(() => {
    return hospitalsWithDistance
      .filter((hospital) => {
        if (filters.type !== "all" && hospital.type !== filters.type) {
          return false;
        }

        if (filters.requireEmergency && !hospital.hasEmergency) {
          return false;
        }

        if (filters.require24Hours && !hospital.is24Hours) {
          return false;
        }

        if (filters.search.trim().length > 0) {
          const query = filters.search.trim().toLowerCase();
          const matchName = hospital.name.toLowerCase().includes(query);
          const matchSpecialty = hospital.specialties.some((specialty) => specialty.toLowerCase().includes(query));
          return matchName || matchSpecialty;
        }

        return true;
      })
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [filters, hospitalsWithDistance]);

  const nearestHospital = filteredHospitals[0];

  const handleFilterToggle = (key: keyof FinderFilters, value?: unknown) => {
    setFilters((prev) => {
      if (key === "type") {
        return { ...prev, type: value as FinderFilters["type"] };
      }

      if (key === "search") {
        return { ...prev, search: (value as string) ?? "" };
      }

      const nextValue = !(prev as Record<string, boolean>)[key];
      return { ...prev, [key]: nextValue };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Smart Hospital Finder</h2>
          <p className="text-sm text-slate-600">
            {status === "denied"
              ? "Location access denied. Using Karachi city center as default."
              : status === "unsupported"
                ? "Geolocation unavailable in this browser. Using Karachi city center."
                : "Allow location access to see hospitals sorted by distance."}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={requestPermission}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 21a9 9 0 1 0-8.485-5.785"
              />
            </svg>
            {status === "granted" ? "Update location" : "Use my location"}
          </button>
          {(status === "denied" || status === "unsupported") && (
            <span className="text-xs text-amber-600">Location permission needed for distance accuracy.</span>
          )}
          {isLoading && <span className="text-xs text-blue-500">Locating…</span>}
          {error && status === "error" && <span className="text-xs text-rose-600">{error}</span>}
        </div>
      </div>

      {nearestHospital && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Nearest panel hospital</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <h3 className="text-base font-semibold text-emerald-900">{nearestHospital.name}</h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {nearestHospital.distanceKm ? formatDistance(nearestHospital.distanceKm) : "Distance unavailable"}
            </span>
            {nearestHospital.hasEmergency && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Emergency</span>
            )}
            {nearestHospital.is24Hours && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">24/7</span>
            )}
          </div>
          <p className="mt-1 text-sm text-emerald-800">{nearestHospital.address}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <section className="order-2 space-y-4 lg:order-1">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterToggle("type", "all")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    filters.type === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterToggle("type", "reimbursable")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    filters.type === "reimbursable"
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Reimbursable
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterToggle("type", "non-reimbursable")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    filters.type === "non-reimbursable"
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Non-reimbursable
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={filters.requireEmergency}
                    onChange={() => handleFilterToggle("requireEmergency")}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Emergency
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={filters.require24Hours}
                    onChange={() => handleFilterToggle("require24Hours")}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  24/7
                </label>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="hospital-search" className="sr-only">
                Search hospitals
              </label>
              <input
                id="hospital-search"
                type="search"
                placeholder="Search by hospital name or specialty…"
                value={filters.search}
                onChange={(event) => handleFilterToggle("search", event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredHospitals.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No hospitals match your current filters.
              </div>
            )}
            {filteredHospitals.map((hospital) => {
              const isActive = activeHospitalId === hospital.id;

              return (
                <article
                  key={hospital.id}
                  className={`rounded-xl border p-4 shadow-sm transition ${
                    isActive
                      ? "border-blue-400 bg-blue-50/60"
                      : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{hospital.name}</h4>
                      <p className="text-sm text-slate-600">{hospital.address}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {hospital.distanceKm && (
                          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M10 18a1 1 0 0 0 .832-.445l5-7a6 6 0 1 0-10.664 0l5 7A1 1 0 0 0 10 18m0-14a4 4 0 0 0-3.332 6.22L10 15.131l3.332-4.91A4 4 0 0 0 10 4m0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"
                                clipRule="evenodd"
                              />
                            </svg>
                            {formatDistance(hospital.distanceKm)}
                          </span>
                        )}
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                            hospital.type === "reimbursable"
                              ? "bg-green-100 text-green-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {hospital.type === "reimbursable" ? "Reimbursable" : "Non-reimbursable"}
                        </span>
                        {hospital.hasEmergency && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">Emergency</span>
                        )}
                        {hospital.is24Hours && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">24/7</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveHospitalId(hospital.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                      >
                        View on map
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 6h5.25m0 0V11.25m0-5.25-6.75 6.75" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6H4.5A1.5 1.5 0 0 0 3 7.5v12A1.5 1.5 0 0 0 4.5 21h12a1.5 1.5 0 0 0 1.5-1.5V18" />
                        </svg>
                      </button>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {hospital.specialties.slice(0, 4).map((specialty) => (
                      <span key={specialty} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {specialty}
                      </span>
                    ))}
                    {hospital.specialties.length > 4 && (
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                        +{hospital.specialties.length - 4} more
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="order-1 lg:order-2">
          <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <HospitalMap
              hospitals={filteredHospitals}
              currentPosition={position ?? DEFAULT_CITY_CENTER}
              activeHospitalId={activeHospitalId ?? nearestHospital?.id}
              onHospitalClick={(hospital) => setActiveHospitalId(hospital.id)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}


