/**
 * PropertySaleList.test.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for PropertySaleList component with TanStack Query infinite scroll.
 *
 * Tests cover:
 * • Initial loading state with skeleton
 * • Fetching and displaying properties
 * • Infinite scroll pagination
 * • Pull-to-refresh functionality
 * • Error handling with retry
 * • Empty state
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  render,
  screen,
  waitFor,
  fireEvent
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PropertySaleList from "./PropertySaleList";
import { usePropertiesInfinite } from "../../hooks/usePropertiesInfinite";

// Mock dependencies
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key
  })
}));

jest.mock("../../components/ZillowStylePropertyCard", () => ({
  ZillowStylePropertyCard: ({ property }: any) => (
    <MockPropertyCard property={property} />
  ),
  ZillowStylePropertyCardSkeleton: () => <MockSkeleton />
}));

jest.mock("../../components/PropertyCardWithQuery", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    PropertyCardWithQuery: ({
      propertyId,
      initialProperty,
      onPress
    }: {
      propertyId: number;
      initialProperty?: any;
      onPress: (id: number) => void;
    }) =>
      React.createElement(
        TouchableOpacity,
        {
          testID: `property-${propertyId}`,
          onPress: () => onPress(propertyId)
        },
        React.createElement(
          Text,
          {},
          (initialProperty || {}).title ?? `Property ${propertyId}`
        )
      )
  };
});

jest.mock("../../hooks/usePropertiesInfinite");
jest.mock("../../hooks/queries/useBannersQuery", () => ({
  useBannersQuery: () => ({ data: [] }),
}));

// Mock components
const MockPropertyCard = ({ property }: any) => (
  <View testID={`property-${property.id}`}>
    <Text>{property.title}</Text>
  </View>
);

const MockSkeleton = () => <View testID="skeleton-loader" />;

// Sample data
const mockProperties = [
  {
    id: 1,
    title: "Beautiful Villa",
    listing_price: 50000,
    images: ["https://example.com/1.jpg"],
    bedrooms: 3,
    bathrooms: 2
  },
  {
    id: 2,
    title: "Modern Apartment",
    listing_price: 30000,
    images: ["https://example.com/2.jpg"],
    bedrooms: 2,
    bathrooms: 1
  }
];

const createMockQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

const renderWithQueryProvider = (component: React.ReactElement) => {
  const queryClient = createMockQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("PropertySaleList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders skeleton loaders while loading", () => {
    (usePropertiesInfinite as jest.Mock).mockReturnValue({
      data: null,
      isPending: true,
      isLoading: true,
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      hasNextPage: false
    });

    renderWithQueryProvider(<PropertySaleList />);

    const skeletons = screen.getAllByTestId("skeleton-loader");
    expect(skeletons.length).toBe(4); // Default skeletonCount = 4
  });

  it("displays properties after loading", async () => {
    (usePropertiesInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [{ items: mockProperties, page: 1, total: 2, hasMore: false }]
      },
      isPending: false,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      hasNextPage: false
    });

    renderWithQueryProvider(<PropertySaleList />);

    await waitFor(() => {
      expect(screen.getByTestID("property-1")).toBeDefined();
      expect(screen.getByTestID("property-2")).toBeDefined();
    });
  });

  it("calls fetchNextPage when reaching end of list", async () => {
    const mockFetchNextPage = jest.fn();

    (usePropertiesInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [{ items: mockProperties, page: 1, total: 4, hasMore: true }]
      },
      isPending: false,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      fetchNextPage: mockFetchNextPage,
      refetch: jest.fn(),
      hasNextPage: true
    });

    const { getByTestId } = renderWithQueryProvider(<PropertySaleList />);

    // Simulate scrolling to end
    const flashList = getByTestId("flash-list"); // Assuming FlashList has testID
    fireEvent.scroll(flashList, {
      nativeEvent: { contentOffset: { y: 1000 } }
    });

    await waitFor(() => {
      expect(mockFetchNextPage).toHaveBeenCalled();
    });
  });

  it("calls refetch when pulling to refresh", async () => {
    const mockRefetch = jest.fn();

    (usePropertiesInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [{ items: mockProperties, page: 1, total: 2, hasMore: false }]
      },
      isPending: false,
      isLoading: false,
      isFetching: true,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      refetch: mockRefetch,
      hasNextPage: false
    });

    const { getByTestId } = renderWithQueryProvider(<PropertySaleList />);

    // Simulate pull-to-refresh
    const refreshControl = getByTestId("refresh-control");
    fireEvent(refreshControl, "onRefresh");

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it("displays error message and retry button on error", async () => {
    const mockRefetch = jest.fn();

    (usePropertiesInfinite as jest.Mock).mockReturnValue({
      data: null,
      isPending: false,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      isError: true,
      error: new Error("Network error"),
      fetchNextPage: jest.fn(),
      refetch: mockRefetch,
      hasNextPage: false
    });

    renderWithQueryProvider(<PropertySaleList />);

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeDefined();
      expect(screen.getByText("Try Again")).toBeDefined();
    });

    // Click retry button
    fireEvent.press(screen.getByText("Try Again"));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it("displays empty state when no properties", async () => {
    (usePropertiesInfinite as jest.Mock).mockReturnValue({
      data: { pages: [{ items: [], page: 1, total: 0, hasMore: false }] },
      isPending: false,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      hasNextPage: false
    });

    renderWithQueryProvider(<PropertySaleList />);

    await waitFor(() => {
      expect(screen.getByText("No properties found")).toBeDefined();
    });
  });

  it("does not fetch next page if already fetching", () => {
    const mockFetchNextPage = jest.fn();

    (usePropertiesInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [{ items: mockProperties, page: 1, total: 4, hasMore: true }]
      },
      isPending: false,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: true, // Already fetching
      isError: false,
      error: null,
      fetchNextPage: mockFetchNextPage,
      refetch: jest.fn(),
      hasNextPage: true
    });

    renderWithQueryProvider(<PropertySaleList />);

    // Simulate reaching end
    const flashList = screen.getByTestId("flash-list");
    fireEvent.scroll(flashList, {
      nativeEvent: { contentOffset: { y: 1000 } }
    });

    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it("flattens multiple pages correctly", async () => {
    const page1 = [
      { id: 1, title: "Property 1", listing_price: 10000, images: [] },
      { id: 2, title: "Property 2", listing_price: 20000, images: [] }
    ];
    const page2 = [
      { id: 3, title: "Property 3", listing_price: 30000, images: [] },
      { id: 4, title: "Property 4", listing_price: 40000, images: [] }
    ];

    (usePropertiesInfinite as jest.Mock).mockReturnValue({
      data: {
        pages: [
          { items: page1, page: 1, total: 4, hasMore: true },
          { items: page2, page: 2, total: 4, hasMore: false }
        ]
      },
      isPending: false,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
      hasNextPage: false
    });

    renderWithQueryProvider(<PropertySaleList />);

    await waitFor(() => {
      for (let i = 1; i <= 4; i++) {
        expect(screen.getByTestID(`property-${i}`)).toBeDefined();
      }
    });
  });
});
