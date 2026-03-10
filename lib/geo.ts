/**
 * Calculate distance between two GPS coordinates using the Haversine formula.
 * Returns distance in miles.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Cluster points within a given radius (in miles).
 * Simple grid-based clustering for performance.
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Cluster {
  lat: number;
  lng: number;
  count: number;
}

export function clusterPoints(
  points: GeoPoint[],
  radiusMiles: number
): Cluster[] {
  // Approximate: 1 degree lat ~ 69 miles, 1 degree lng ~ 54.6 miles at 30° lat
  const latBucket = radiusMiles / 69;
  const lngBucket = radiusMiles / 54.6;

  const buckets = new Map<string, { totalLat: number; totalLng: number; count: number }>();

  for (const point of points) {
    const keyLat = Math.round(point.lat / latBucket) * latBucket;
    const keyLng = Math.round(point.lng / lngBucket) * lngBucket;
    const key = `${keyLat.toFixed(6)},${keyLng.toFixed(6)}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.totalLat += point.lat;
      existing.totalLng += point.lng;
      existing.count++;
    } else {
      buckets.set(key, { totalLat: point.lat, totalLng: point.lng, count: 1 });
    }
  }

  return Array.from(buckets.values())
    .filter((b) => b.count > 1)
    .map((b) => ({
      lat: b.totalLat / b.count,
      lng: b.totalLng / b.count,
      count: b.count,
    }))
    .sort((a, b) => b.count - a.count);
}
