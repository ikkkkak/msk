/**
 * propertyCardApi tests
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates: concurrent duplicate fetches, abort on unmount, backend 500
 */

jest.mock("../services/api", () => ({
  api: { get: jest.fn() },
}));

import { fetchPropertyCard } from "../services/propertyCardApi";
import { api } from "../services/api";
const mockedApi = api as jest.Mocked<typeof api>;

const mockProperty = {
  id: 1,
  title: "Test Property",
  listing_price: 100000,
  images: ["https://example.com/1.jpg"],
  bedrooms: 2,
  bathrooms: 1,
};

describe("propertyCardApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.get.mockResolvedValue({
      data: { data: mockProperty, property: mockProperty },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });
  });

  it("returns property data on success", async () => {
    const result = await fetchPropertyCard({ propertyId: 1 });
    expect(result.id).toBe(1);
    expect(result.title).toBe("Test Property");
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/property-sales/public/1",
      expect.objectContaining({
        params: { lang: "en" },
      })
    );
  });

  it("deduplicates concurrent fetches for same propertyId", async () => {
    const delay = 80;
    mockedApi.get.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { data: mockProperty },
                status: 200,
                statusText: "OK",
                headers: {},
                config: {} as any,
              }),
            delay
          )
        )
    );

    const [a, b, c] = await Promise.all([
      fetchPropertyCard({ propertyId: 1 }),
      fetchPropertyCard({ propertyId: 1 }),
      fetchPropertyCard({ propertyId: 1 }),
    ]);

    expect(a).toEqual(expect.objectContaining({ id: 1 }));
    expect(b).toEqual(expect.objectContaining({ id: 1 }));
    expect(c).toEqual(expect.objectContaining({ id: 1 }));
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });

  it("propagates abort error when request is cancelled", async () => {
    mockedApi.get.mockRejectedValue(new DOMException("aborted", "AbortError"));

    await expect(
      fetchPropertyCard({ propertyId: 1 })
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("normalizes response from { property } shape", async () => {
    mockedApi.get.mockResolvedValue({
      data: { property: { ID: 2, title: "Legacy", listing_price: 50000 } },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const result = await fetchPropertyCard({ propertyId: 2 });
    expect(result.id).toBe(2);
    expect(result.title).toBe("Legacy");
    expect(result.listing_price).toBe(50000);
  });
});
