/**
 * Utility functions for location handling and display
 */

import { LocationInfo } from '@/type';

export type { LocationInfo };

/**
 * Convert coordinates to a human-readable location name
 * Uses OpenStreetMap Nominatim API (free, no key required)
 */
export async function getLocationName(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MealHop/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.municipality;
      const state = data.address.state || data.address.region;
      const country = data.address.country;
      
      if (city && state) {
        return `Near ${city}, ${state}`;
      } else if (city) {
        return `Near ${city}`;
      } else if (state) {
        return `Near ${state}`;
      } else if (country) {
        return `Near ${country}`;
      }
    }

    return null;
  } catch (error) {
    console.warn('Failed to get location name:', error);
    return null;
  }
}

/**
 * Format coordinates as a fallback display
 */
export function formatCoordinates(lat: number, lng: number): string {
  const roundedLat = lat.toFixed(2);
  const roundedLng = lng.toFixed(2);
  
  if (lat >= 37.0 && lat <= 40.0 && lng >= -102.0 && lng <= -94.6) {
    return "Near Kansas, USA";
  }
  
  if (lat >= 40.5 && lat <= 40.9 && lng >= -74.1 && lng <= -73.7) {
    return "Near New York, NY";
  }
  
  return `${roundedLat}, ${roundedLng}`;
}

/**
 * Get display name for location (with caching)
 */
const locationCache = new Map<string, string>();

export async function getLocationDisplayName(
  lat: number,
  lng: number
): Promise<string> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!;
  }

  const name = await getLocationName(lat, lng);
  
  if (name) {
    locationCache.set(cacheKey, name);
    return name;
  }

  const formatted = formatCoordinates(lat, lng);
  locationCache.set(cacheKey, formatted);
  return formatted;
}

