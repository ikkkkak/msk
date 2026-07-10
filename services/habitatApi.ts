import { publicApi } from "./api";
import type { HabitatPlan, HabitatPlot, HabitatSector } from "../types/habitat";
import { logCadastreApiRequest } from "../hooks/habitatCadastreLog";
import type { HabitatTileJson } from "../utils/habitatVectorTiles";

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
const GEOMETRY_BATCH_SIZE = 120;

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

  async lookupPlotInSector(
    sectorId: number,
    plotNumber: string,
  ): Promise<{
    plot: HabitatPlot | null;
    meta?: { resolved?: boolean; match_kind?: string; reason?: string };
  }> {
    const path = "/habitat/plots/lookup_in_sector";
    const params = { sector_id: sectorId, plot_number: plotNumber.trim() };
    const t0 = performance.now();
    logCadastreApiRequest("GET", path, params);
    const res = await publicApi.get<
      ApiOne<HabitatPlot | null> & {
        meta?: { resolved?: boolean; match_kind?: string; reason?: string };
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
   * Paginates until the server total is reached so quartiers are never partially loaded.
   */
  async getAllPlotsForSector(
    sectorId: number,
    maxPlots = 20000,
  ): Promise<{
    plots: HabitatPlot[];
    total: number;
    truncated: boolean;
    fetchPath: string;
  }> {
    const sectorPath = `/habitat/sectors/${sectorId}/plots`;
    const targetCount = Math.min(maxPlots, await this.getSectorPlotCount(sectorId));
    if (targetCount === 0) {
      logCadastreApiRequest("GET", sectorPath, { all: true, lite: true }, {
        plots_loaded: 0,
        plots_in_db: 0,
        fetch_path: "empty sector",
      });
      return { plots: [], total: 0, truncated: false, fetchPath: "empty sector" };
    }

    if (targetCount <= maxPlots) {
      try {
        logCadastreApiRequest("GET", sectorPath, { all: true, lite: true });
        const res = await publicApi.get<
          Paginated<HabitatPlot> & { meta?: { total?: number; truncated?: boolean } }
        >(sectorPath, {
          params: { all: true, lite: true },
          timeout: 180000,
        });
        const plots = res.data?.data ?? [];
        const total = res.data?.meta?.total ?? res.data?.pagination?.total ?? plots.length;
        if (plots.length >= Math.min(total, maxPlots)) {
          const fetchPath = `GET ${sectorPath}?all=true&lite=true`;
          logCadastreApiRequest("GET", sectorPath, { all: true, lite: true }, {
            plots_loaded: plots.length,
            plots_in_db: total,
            fetch_path: fetchPath,
          });
          return {
            plots: plots.slice(0, maxPlots),
            total,
            truncated: plots.length < total || total > maxPlots,
            fetchPath,
          };
        }
      } catch {
        // Fall through to pagination.
      }
    }

    const all: HabitatPlot[] = [];
    let page = 1;
    let total = targetCount;
    let totalPages = Math.ceil(targetCount / SECTOR_PAGE_SIZE);

    while (page <= totalPages && all.length < maxPlots) {
      const { plots, pagination } = await this.getPlots(sectorId, page, SECTOR_PAGE_SIZE, {
        lite: true,
      });
      if (plots.length === 0) break;

      all.push(...plots);
      total = pagination?.total ?? total;
      totalPages = pagination?.total_pages ?? totalPages;

      if (all.length >= total) break;
      page += 1;
    }

    const fetchPath = `GET ${sectorPath}?lite=true&page=1..${page}&limit=${SECTOR_PAGE_SIZE}`;
    logCadastreApiRequest("GET", sectorPath, { lite: true, paginated: true }, {
      plots_loaded: all.length,
      plots_in_db: total,
      pages_fetched: page,
      fetch_path: fetchPath,
    });

    return {
      plots: all.slice(0, maxPlots),
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
    const unique = [...new Set(plotIds.filter((id) => id > 0))];
    if (unique.length === 0) return [];

    const out: HabitatPlot[] = [];
    const batchCount = Math.ceil(unique.length / GEOMETRY_BATCH_SIZE);
    logCadastreApiRequest("GET", "/habitat/plots/geometry", {
      plot_ids: unique.length,
      batches: batchCount,
    });
    for (let i = 0; i < unique.length; i += GEOMETRY_BATCH_SIZE) {
      const chunk = unique.slice(i, i + GEOMETRY_BATCH_SIZE);
      const batchNum = Math.floor(i / GEOMETRY_BATCH_SIZE) + 1;
      try {
        logCadastreApiRequest("GET", "/habitat/plots/geometry", {
          batch: batchNum,
          ids_count: chunk.length,
        });
        const res = await publicApi.get<ApiList<HabitatPlot>>("/habitat/plots/geometry", {
          params: { ids: chunk.join(",") },
          timeout: 30000,
        });
        const batch = res.data?.data ?? [];
        logCadastreApiRequest("GET", "/habitat/plots/geometry", {
          batch: batchNum,
          ids_count: chunk.length,
        }, { plots_returned: batch.length });
        out.push(...batch);
      } catch {
        for (const id of chunk) {
          const plot = await this.getPlot(id);
          if (plot) out.push(plot);
        }
      }
    }
    logCadastreApiRequest("GET", "/habitat/plots/geometry", {
      plot_ids: unique.length,
      batches: batchCount,
    }, { total_geometry_plots: out.length });
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

  async searchCadastre(q: string): Promise<{
    plans: HabitatPlan[];
    sectors: HabitatSector[];
    plots: HabitatPlot[];
  }> {
    const res = await publicApi.get<{
      data:
        | HabitatPlot[]
        | { plans?: HabitatPlan[]; sectors?: HabitatSector[]; plots?: HabitatPlot[] };
    }>("/habitat/search", { params: { q }, timeout: 15000 });
    const data = res.data?.data;
    if (Array.isArray(data)) {
      return { plans: [], sectors: [], plots: data };
    }
    return {
      plans: data?.plans ?? [],
      sectors: data?.sectors ?? [],
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
    const path = `/habitat/sectors/${sectorId}/tiles.json`;
    logCadastreApiRequest("GET", path, { sector_id: sectorId });
    const res = await publicApi.get<HabitatTileJson>(path, { timeout: 15000 });
    return res.data ?? null;
  },
};
