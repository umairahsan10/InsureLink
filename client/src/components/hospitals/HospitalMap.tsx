"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { Icon, LeafletMouseEvent } from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import type { HospitalEntity } from "@/types/hospital";
import { Coordinates, formatDistance, haversineDistance } from "@/utils/location";
import type { GeolocationStatus } from "@/hooks/useGeolocation";

const DEFAULT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

type HospitalMapProps = {
  hospitals: HospitalEntity[];
  currentPosition: Coordinates;
  activeHospitalId?: string;
  onHospitalClick?: (hospital: HospitalEntity) => void;
  geolocationStatus?: GeolocationStatus;
};

type HospitalWithDistance = HospitalEntity & {
  distanceKm?: number;
};

const HighestPriorityRecenter = ({ position }: { position: Coordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setView([position.lat, position.lng], undefined, { animate: true });
  }, [map, position]);

  return null;
};

export function HospitalMap({
  hospitals,
  currentPosition,
  activeHospitalId,
  onHospitalClick,
  geolocationStatus,
}: HospitalMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [markerIcon, setMarkerIcon] = useState<Icon | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!isClient) return;

    const loadIcon = async () => {
      // @ts-expect-error: Dynamic CSS import for Leaflet styles available only in browser
      await import("leaflet/dist/leaflet.css");
      const leaflet = await import("leaflet");
      if (!isMounted) return;
      setMarkerIcon(
        leaflet.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      );
    };

    loadIcon();

    return () => {
      isMounted = false;
    };
  }, [isClient]);

  const hospitalsWithCoords = useMemo<HospitalWithDistance[]>(() => {
    return hospitals
      .filter((hospital): hospital is HospitalWithDistance => Boolean(hospital.lat && hospital.lng))
      .map((hospital) => {
        const distanceKm = haversineDistance(currentPosition, {
          lat: hospital.lat!,
          lng: hospital.lng!,
        });
        return { ...hospital, distanceKm };
      })
      .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));
  }, [currentPosition, hospitals]);

  const nearestHospital = hospitalsWithCoords[0];

  const markerLayers = useMemo(() => {
    return hospitalsWithCoords.map((hospital) => {
      const isNearest = nearestHospital?.id === hospital.id;
      const isActive = activeHospitalId === hospital.id;
      const markerColor = isActive ? "#0ea5e9" : isNearest ? "#22c55e" : "#1d4ed8";

      const circleRadius = isActive ? 18 : isNearest ? 14 : 0;

      const handleClick = (event: LeafletMouseEvent) => {
        event.originalEvent.stopPropagation();
        onHospitalClick?.(hospital);
      };

      return (
        <Fragment key={hospital.id}>
          {circleRadius > 0 && (
            <CircleMarker
              center={[hospital.lat!, hospital.lng!]}
              radius={circleRadius}
              pathOptions={{
                color: markerColor,
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
          )}
          <Marker position={[hospital.lat!, hospital.lng!]} icon={markerIcon} eventHandlers={{ click: handleClick }}>
            <Popup>
              <div className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{hospital.name}</h3>
                  <p className="text-xs text-slate-600">{hospital.address}</p>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <dt className="font-medium text-slate-500">Distance</dt>
                    <dd className="text-slate-800">
                      {hospital.distanceKm ? formatDistance(hospital.distanceKm) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Availability</dt>
                    <dd>
                      {hospital.is24Hours ? "24/7" : "Business hours"}
                      {hospital.hasEmergency ? " • ER" : ""}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-1">
                  {hospital.specialties.slice(0, 3).map((specialty) => (
                    <span key={specialty} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                      {specialty}
                    </span>
                  ))}
                  {hospital.specialties.length > 3 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                      +{hospital.specialties.length - 3} more
                    </span>
                  )}
                </div>
                <a
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="h-3.5 w-3.5">
                    <path
                      fill="currentColor"
                      d="M4.5 15a.5.5 0 0 1-.5-.5V5a1 1 0 0 1 1-1h9.5a.5.5 0 0 1 0 1H5a.5.5 0 0 0-.5.5v9a.5.5 0 0 1-.5.5m4.707-2.707a1 1 0 0 1 0-1.414l4.147-4.146-1.231-1.23a.5.5 0 1 1 .708-.708l1.585 1.585a1 1 0 0 1 0 1.414l-4.146 4.146a1 1 0 0 1-1.415 0"
                    />
                  </svg>
                </a>
              </div>
            </Popup>
          </Marker>
        </Fragment>
      );
    });
  }, [activeHospitalId, hospitalsWithCoords, markerIcon, nearestHospital, onHospitalClick]);

  if (!isClient || !markerIcon) {
    return <div className="h-[440px] w-full animate-pulse rounded-xl bg-slate-100" />;
  }

  return (
    <div className="relative w-full">
      <MapContainer
        center={[currentPosition.lat, currentPosition.lng]}
        zoom={12}
        className="h-[440px] w-full rounded-xl"
        scrollWheelZoom
      >
        <HighestPriorityRecenter position={currentPosition} />
        <TileLayer url={DEFAULT_TILE_URL} attribution={DEFAULT_ATTRIBUTION} />

        {geolocationStatus === "granted" && (
          <CircleMarker
            center={[currentPosition.lat, currentPosition.lng]}
            radius={8}
            pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.8 }}
          />
        )}

        {markerLayers}
      </MapContainer>
    </div>
  );
}


