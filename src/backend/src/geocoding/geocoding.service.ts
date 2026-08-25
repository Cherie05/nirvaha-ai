import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  displayName: string;
}

/** Coimbatore bounding box — nothing outside this is accepted. */
export const COIMBATORE_BBOX = {
  minLon: 76.85,
  maxLat: 11.1,
  maxLon: 77.1,
  minLat: 10.9,
};

export const COIMBATORE_CENTRE = { latitude: 11.0168, longitude: 76.9558 };

/** Known neighbourhood centroids — instant, no network call, always in-bounds. */
export const ZONE_CENTROIDS: Record<
  string,
  { latitude: number; longitude: number }
> = {
  'RS Puram': { latitude: 11.0069, longitude: 76.9525 },
  Peelamedu: { latitude: 11.0299, longitude: 77.0281 },
  Gandhipuram: { latitude: 11.0168, longitude: 76.9674 },
  'Saibaba Colony': { latitude: 11.0227, longitude: 76.9401 },
  Singanallur: { latitude: 11.0021, longitude: 77.0281 },
  Ukkadam: { latitude: 10.9925, longitude: 76.9583 },
  Saravanampatti: { latitude: 11.0785, longitude: 77.0055 },
  Kuniamuthur: { latitude: 10.9502, longitude: 76.9401 },
};

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private lastCallAt = 0;

  constructor(private readonly redis: RedisService) {}

  private inCoimbatore(lat: number, lon: number): boolean {
    return (
      lat >= COIMBATORE_BBOX.minLat &&
      lat <= COIMBATORE_BBOX.maxLat &&
      lon >= COIMBATORE_BBOX.minLon &&
      lon <= COIMBATORE_BBOX.maxLon
    );
  }

  /** Nominatim asks for max 1 request/second. Respect it. */
  private async throttle() {
    const since = Date.now() - this.lastCallAt;
    if (since < 1100) {
      await new Promise((r) => setTimeout(r, 1100 - since));
    }
    this.lastCallAt = Date.now();
  }

  /**
   * Address -> coordinates, locked to Coimbatore.
   *
   * Tries a known zone centroid first (free, instant), then Nominatim.
   * Falls back to the city centre rather than throwing — a household must
   * never fail to register just because a street name is unusual.
   */
  async geocode(address: string, zone?: string): Promise<GeoPoint> {
    const key = `geo:${zone ?? ''}|${address}`.toLowerCase();

    const cached = await this.redis.get(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        /* fall through */
      }
    }

    if (zone && ZONE_CENTROIDS[zone]) {
      const point = {
        ...ZONE_CENTROIDS[zone],
        displayName: `${zone}, Coimbatore`,
      };
      await this.redis.setWithTtl(key, JSON.stringify(point), 604800);
      return point;
    }

    try {
      await this.throttle();
      const { minLon, maxLat, maxLon, minLat } = COIMBATORE_BBOX;
      const url =
        `https://nominatim.openstreetmap.org/search?format=json&limit=1` +
        `&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1` +
        `&q=${encodeURIComponent(`${address}, Coimbatore, Tamil Nadu, India`)}`;

      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Nirvaha/1.0 (hackathon; contact@nirvaha.eco)',
        },
      }).finally(() => clearTimeout(t));

      if (res.ok) {
        const rows: any[] = await res.json();
        if (rows?.length) {
          const lat = parseFloat(rows[0].lat);
          const lon = parseFloat(rows[0].lon);
          if (this.inCoimbatore(lat, lon)) {
            const point: GeoPoint = {
              latitude: lat,
              longitude: lon,
              displayName: rows[0].display_name ?? address,
            };
            await this.redis.setWithTtl(key, JSON.stringify(point), 604800);
            return point;
          }
          this.logger.warn(
            `Geocode for "${address}" landed outside Coimbatore — ignoring.`,
          );
        }
      }
    } catch (e: any) {
      this.logger.warn(
        `Nominatim lookup failed for "${address}": ${e.message}`,
      );
    }

    return { ...COIMBATORE_CENTRE, displayName: `${address}, Coimbatore` };
  }
}
