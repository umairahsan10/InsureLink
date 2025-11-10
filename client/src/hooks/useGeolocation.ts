"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coordinates, DEFAULT_CITY_CENTER } from "@/utils/location";

type GeolocationStatus = "idle" | "requesting" | "granted" | "denied" | "error" | "unsupported";

type UseGeolocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  /** When true, skip auto-request on mount and expose only the request function. */
  manual?: boolean;
};

type UseGeolocationReturn = {
  status: GeolocationStatus;
  position: Coordinates;
  error?: string;
  requestPermission: () => void;
  setManualPosition: (coords: Coordinates) => void;
  isLoading: boolean;
};

const STORAGE_KEY = "insurelink:lastKnownLocation";

const getStoredLocation = (): Coordinates | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
      return parsed as Coordinates;
    }
  } catch (err) {
    console.warn("Failed to parse stored location", err);
  }

  return null;
};

const persistLocation = (coords: Coordinates) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
};

export function useGeolocation(options?: UseGeolocationOptions): UseGeolocationReturn {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [position, setPosition] = useState<Coordinates>(
    () => getStoredLocation() ?? DEFAULT_CITY_CENTER,
  );
  const [error, setError] = useState<string>();
  const requestedRef = useRef(false);

  const geolocationOptions = useMemo<PositionOptions>(
    () => ({
      enableHighAccuracy: options?.enableHighAccuracy ?? false,
      timeout: options?.timeout ?? 10_000,
      maximumAge: options?.maximumAge ?? 5 * 60 * 1000,
    }),
    [options?.enableHighAccuracy, options?.maximumAge, options?.timeout],
  );

  const setManualPosition = useCallback((coords: Coordinates) => {
    setPosition(coords);
    persistLocation(coords);
    setStatus("granted");
  }, []);

  const handleSuccess = useCallback(
    (geoPosition: GeolocationPosition) => {
      const coords = {
        lat: geoPosition.coords.latitude,
        lng: geoPosition.coords.longitude,
      };
      setPosition(coords);
      setStatus("granted");
      setError(undefined);
      persistLocation(coords);
    },
    [],
  );

  const handleError = useCallback((geoError: GeolocationPositionError) => {
    const stored = getStoredLocation();
    if (stored) {
      setPosition(stored);
    } else {
      setPosition(DEFAULT_CITY_CENTER);
    }

    if (geoError.code === geoError.PERMISSION_DENIED) {
      setStatus("denied");
    } else {
      setStatus("error");
    }

    setError(geoError.message);
  }, []);

  const requestPermission = useCallback(() => {
    if (requestedRef.current) {
      return;
    }
    requestedRef.current = true;

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      setError("Geolocation is not supported in this environment.");
      return;
    }

    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geolocationOptions);
  }, [geolocationOptions, handleError, handleSuccess]);

  useEffect(() => {
    if (!options?.manual) {
      requestPermission();
    }
  }, [options?.manual, requestPermission]);

  return {
    status,
    position,
    error,
    requestPermission,
    setManualPosition,
    isLoading: status === "requesting",
  };
}


