import { publicApi } from "./api";
import type {
  HabitatPlan,
  HabitatPlot,
  HabitatSector,
  HabitatSubSector,
} from "../types/habitat";
import { logCadastreApiRequest } from "../hooks/habitatCadastreLog";
import type { HabitatTileJson } from "../utils/habitatVectorTiles";
import { slimSectorPlotList } from "../utils/habitatPlotGeometryCache";

type ApiList<T> = { success?: boolean; data: T[] };
type ApiOne<T> = { success?: boolean; data: T };
type Paginated<T> = ApiList<T> & {
  pagination?: { page: number; limit: number; total: number; total_pages: number };
};

type SectorPlotFetchOpts = {
  page?: number;
  limit?: number;
  map?: boolean;
  lite?: boolean;
  all?: boolean;
};

const SECTOR_PAGE_SIZE = 500;
const SECTOR_PAGE_FETCH_CONCURRENCY = 4;
const GEOMETRY_BATCH_SIZE = 50;
const GEOMETRY_FETCH_CONCURRENCY = 4;
const TILE_JSON_CACHE_MS = 30 * 60 * 1000;

const tileJsonMemoryCache = new Map<
  number,
  { at: number; data: HabitatTileJson }
>();

const geometryBatchInFlight = new Map<string, Promise<HabitatPlot[]>>();

function slimSectorPlotsJsonResponse(data: unknown): unknown {
  let parsed = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data) as unknown;
    } catch {
      return data;
    }
  }
  if (!parsed || typeof parsed !== "object") return parsed;
  const body = parsed as Paginated<HabitatPlot> & { meta?: { total?: number } };
  if (Array.isArray(body.data)) {
    body.data = slimSectorPlotList(body.data);
  }
  return body;
}

export const habitatApi = {
  async getPlans(): Promise<HabitatPlan[]> {
    const path = "/habitat/plans";
    logCadastreApiRequest("GET", path);
    const res = await publicApi.get<ApiList<HabitatPlan>>(path);
    const plans = res.data?.data ?? [];
    logCadastreApiRequest("GET", path, undefined, { plans_count: plans.length });
    return plans;
  },

  async getSectors(planId: number): Promise<HabitatSector[]> {
    const path = `/habitat/plans/${planId}/sectors`;
    logCadastreApiRequest("GET", path, { plan_id: planId });
    const res = await publicApi.get<ApiList<HabitatSector>>(path);
    const sectors = res.data?.data ?? [];
    logCadastreApiRequest("GET", path, { plan_id: planId }, {
      quartiers_count: sectors.length,
    });
    return sectors;
  },

  async getSubSectors(sectorId: number): Promise<HabitatSubSector[]> {
    const path = `/habitat/sectors/${sectorId}/sub-sectors`;
    logCadastreApiRequest("GET", path, { sector_id: sectorId });
    const res = await publicApi.get<ApiList<HabitatSubSector>>(path);
    const subSectors = res.data?.data ?? [];
    logCadastreApiRequest("GET", path, { sector_id: sectorId }, {
      sub_sectors_count: subSectors.length,
    });
    return subSectors;
  },

  async getSubSector(subSectorId: number): Promise<HabitatSubSector | null> {
    const res = await publicApi.get<ApiOne<HabitatSubSector>>(
      `/habitat/sub-sectors/${subSectorId}`,
    );
    return res.data?.data ?? null;
  },

  /** Same paginate-until-complete strategy as getAllPlotsForSector, scoped to one sub-sector. */
  async getAllPlotsForSubSector(
    subSectorId: number,
    opts?: {
      onPage?: (chunk: HabitatPlot[], loaded: number, total: number) => void;
    },
  ): Promise<{
    plots: HabitatPlot[];
    total: number;
    truncated: boolean;
    fetchPath: string;
  }> {
    const subSectorPath = `/habitat/sub-sectors/${subSectorId}/plots`;
    const t0 = performance.now();

    const first = await this.getPlotsForSubSector(
      subSectorId,
      1,
      SECTOR_PAGE_SIZE,
      { lite: true },
    );
    const total = first.pagination?.total ?? first.plots.length;
    const totalPages = first.pagination?.total_pages ?? 1;

    const all: HabitatPlot[] = slimSectorPlotList(first.plots);
    opts?.onPage?.(all, all.length, total);

    if (totalPages > 1 && all.length < total) {
      const remainingPages: number[] = [];
      for (let p = 2; p <= totalPages; p++) remainingPages.push(p);

      for (
        let i = 0;
        i < remainingPages.length;
        i += SECTOR_PAGE_FETCH_CONCURRENCY
      ) {
        const wave = remainingPages.slice(i, i + SECTOR_PAGE_FETCH_CONCURRENCY);
        const waveResults = await Promise.all(
          wave.map((p) =>
            this.getPlotsForSubSector(subSectorId, p, SECTOR_PAGE_SIZE, {
              lite: true,
            }),
          ),
        );
        for (const { plots } of waveResults) {
          const slim = slimSectorPlotList(plots);
          all.push(...slim);
          opts?.onPage?.(slim, all.length, total);
        }
      }
    }

    const fetchPath = `GET ${subSectorPath}?lite=true&page=1..${totalPages}&limit=${SECTOR_PAGE_SIZE}&concurrency=${SECTOR_PAGE_FETCH_CONCURRENCY}`;
    logCadastreApiRequest("GET", subSectorPath, { lite: true, paginated: true }, {
      plots_loaded: all.length,
      plots_in_db: total,
      pages_fetched: totalPages,
      fetch_path: fetchPath,
      duration_ms: Math.round(performance.now() - t0),
    });

    return {
      plots: all,
      total,
      truncated: all.length < total,
      fetchPath,
    };
  },

  async getPlotsForSubSector(
    subSectorId: number,
    page = 1,
    limit = SECTOR_PAGE_SIZE,
    opts?: Omit<SectorPlotFetchOpts, "page" | "limit">,
  ): Promise<{ plots: HabitatPlot[]; pagination?: Paginated<HabitatPlot>["pagination"] }> {
    const path = `/habitat/sub-sectors/${subSectorId}/plots`;
    const params: Record<string, string | number | boolean> = { page, limit };
    if (opts?.map) params.map = true;
    if (opts?.lite) params.lite = true;
    if (opts?.all) params.all = true;
    logCadastreApiRequest("GET", path, params);
    const res = await publicApi.get<Paginated<HabitatPlot>>(path, {
      params: {
        page,
        limit,
        ...(opts?.map ? { map: true } : {}),
        ...(opts?.lite ? { lite: true } : {}),
        ...(opts?.all ? { all: true } : {}),
      },
      timeout: opts?.all ? 180000 : 60000,
      ...(opts?.lite ? { transformResponse: [slimSectorPlotsJsonResponse] } : {}),
    });
    const plots = res.data?.data ?? [];
    logCadastreApiRequest("GET", path, params, {
      plots_returned: plots.length,
      total: res.data?.pagination?.total,
      page: res.data?.pagination?.page,
    });
    return {
      plots,
      pagination: res.data?.pagination,
    };
  },

  async lookupPlotForLandListing(
    quartierId: number,
    plotNumber: string,
  ): Promise<{
    plot: HabitatPlot | null;
    meta?: {
      quartier_id?: number;
      habitat_sector_id?: number;
      plot_number?: string;
      resolved?: boolean;
      match_kind?: string;
      reason?: string;
      resolve?: Record<string, unknown>;
    };
  }> {
    type LookupMeta = {
      quartier_id?: number;
      habitat_sector_id?: number;
      plot_number?: string;
      resolved?: boolean;
      match_kind?: string;
      reason?: string;
      resolve?: Record<string, unknown>;
    };
    const res = await publicApi.get<
      ApiOne<HabitatPlot | null> & { meta?: LookupMeta }
    >("/habitat/plots/lookup", {
      params: {
        quartier_id: quartierId,
        plot_number: plotNumber.trim(),
      },
      timeout: 15000,
    });
    return {
      plot: res.data?.data ?? null,
      meta: res.data?.meta,
    };
  },

  /**
   * subSectorId narrows the match to one Ilot subdivision — without it, a
   * sector that has sub-sectors can return a plot number that actually
   * belongs to a *different* sub-sector than the one being browsed, which
   * reads as a random/wrong result to the user.
   */
  async lookupPlotInSector(
    sectorId: number,
    plotNumber: string,
    subSectorId?: number | null,
  ): Promise<{
    plot: HabitatPlot | null;
    meta?: {
      resolved?: boolean;
      match_kind?: string;
      reason?: string;
      sub_sector_id?: number | null;
    };
  }> {
    const path = "/habitat/plots/lookup_in_sector";
    const params: Record<string, string | number> = {
      sector_id: sectorId,
      plot_number: plotNumber.trim(),
    };
    if (subSectorId != null) params.sub_sector_id = subSectorId;
    const t0 = performance.now();
    logCadastreApiRequest("GET", path, params);
    const res = await publicApi.get<
      ApiOne<HabitatPlot | null> & {
        meta?: {
          resolved?: boolean;
          match_kind?: string;
          reason?: string;
          sub_sector_id?: number | null;
        };
      }
    >(path, {
      params,
      timeout: 15000,
    });
    logCadastreApiRequest("GET", path, params, {
      resolved: res.data?.meta?.resolved,
      plot_id: res.data?.data?.id ?? null,
      match_kind: res.data?.meta?.match_kind,
      duration_ms: Math.round(performance.now() - t0),
    });
    return {
      plot: res.data?.data ?? null,
      meta: res.data?.meta,
    };
  },

  async getSectorPlotCount(sectorId: number): Promise<number> {
    const path = `/habitat/sectors/${sectorId}/plots`;
    logCadastreApiRequest("GET", path, {
      page: 1,
      limit: 1,
      lite: true,
    });
    const res = await publicApi.get<
      Paginated<HabitatPlot> & { meta?: { total?: number } }
    >(path, {
      params: { page: 1, limit: 1, lite: true },
      timeout: 15000,
    });
    const total =
      res.data?.pagination?.total ??
      res.data?.meta?.total ??
      0;
    logCadastreApiRequest("GET", path, { page: 1, limit: 1, lite: true }, {
      plots_in_db: total,
    });
    return total;
  },

  /**
   * Load every plot for a sector (metadata only — no geometry).
   * Paginates until all plots are loaded — no count cap.
   *
   * Page 1 is fetched alone (it's the only way to learn total_pages), then
   * every remaining page is fetched in bounded-concurrency waves — same
   * pattern as fetchPlotGeometryBatchInternal below. A large quartier
   * (8K+ plots = ~16 pages at 500/page) was taking one full network
   * round-trip *per page, sequentially* — several seconds of dead time on
   * every quartier select. This cuts that to ceil(totalPages/4) round-trips.
   */
  async getAllPlotsForSector(
    sectorId: number,
    opts?: {
      onPage?: (chunk: HabitatPlot[], loaded: number, total: number) => void;
    },
  ): Promise<{
    plots: HabitatPlot[];
    total: number;
    truncated: boolean;
    fetchPath: string;
  }> {
    const sectorPath = `/habitat/sectors/${sectorId}/plots`;
    const t0 = performance.now();

    const first = await this.getPlots(sectorId, 1, SECTOR_PAGE_SIZE, {
      lite: true,
    });
    const total = first.pagination?.total ?? first.plots.length;
    const totalPages = first.pagination?.total_pages ?? 1;

    const all: HabitatPlot[] = slimSectorPlotList(first.plots);
    opts?.onPage?.(all, all.length, total);

    if (totalPages > 1 && all.length < total) {
      const remainingPages: number[] = [];
      for (let p = 2; p <= totalPages; p++) remainingPages.push(p);

      for (
        let i = 0;
        i < remainingPages.length;
        i += SECTOR_PAGE_FETCH_CONCURRENCY
      ) {
        const wave = remainingPages.slice(i, i + SECTOR_PAGE_FETCH_CONCURRENCY);
        const waveResults = await Promise.all(
          wave.map((p) => this.getPlots(sectorId, p, SECTOR_PAGE_SIZE, { lite: true })),
        );
        for (const { plots } of waveResults) {
          const slim = slimSectorPlotList(plots);
          all.push(...slim);
          opts?.onPage?.(slim, all.length, total);
        }
      }
    }

    const fetchPath = `GET ${sectorPath}?lite=true&page=1..${totalPages}&limit=${SECTOR_PAGE_SIZE}&concurrency=${SECTOR_PAGE_FETCH_CONCURRENCY}`;
    logCadastreApiRequest("GET", sectorPath, { lite: true, paginated: true }, {
      plots_loaded: all.length,
      plots_in_db: total,
      pages_fetched: totalPages,
      fetch_path: fetchPath,
      duration_ms: Math.round(performance.now() - t0),
    });

    return {
      plots: all,
      total,
      truncated: all.length < total,
      fetchPath,
    };
  },

  async getPlots(
    sectorId: number,
    page = 1,
    limit = SECTOR_PAGE_SIZE,
    opts?: Omit<SectorPlotFetchOpts, "page" | "limit">,
  ): Promise<{ plots: HabitatPlot[]; pagination?: Paginated<HabitatPlot>["pagination"] }> {
    const path = `/habitat/sectors/${sectorId}/plots`;
    const params: Record<string, string | number | boolean> = { page, limit };
    if (opts?.map) params.map = true;
    if (opts?.lite) params.lite = true;
    if (opts?.all) params.all = true;
    logCadastreApiRequest("GET", path, params);
    const res = await publicApi.get<Paginated<HabitatPlot>>(path, {
      params: {
        page,
        limit,
        ...(opts?.map ? { map: true } : {}),
        ...(opts?.lite ? { lite: true } : {}),
        ...(opts?.all ? { all: true } : {}),
      },
      timeout: opts?.all ? 180000 : 60000,
      ...(opts?.lite ? { transformResponse: [slimSectorPlotsJsonResponse] } : {}),
    });
    const plots = res.data?.data ?? [];
    logCadastreApiRequest("GET", path, params, {
      plots_returned: plots.length,
      total: res.data?.pagination?.total,
      page: res.data?.pagination?.page,
    });
    return {
      plots,
      pagination: res.data?.pagination,
    };
  },

  /** Fetch polygon geometry for visible plots only (keeps bulk index lightweight). */
  async getPlotGeometryBatch(plotIds: number[]): Promise<HabitatPlot[]> {
    const unique = [...new Set(plotIds.filter((id) => id > 0))].sort(
      (a, b) => a - b,
    );
    if (unique.length === 0) return [];

    const dedupeKey = unique.join(",");
    const inFlight = geometryBatchInFlight.get(dedupeKey);
    if (inFlight) return inFlight;

    const promise = this.fetchPlotGeometryBatchInternal(unique);
    geometryBatchInFlight.set(dedupeKey, promise);
    try {
      return await promise;
    } finally {
      geometryBatchInFlight.delete(dedupeKey);
    }
  },

  async fetchPlotGeometryBatchInternal(
    unique: number[],
  ): Promise<HabitatPlot[]> {
    const chunks: number[][] = [];
    for (let i = 0; i < unique.length; i += GEOMETRY_BATCH_SIZE) {
      chunks.push(unique.slice(i, i + GEOMETRY_BATCH_SIZE));
    }

    const t0 = performance.now();
    logCadastreApiRequest("GET", "/habitat/plots/geometry", {
      plot_ids: unique.length,
      batches: chunks.length,
      concurrency: GEOMETRY_FETCH_CONCURRENCY,
    });

    const fetchChunk = async (chunk: number[], batchNum: number): Promise<HabitatPlot[]> => {
      try {
        const res = await publicApi.get<ApiList<HabitatPlot>>("/habitat/plots/geometry", {
          params: { ids: chunk.join(",") },
          timeout: 30000,
        });
        return res.data?.data ?? [];
      } catch {
        const fallback: HabitatPlot[] = [];
        await Promise.all(
          chunk.map(async (id) => {
            const plot = await this.getPlot(id);
            if (plot) fallback.push(plot);
          }),
        );
        return fallback;
      }
    };

    const out: HabitatPlot[] = [];
    for (let i = 0; i < chunks.length; i += GEOMETRY_FETCH_CONCURRENCY) {
      const wave = chunks.slice(i, i + GEOMETRY_FETCH_CONCURRENCY);
      const waveResults = await Promise.all(
        wave.map((chunk, idx) => fetchChunk(chunk, i + idx + 1)),
      );
      for (const batch of waveResults) out.push(...batch);
    }

    logCadastreApiRequest("GET", "/habitat/plots/geometry", {
      plot_ids: unique.length,
      batches: chunks.length,
    }, {
      total_geometry_plots: out.length,
      duration_ms: Math.round(performance.now() - t0),
    });
    return out;
  },

  async getPlot(plotId: number): Promise<HabitatPlot | null> {
    const path = `/habitat/plots/${plotId}`;
    const t0 = performance.now();
    logCadastreApiRequest("GET", path, { plot_id: plotId });
    const res = await publicApi.get<ApiOne<HabitatPlot>>(path);
    logCadastreApiRequest("GET", path, { plot_id: plotId }, {
      duration_ms: Math.round(performance.now() - t0),
    });
    return res.data?.data ?? null;
  },

  async getForSaleLandmarkByPlot(plotId: number): Promise<number | null> {
    const res = await publicApi.get<ApiOne<{ landmark_id?: number } | null>>(
      `/habitat/plots/${plotId}/for_sale_landmark`,
    );
    const landmarkId = Number(res.data?.data?.landmark_id || 0);
    return landmarkId > 0 ? landmarkId : null;
  },

  /**
   * scope narrows the plot half of the results to one sector/sub-sector —
   * pass it whenever the user is already browsing a specific area, so a
   * plot-number search doesn't surface a same-numbered plot from an
   * unrelated part of the city.
   */
  async searchCadastre(
    q: string,
    scope?: { sectorId?: number | null; subSectorId?: number | null },
  ): Promise<{
    plans: HabitatPlan[];
    sectors: HabitatSector[];
    subSectors: HabitatSubSector[];
    plots: HabitatPlot[];
  }> {
    const res = await publicApi.get<{
      data:
        | HabitatPlot[]
        | {
            plans?: HabitatPlan[];
            sectors?: HabitatSector[];
            sub_sectors?: HabitatSubSector[];
            plots?: HabitatPlot[];
          };
    }>("/habitat/search", {
      params: {
        q,
        ...(scope?.sectorId ? { sector_id: scope.sectorId } : {}),
        ...(scope?.subSectorId ? { sub_sector_id: scope.subSectorId } : {}),
      },
      timeout: 15000,
    });
    const data = res.data?.data;
    if (Array.isArray(data)) {
      return { plans: [], sectors: [], subSectors: [], plots: data };
    }
    return {
      plans: data?.plans ?? [],
      sectors: data?.sectors ?? [],
      subSectors: data?.sub_sectors ?? [],
      plots: data?.plots ?? [],
    };
  },

  async searchPlots(q: string): Promise<HabitatPlot[]> {
    const { plots } = await this.searchCadastre(q);
    return plots;
  },

  async getPlotsInBBox(params: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
    zoom: number;
    planId?: number;
    sectorId?: number;
  }): Promise<{
    plots: HabitatPlot[];
    truncated?: boolean;
    sectorTotal?: number;
    totalInBbox?: number;
  }> {
    const res = await publicApi.get<
      ApiList<HabitatPlot> & {
        meta?: {
          truncated?: boolean;
          sector_total?: number;
          total_in_bbox?: number;
        };
      }
    >("/habitat/plots/bbox", {
      params: {
        min_lng: params.minLng,
        min_lat: params.minLat,
        max_lng: params.maxLng,
        max_lat: params.maxLat,
        zoom: params.zoom,
        ...(params.planId ? { plan_id: params.planId } : {}),
        ...(params.sectorId ? { sector_id: params.sectorId } : {}),
      },
      timeout: 20000,
    });
    return {
      plots: res.data?.data ?? [],
      truncated: res.data?.meta?.truncated,
      sectorTotal: res.data?.meta?.sector_total,
      totalInBbox: res.data?.meta?.total_in_bbox,
    };
  },

  async getSectorTileJson(sectorId: number): Promise<HabitatTileJson | null> {
    const cached = tileJsonMemoryCache.get(sectorId);
    if (cached && Date.now() - cached.at < TILE_JSON_CACHE_MS) {
      return cached.data;
    }

    const path = `/habitat/sectors/${sectorId}/tiles.json`;
    const t0 = performance.now();
    logCadastreApiRequest("GET", path, { sector_id: sectorId, cache: "miss" });
    const res = await publicApi.get<HabitatTileJson>(path, { timeout: 12000 });
    const data = res.data ?? null;
    logCadastreApiRequest("GET", path, { sector_id: sectorId }, {
      duration_ms: Math.round(performance.now() - t0),
      plot_count: data?.plot_count,
      cache: data ? "store" : "empty",
    });
    if (data) {
      tileJsonMemoryCache.set(sectorId, { at: Date.now(), data });
    }
    return data;
  },

  /**
   * Point-in-polygon lookup for the native-map raster overlay path — the
   * overlay is a flat PNG with no built-in tap detection, so a map tap
   * resolves to a plot via this instead of a feature-press event.
   */
  async getPlotAtPoint(
    sectorId: number,
    lat: number,
    lng: number,
  ): Promise<number | null> {
    const path = `/habitat/sectors/${sectorId}/plot-at-point`;
    const params = { lat, lng };
    logCadastreApiRequest("GET", path, params);
    const res = await publicApi.get<ApiOne<{ plot_id?: number } | null>>(path, {
      params,
      timeout: 10000,
    });
    const plotId = res.data?.data?.plot_id;
    logCadastreApiRequest("GET", path, params, { plot_id: plotId ?? null });
    return plotId && plotId > 0 ? plotId : null;
  },
};
