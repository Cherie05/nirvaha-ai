import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DigitalBinItem, BinStatus } from './digital-bin-item.entity';
import { AggregationGateway } from './aggregation.gateway';
import { UsersService } from '../users/users.service';
import { RedisService } from '../cache/redis.service';
import {
  GeocodingService,
  ZONE_CENTROIDS,
  COIMBATORE_CENTRE,
} from '../geocoding/geocoding.service';

export interface ZoneRoute {
  zone: string;
  latitude: number;
  longitude: number;
  totalWeightKg: number;
  userCount: number;
  itemCount: number;
  /** How many households in this zone have actually asked to be collected. */
  requestedCount: number;
  /** Oldest outstanding request, so the longest wait can be served first. */
  requestedAt: Date | null;
  breakdown: Record<string, number>;
}

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    @InjectRepository(DigitalBinItem)
    private readonly binRepo: Repository<DigitalBinItem>,
    private readonly gateway: AggregationGateway,
    private readonly usersService: UsersService,
    private readonly geocoding: GeocodingService,
    private readonly redis: RedisService,
  ) {}

  /** B2C: drop one classified item into the user's Digital Bin. */
  async addBinItem(data: {
    userId: string;
    zone: string;
    materialType: string;
    weightGrams: number;
    scanId?: string;
  }) {
    const weight = Number(data.weightGrams);
    const zone = (data.zone || 'Unassigned').trim();

    // One scan, one bin entry — for the whole lifetime of that scan, including
    // after it has been collected. Otherwise re-opening an old scan from
    // History and tapping "Add to bin" inflates the weight with plastic that
    // only ever existed once.
    if (data.scanId) {
      const existing = await this.binRepo.findOne({
        where: { scanId: data.scanId, userId: data.userId },
      });
      if (existing) {
        return {
          ...existing,
          duplicate: true,
          message: existing.status === BinStatus.COLLECTED
              ? 'This item was already collected.'
              : 'This item is already in your bin.',
          bin: await this.getBinSummary(data.userId),
        };
      }
    }

    // Snapshot the household's location onto the item so the vendor map has a
    // pin even if the user later moves or changes address.
    let lat: number | null = null;
    let lng: number | null = null;
    let addr: string | null = null;
    try {
      const user = await this.usersService.findById(data.userId);
      if (user?.latitude != null && user?.longitude != null) {
        lat = user.latitude;
        lng = user.longitude;
        addr = user.address ?? null;
      }
    } catch {
      /* anonymous or unknown user — fall back to the zone centroid */
    }
    if (lat == null || lng == null) {
      const c = ZONE_CENTROIDS[zone] ?? COIMBATORE_CENTRE;
      lat = c.latitude;
      lng = c.longitude;
    }

    const item = this.binRepo.create({
      userId: data.userId,
      zone,
      scanId: data.scanId ?? null,
      materialType: data.materialType || 'OTHER 7',
      weightGrams: isFinite(weight) && weight > 0 ? weight : 0,
      status: BinStatus.PENDING,
      latitude: lat,
      longitude: lng,
      address: addr,
    });
    const saved = await this.binRepo.save(item);

    const summary = await this.getBinSummary(data.userId);

    // Push to every open vendor dashboard immediately.
    this.gateway.emitBinUpdated({
      zone: saved.zone,
      userId: saved.userId,
      materialType: saved.materialType,
      weightGrams: saved.weightGrams,
    });

    return { ...saved, bin: summary };
  }

  /** Milestones are derived from real collected weight — never invented. */
  static readonly MILESTONES = [
    { kg: 1, label: 'First pickup', icon: 'seedling' },
    { kg: 5, label: 'Regular recycler', icon: 'recycle' },
    { kg: 10, label: 'Zone champion', icon: 'trophy' },
  ];

  /** Lifetime weight this user has actually had COLLECTED. */
  async getLifetime(userId: string) {
    const rows = await this.binRepo.find({
      where: { userId, status: BinStatus.COLLECTED },
    });
    const grams = rows.reduce((s, r) => s + (Number(r.weightGrams) || 0), 0);
    const kg = +(grams / 1000).toFixed(2);
    const zones = new Set(rows.map((r) => r.zone));

    const earned = AggregationService.MILESTONES.filter((m) => kg >= m.kg);
    const next = AggregationService.MILESTONES.find((m) => kg < m.kg) ?? null;
    const prevKg = earned.length ? earned[earned.length - 1].kg : 0;

    return {
      collectedKg: kg,
      collectedGrams: Math.round(grams),
      collectedItems: rows.length,
      pickups: zones.size,
      milestones: AggregationService.MILESTONES.map((m) => ({
        ...m,
        achieved: kg >= m.kg,
      })),
      currentMilestone: earned.length ? earned[earned.length - 1] : null,
      nextMilestone: next,
      nextMilestoneProgress: next
        ? Math.min(1, Math.max(0, (kg - prevKg) / (next.kg - prevKg)))
        : 1,
    };
  }

  /**
   * B2C: the user's bin plus what has happened to it.
   *
   * The bin only counts PENDING weight, so it drops to zero the moment a
   * vendor claims the zone. Without the status block below the user would
   * just see their bin silently empty, which reads as data loss rather than
   * a successful pickup.
   */
  async getBinSummary(userId: string, thresholdGrams = 2000) {
    const all = await this.binRepo.find({ where: { userId } });

    const pending = all.filter((r) => r.status === BinStatus.PENDING);
    const scheduled = all.filter((r) => r.status === BinStatus.SCHEDULED);

    const sum = (rows: DigitalBinItem[]) =>
      rows.reduce((s, r) => s + (Number(r.weightGrams) || 0), 0);

    const totalGrams = sum(pending);
    const breakdown: Record<string, number> = {};
    for (const r of pending) {
      breakdown[r.materialType] =
        (breakdown[r.materialType] || 0) + (Number(r.weightGrams) || 0);
    }

    const unlocked = totalGrams >= thresholdGrams;
    const scheduledAt =
      scheduled
        .map((r) => r.scheduledAt)
        .filter(Boolean)
        .sort()[0] ?? null;

    // Oldest outstanding request, so the card can say how long they've waited.
    const requestedAt =
      pending
        .map((r) => r.requestedAt)
        .filter(Boolean)
        .sort()[0] ?? null;

    // The most recent collection, so a just-emptied bin can say why.
    const lastCollectedAt =
      all
        .filter((r) => r.status === BinStatus.COLLECTED && r.collectedAt)
        .map((r) => r.collectedAt as Date)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ??
      null;

    // One word for what the user should see on the bin card.
    let status: 'FILLING' | 'READY' | 'REQUESTED' | 'SCHEDULED' | 'COLLECTED';
    if (scheduled.length > 0) status = 'SCHEDULED';
    else if (requestedAt) status = 'REQUESTED';
    else if (unlocked) status = 'READY';
    else if (totalGrams === 0 && all.length > 0) status = 'COLLECTED';
    else status = 'FILLING';

    const lifetime = await this.getLifetime(userId);

    return {
      userId,
      totalWeightGrams: Math.round(totalGrams),
      totalWeightKg: +(totalGrams / 1000).toFixed(2),
      thresholdGrams,
      thresholdKg: thresholdGrams / 1000,
      progress: Math.min(1, totalGrams / thresholdGrams),
      unlocked,
      itemCount: pending.length,
      breakdown,
      status,
      requestedAt,
      lastCollectedAt,
      scheduled: {
        itemCount: scheduled.length,
        weightKg: +(sum(scheduled) / 1000).toFixed(2),
        scheduledFor: scheduledAt,
      },
      lifetime,
    };
  }

  /**
   * The household asks for their bin to be collected.
   *
   * This used to be a button that only refreshed the screen, so nothing ever
   * happened and the user was left waiting on a request that was never made.
   * Stamping every PENDING item is what puts the zone in front of a vendor as
   * actively waiting rather than merely heavy.
   */
  async requestPickup(userId: string, thresholdGrams = 2000) {
    const pending = await this.binRepo.find({
      where: { userId, status: BinStatus.PENDING },
    });

    if (pending.length === 0) {
      return {
        ok: false,
        message: 'There is nothing in your bin to collect.',
        summary: await this.getBinSummary(userId, thresholdGrams),
      };
    }

    const grams = pending.reduce((s, r) => s + (Number(r.weightGrams) || 0), 0);
    if (grams < thresholdGrams) {
      // Refusing here rather than in the UI alone: a request the vendor cannot
      // profitably serve is worse than no request.
      return {
        ok: false,
        message: `Your bin needs ${(
          (thresholdGrams - grams) / 1000
        ).toFixed(2)} kg more before a pickup is worth the trip.`,
        summary: await this.getBinSummary(userId, thresholdGrams),
      };
    }

    const alreadyRequested = pending.every((r) => r.requestedAt);
    const requestedAt = new Date();

    if (!alreadyRequested) {
      await this.binRepo
        .createQueryBuilder()
        .update(DigitalBinItem)
        .set({ requestedAt })
        .where('userId = :userId AND status = :status AND requestedAt IS NULL', {
          userId,
          status: BinStatus.PENDING,
        })
        .execute();
    }

    const zone = pending[0].zone;
    this.logger.log(
      `Household ${userId} requested a pickup in "${zone}" — ` +
        `${(grams / 1000).toFixed(2)} kg across ${pending.length} item(s).`,
    );

    // Push it to the vendor board immediately; the whole point of the request
    // is that someone sees it without refreshing.
    this.gateway.emitPickupRequested({
      zone,
      userId,
      weightGrams: Math.round(grams),
      itemCount: pending.length,
    });

    return {
      ok: true,
      message: alreadyRequested
        ? 'You have already asked for a pickup. A vendor will claim your zone.'
        : 'Pickup requested. A vendor will collect from your zone.',
      alreadyRequested,
      zone,
      requestedAt,
      weightKg: +(grams / 1000).toFixed(2),
      itemCount: pending.length,
      summary: await this.getBinSummary(userId, thresholdGrams),
    };
  }

  /**
   * Every scan id this user has already binned, in any state.
   *
   * Returned as a flat list so the app can decide, offline-safe, whether to
   * offer "Add to bin" for a scan opened from History.
   */
  async getBinnedScanIds(userId: string): Promise<{ scanIds: string[] }> {
    const rows = await this.binRepo.find({
      where: { userId },
      select: { scanId: true },
    });
    return {
      scanIds: rows
        .map((r) => r.scanId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    };
  }

  /**
   * The household's own collection history — one entry per trip a vendor
   * actually made, newest first.
   */
  async getUserPickups(userId: string) {
    const rows = await this.binRepo.find({
      where: { userId, status: BinStatus.COLLECTED },
    });

    // Group by the day it was collected. Two separate trips to the same zone
    // are two entries; items from one trip are one.
    const batches = new Map<string, any>();
    for (const r of rows) {
      const when = r.collectedAt ?? r.scheduledAt ?? r.createdAt;
      const key = `${r.zone}|${new Date(when).toISOString().slice(0, 10)}`;
      if (!batches.has(key)) {
        batches.set(key, {
          zone: r.zone,
          collectedAt: when,
          grams: 0,
          itemCount: 0,
          materials: {} as Record<string, number>,
        });
      }
      const b = batches.get(key);
      const g = Number(r.weightGrams) || 0;
      b.grams += g;
      b.itemCount += 1;
      b.materials[r.materialType] = (b.materials[r.materialType] || 0) + g;
      // Keep the latest timestamp within the batch.
      if (new Date(when) > new Date(b.collectedAt)) b.collectedAt = when;
    }

    return Array.from(batches.values())
      .map((b) => ({
        zone: b.zone,
        collectedAt: b.collectedAt,
        weightKg: +(b.grams / 1000).toFixed(2),
        itemCount: b.itemCount,
        breakdown: Object.fromEntries(
          Object.entries(b.materials).map(([k, v]) => [
            k,
            +((v as number) / 1000).toFixed(2),
          ]),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime(),
      );
  }

  /**
   * B2B: cluster every PENDING item by neighbourhood.
   * A vendor never sees individual households — only the zone-level total
   * that makes a trip worth driving.
   */
  async getRoutes(minKg = 0): Promise<ZoneRoute[]> {
    const pending = await this.binRepo.find({
      where: { status: BinStatus.PENDING },
    });

    const map = new Map<
      string,
      {
        users: Set<string>;
        grams: number;
        items: number;
        breakdown: Record<string, number>;
        lat: number;
        lng: number;
        n: number;
        requestedUsers: Set<string>;
        requestedAt: Date | null;
      }
    >();

    for (const item of pending) {
      if (!map.has(item.zone)) {
        map.set(item.zone, {
          users: new Set(),
          grams: 0,
          items: 0,
          breakdown: {},
          lat: 0,
          lng: 0,
          n: 0,
          requestedUsers: new Set(),
          requestedAt: null,
        });
      }
      const z = map.get(item.zone)!;
      const g = Number(item.weightGrams) || 0;
      z.users.add(item.userId);
      z.grams += g;
      z.items += 1;
      if (item.requestedAt) {
        z.requestedUsers.add(item.userId);
        // Oldest request wins, so the vendor can serve who has waited longest.
        if (!z.requestedAt || item.requestedAt < z.requestedAt) {
          z.requestedAt = item.requestedAt;
        }
      }
      if (item.latitude != null && item.longitude != null) {
        z.lat += item.latitude;
        z.lng += item.longitude;
        z.n += 1;
      }
      z.breakdown[item.materialType] =
        (z.breakdown[item.materialType] || 0) + g;
    }

    return Array.from(map.entries())
      .map(([zone, z]) => ({
        zone,
        latitude: z.lat / Math.max(1, z.n),
        longitude: z.lng / Math.max(1, z.n),
        totalWeightKg: +(z.grams / 1000).toFixed(2),
        userCount: z.users.size,
        itemCount: z.items,
        /** Households that have actively asked to be collected. */
        requestedCount: z.requestedUsers.size,
        requestedAt: z.requestedAt,
        breakdown: Object.fromEntries(
          Object.entries(z.breakdown).map(([k, v]) => [
            k,
            +(v / 1000).toFixed(2),
          ]),
        ),
      }))
      .filter((r) => r.totalWeightKg >= minKg)
      // A zone somebody is waiting on outranks a merely heavier one.
      .sort(
        (a, b) =>
          b.requestedCount - a.requestedCount ||
          b.totalWeightKg - a.totalWeightKg,
      );
  }

  /**
   * B2B: claim a zone. Every PENDING item in it flips to SCHEDULED at once,
   * so all households in that route are notified by a single vendor action.
   */
  async claimRoute(zone: string, vendorId: string) {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);

    const result = await this.binRepo
      .createQueryBuilder()
      .update(DigitalBinItem)
      .set({
        status: BinStatus.SCHEDULED,
        claimedByVendorId: vendorId,
        scheduledAt,
      })
      .where('zone = :zone AND status = :status', {
        zone,
        status: BinStatus.PENDING,
      })
      .execute();

    const updated = result.affected ?? 0;
    const households = await this.binRepo
      .createQueryBuilder('b')
      .select('COUNT(DISTINCT b.userId)', 'c')
      .where('b.zone = :zone AND b.claimedByVendorId = :vendorId', {
        zone,
        vendorId,
      })
      .getRawOne();

    this.logger.log(
      `Vendor ${vendorId} claimed zone "${zone}" — ${updated} item(s) scheduled.`,
    );

    this.gateway.emitRouteClaimed({
      zone,
      vendorId,
      householdsNotified: Number(households?.c ?? 0),
    });

    return {
      message: `Route in zone ${zone} claimed successfully by vendor ${vendorId}.`,
      zone,
      vendorId,
      updatedCount: updated,
      householdsNotified: Number(households?.c ?? 0),
      scheduledFor: scheduledAt.toISOString(),
    };
  }

  /** Vendor's own claimed routes, for the "Scheduled" column. */
  async getClaimedRoutes(vendorId: string) {
    const rows = await this.binRepo.find({
      where: { claimedByVendorId: vendorId, status: BinStatus.SCHEDULED },
    });
    const map = new Map<
      string,
      {
        grams: number;
        users: Set<string>;
        when: Date | null;
        materials: Record<string, number>;
      }
    >();
    for (const r of rows) {
      if (!map.has(r.zone))
        map.set(r.zone, {
          grams: 0,
          users: new Set(),
          when: r.scheduledAt,
          materials: {},
        });
      const z = map.get(r.zone)!;
      const g = Number(r.weightGrams) || 0;
      z.grams += g;
      z.users.add(r.userId);
      z.materials[r.materialType] = (z.materials[r.materialType] || 0) + g;
    }
    return Array.from(map.entries()).map(([zone, z]) => ({
      zone,
      totalWeightKg: +(z.grams / 1000).toFixed(2),
      userCount: z.users.size,
      scheduledFor: z.when,
      breakdown: Object.fromEntries(
        Object.entries(z.materials).map(([k, v]) => [
          k,
          +((v as number) / 1000).toFixed(2),
        ]),
      ),
    }));
  }

  /** Vendor finished collecting a claimed zone. */
  async completeRoute(zone: string, vendorId: string) {
    const result = await this.binRepo
      .createQueryBuilder()
      .update(DigitalBinItem)
      .set({ status: BinStatus.COLLECTED, collectedAt: new Date() })
      .where(
        'zone = :zone AND status = :status AND claimedByVendorId = :vendorId',
        {
          zone,
          status: BinStatus.SCHEDULED,
          vendorId,
        },
      )
      .execute();

    this.gateway.emitRouteCollected({ zone, vendorId });

    return {
      message: `Zone ${zone} marked collected.`,
      zone,
      updatedCount: result.affected ?? 0,
    };
  }

  /**
   * Everything this vendor has collected, broken down so a vendor can answer
   * "who did this come from and what is in it" without another query.
   */
  async getHistory(vendorId: string) {
    const rows = await this.binRepo.find({
      where: { claimedByVendorId: vendorId, status: BinStatus.COLLECTED },
      order: { collectedAt: 'DESC', createdAt: 'DESC' },
    });

    const userIds = Array.from(new Set(rows.map((r) => r.userId)));
    const names = new Map<string, string>();
    for (const id of userIds) {
      const u = await this.usersService.findById(id).catch(() => null);
      names.set(id, u?.displayName || u?.email || 'Household');
    }

    const zones = new Map<string, any>();
    for (const r of rows) {
      if (!zones.has(r.zone)) {
        zones.set(r.zone, {
          zone: r.zone,
          grams: 0,
          // When it was collected, not when the trip was planned.
          when: r.collectedAt ?? r.scheduledAt,
          materials: {} as Record<string, number>,
          households: new Map<string, any>(),
        });
      }
      const z = zones.get(r.zone);
      const g = Number(r.weightGrams) || 0;
      z.grams += g;
      z.materials[r.materialType] = (z.materials[r.materialType] || 0) + g;

      if (!z.households.has(r.userId)) {
        z.households.set(r.userId, {
          userId: r.userId,
          name: names.get(r.userId) ?? 'Household',
          address: r.address,
          grams: 0,
          materials: {} as Record<string, number>,
          itemCount: 0,
        });
      }
      const h = z.households.get(r.userId);
      h.grams += g;
      h.itemCount += 1;
      h.materials[r.materialType] = (h.materials[r.materialType] || 0) + g;
    }

    const toKg = (m: Record<string, number>) =>
      Object.fromEntries(
        Object.entries(m)
          .map(([k, v]) => [k, +(v / 1000).toFixed(2)])
          .sort((a: any, b: any) => b[1] - a[1]),
      );

    return Array.from(zones.values()).map((z) => ({
      zone: z.zone,
      totalWeightKg: +(z.grams / 1000).toFixed(2),
      userCount: z.households.size,
      collectedOn: z.when,
      breakdown: toKg(z.materials),
      households: Array.from(z.households.values())
        .map((h: any) => ({
          name: h.name,
          address: h.address,
          itemCount: h.itemCount,
          weightKg: +(h.grams / 1000).toFixed(2),
          materials: toKg(h.materials),
        }))
        .sort((a, b) => b.weightKg - a.weightKg),
    }));
  }

  /** Every pickup pin plus the vendor's warehouse, for the dashboard map. */
  async getMapData(vendorId: string) {
    const rows = await this.binRepo.find({
      where: [
        { status: BinStatus.PENDING },
        { status: BinStatus.SCHEDULED, claimedByVendorId: vendorId },
      ],
    });

    // One pin per DOOR, not per item.
    //
    // A household with three bottles used to produce three markers at the same
    // coordinates: they stacked, only the top one was clickable, and its popup
    // showed one bottle's weight while the user's app showed the household
    // total. The vendor drives to an address, so that is what the map shows.
    const grouped = new Map<string, any>();
    for (const r of rows) {
      if (r.latitude == null || r.longitude == null) continue;
      const key = `${r.userId}|${r.zone}|${r.status}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: r.id,
          itemIds: [] as string[],
          userId: r.userId,
          zone: r.zone,
          latitude: r.latitude,
          longitude: r.longitude,
          grams: 0,
          itemCount: 0,
          materials: {} as Record<string, number>,
          status: r.status,
          address: r.address,
          requestedAt: r.requestedAt,
        });
      }
      const g = grouped.get(key);
      const grams = Number(r.weightGrams) || 0;
      g.itemIds.push(r.id);
      g.grams += grams;
      g.itemCount += 1;
      g.materials[r.materialType] = (g.materials[r.materialType] || 0) + grams;
      if (r.address && !g.address) g.address = r.address;
      if (r.requestedAt && (!g.requestedAt || r.requestedAt < g.requestedAt)) {
        g.requestedAt = r.requestedAt;
      }
    }

    // Put a name to each door so the vendor knows who they are collecting from.
    const names = new Map<string, string>();
    for (const uid of new Set(Array.from(grouped.values()).map((g) => g.userId))) {
      const u = await this.usersService.findById(uid).catch(() => null);
      names.set(uid, u?.displayName || u?.email || 'Household');
    }

    const pickups = Array.from(grouped.values()).map((g) => {
      const materials = Object.fromEntries(
        Object.entries(g.materials)
          .map(([k, v]) => [k, +((v as number) / 1000).toFixed(2)])
          .sort((a, b) => (b[1] as number) - (a[1] as number)),
      );
      return {
        id: g.id,
        itemIds: g.itemIds,
        zone: g.zone,
        latitude: g.latitude,
        longitude: g.longitude,
        // Heaviest code, so the pin still has a single headline label.
        materialType: Object.keys(materials)[0] ?? 'OTHER 7',
        materials,
        weightKg: +(g.grams / 1000).toFixed(2),
        itemCount: g.itemCount,
        householdName: names.get(g.userId) ?? 'Household',
        requested: g.requestedAt != null,
        status: g.status,
        address: g.address,
      };
    });

    let warehouse: any = null;
    try {
      const v = await this.usersService.findByEmail(vendorId).catch(() => null);
      const vendor =
        v ?? (await this.usersService.findById(vendorId).catch(() => null));
      if (vendor?.warehouseLat != null && vendor?.warehouseLng != null) {
        warehouse = {
          name: vendor.displayName,
          address: vendor.warehouseAddress,
          latitude: vendor.warehouseLat,
          longitude: vendor.warehouseLng,
        };
      }
    } catch {
      /* no vendor record — map still renders without a warehouse */
    }

    return { centre: COIMBATORE_CENTRE, warehouse, pickups };
  }

  /**
   * Road route from the vendor's warehouse to a zone (visiting each household)
   * or to a single pickup.
   *
   * OSRM's public demo server is free and needs no key, but it is a third
   * party on someone else's network. The call is made server-side so venue
   * wifi cannot block it in the browser, cached in Redis, and always falls
   * back to a straight line rather than leaving the map broken.
   */
  async getRoute(vendorId: string, zone?: string, pickupId?: string) {
    const vendor = await this.usersService.findById(vendorId).catch(() => null);
    const from =
      vendor?.warehouseLat != null && vendor?.warehouseLng != null
        ? { lat: vendor.warehouseLat, lng: vendor.warehouseLng }
        : { lat: COIMBATORE_CENTRE.latitude, lng: COIMBATORE_CENTRE.longitude };

    let stops: { lat: number; lng: number }[] = [];
    let label = '';
    let totalKg = 0;
    let households = 0;
    let destinationAddress = '';
    let destination: { lat: number; lng: number } | null = null;
    let routeZone = '';

    if (pickupId) {
      const item = await this.binRepo.findOne({ where: { id: pickupId } });
      if (item?.latitude != null && item?.longitude != null) {
        stops = [{ lat: item.latitude, lng: item.longitude }];
        label = `${item.materialType} · ${item.zone}`;
        totalKg = +((Number(item.weightGrams) || 0) / 1000).toFixed(2);
        households = 1;
        destinationAddress = item.address || `${item.zone}, Coimbatore, Tamil Nadu`;
        destination = { lat: item.latitude, lng: item.longitude };
        routeZone = item.zone;
      }
    } else if (zone) {
      const rows = await this.binRepo.find({
        where: { zone, status: BinStatus.PENDING },
      });
      const seen = new Set<string>();
      for (const r of rows) {
        totalKg += (Number(r.weightGrams) || 0) / 1000;
        if (r.latitude == null || r.longitude == null) continue;
        const key = `${r.latitude.toFixed(5)},${r.longitude.toFixed(5)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        stops.push({ lat: r.latitude, lng: r.longitude });
      }
      households = new Set(rows.map((r) => r.userId)).size;
      label = zone;
      totalKg = +totalKg.toFixed(2);
      destinationAddress =
        rows.find((r) => r.address)?.address || `${zone}, Coimbatore, Tamil Nadu`;
      if (stops.length) destination = stops[0];
      routeZone = zone;
      // OSRM demo caps waypoints; keep the trip sane.
      stops = stops.slice(0, 12);
    }

    if (stops.length === 0) {
      return { ok: false, message: 'Nothing to route to.' };
    }

    const coords = [from, ...stops].map((p) => `${p.lng},${p.lat}`).join(';');
    const cacheKey = `route:${coords}`;

    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) {
      try {
        return {
          ...JSON.parse(cached),
          label,
          totalKg,
          households,
          destinationAddress,
          destination,
          zone: routeZone,
          cached: true,
        };
      } catch {
        /* fall through */
      }
    }

    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/${coords}` +
        `?overview=full&geometries=geojson`;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal }).finally(() =>
        clearTimeout(t),
      );

      if (res.ok) {
        const data: any = await res.json();
        const r = data?.routes?.[0];
        if (r?.geometry?.coordinates?.length) {
          const payload = {
            ok: true,
            mode: 'road',
            distanceKm: +(r.distance / 1000).toFixed(2),
            durationMin: Math.round(r.duration / 60),
            // GeoJSON is [lng,lat]; Leaflet wants [lat,lng].
            path: r.geometry.coordinates.map((c: number[]) => [c[1], c[0]]),
            from,
            stops,
          };
          await this.redis
            .setWithTtl(cacheKey, JSON.stringify(payload), 3600)
            .catch(() => null);
          return {
            ...payload,
            label,
            totalKg,
            households,
            destinationAddress,
            destination,
            zone: routeZone,
            cached: false,
          };
        }
      }
    } catch (e: any) {
      this.logger.warn(`OSRM routing failed: ${e.message}`);
    }

    // Straight-line fallback — the map must never break on a slow third party.
    const R = 6371;
    let km = 0;
    const seq = [from, ...stops];
    for (let i = 1; i < seq.length; i++) {
      const dLat = ((seq[i].lat - seq[i - 1].lat) * Math.PI) / 180;
      const dLng = ((seq[i].lng - seq[i - 1].lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((seq[i - 1].lat * Math.PI) / 180) *
          Math.cos((seq[i].lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      km += 2 * R * Math.asin(Math.sqrt(a));
    }
    return {
      ok: true,
      mode: 'direct',
      distanceKm: +km.toFixed(2),
      durationMin: Math.round((km / 25) * 60),
      path: seq.map((p) => [p.lat, p.lng]),
      from,
      stops,
      label,
      totalKg,
      households,
      destinationAddress,
      destination,
      zone: routeZone,
      cached: false,
    };
  }

  /**
   * Mark ONE HOUSEHOLD collected, without touching the rest of the zone.
   *
   * Scoped to the household rather than the single row the pin was built from:
   * a vendor at someone's door takes the whole bag. Collecting one row left the
   * neighbours' items alone (correct) but also left the rest of *this* door's
   * items pending, so the same address stayed on the map after being served.
   */
  async completePickup(pickupId: string, vendorId: string) {
    const item = await this.binRepo.findOne({ where: { id: pickupId } });
    if (!item) {
      return { ok: false, message: 'Pickup not found.', updatedCount: 0 };
    }

    const now = new Date();
    const result = await this.binRepo
      .createQueryBuilder()
      .update(DigitalBinItem)
      .set({
        status: BinStatus.COLLECTED,
        claimedByVendorId: vendorId,
        collectedAt: now,
        scheduledAt: item.scheduledAt ?? now,
      })
      .where('userId = :userId AND zone = :zone AND status IN (:...open)', {
        userId: item.userId,
        zone: item.zone,
        open: [BinStatus.PENDING, BinStatus.SCHEDULED],
      })
      .execute();

    const updated = result.affected ?? 0;
    if (updated === 0) {
      return {
        ok: false,
        message: 'That household was already collected.',
        zone: item.zone,
        updatedCount: 0,
      };
    }

    this.gateway.emitRouteCollected({ zone: item.zone, vendorId });

    return {
      ok: true,
      message: `${updated} item${updated === 1 ? '' : 's'} collected in ${item.zone}.`,
      zone: item.zone,
      updatedCount: updated,
    };
  }
}
