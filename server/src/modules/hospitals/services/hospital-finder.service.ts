import { Injectable } from '@nestjs/common';
import { HospitalsRepository } from '../repositories/hospitals.repository';

@Injectable()
export class HospitalFinderService {
  constructor(private readonly hospitalsRepository: HospitalsRepository) {}

  /**
   * Find hospitals near a given location using geo-spatial search
   * @param latitude - Latitude of the search point
   * @param longitude - Longitude of the search point
   * @param radiusKm - Radius in kilometers (default: 50)
   * @returns Array of hospitals sorted by distance
   */
  async findNearby(latitude: number, longitude: number, radiusKm: number = 50) {
    return this.hospitalsRepository.findNear(latitude, longitude, radiusKm);
  }

  /**
   * Find hospitals by city
   * @param city - City name
   * @param isActive - Filter by active status (optional)
   * @returns Array of hospitals in the city
   */
  async findByCity(city: string, isActive: boolean = true) {
    return this.hospitalsRepository.findByCity(city, isActive);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param lat1 - First latitude
   * @param lon1 - First longitude
   * @param lat2 - Second latitude
   * @param lon2 - Second longitude
   * @returns Distance in kilometers
   */
  private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
