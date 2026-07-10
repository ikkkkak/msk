# Filter Components

Clean, Airbnb-style filtering components for properties and property sales.

## Components

### 1. PropertyFilterModal
Modal for filtering rental properties with amenities, property types, and more.

```tsx
import { PropertyFilterModal, PropertyFilters } from './PropertyFilterModal';

const [filters, setFilters] = useState<PropertyFilters>({
  priceRange: [0, 10000],
  propertyType: 'all',
  bedrooms: 0,
  bathrooms: 0,
  amenities: [],
  sortBy: 'relevance',
});

<PropertyFilterModal
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  onApply={(newFilters) => setFilters(newFilters)}
  initialFilters={filters}
/>
```

### 2. PropertySaleFilterModal
Modal for filtering property sales with location, property types, and more.

```tsx
import { PropertySaleFilterModal, PropertySaleFilters } from './PropertySaleFilterModal';

const [filters, setFilters] = useState<PropertySaleFilters>({
  priceRange: [0, 4000000],
  propertyType: 'all',
  bedrooms: 0,
  bathrooms: 0,
  location: 'all',
  sortBy: 'newest',
});

<PropertySaleFilterModal
  visible={showFilters}
  onClose={() => setShowFilters(false)}
  onApply={(newFilters) => setFilters(newFilters)}
  initialFilters={filters}
/>
```

### 3. FilterButton
Button to open filter modals with active filter count badge.

```tsx
import { FilterButton } from './FilterButton';

<FilterButton
  onPress={() => setShowFilters(true)}
  activeFiltersCount={3}
  title="Filters"
/>
```

### 4. FilterBar
Horizontal scrollable bar showing active filter chips.

```tsx
import { FilterBar } from './FilterBar';

<FilterBar
  chips={[
    { id: 'price', label: '0 - 10000 MRU', onRemove: () => {} },
    { id: 'type', label: 'Apartment', onRemove: () => {} },
  ]}
  onClearAll={() => resetFilters()}
/>
```

### 5. PriceRangeSlider
Interactive slider for price range selection.

```tsx
import { PriceRangeSlider } from './PriceRangeSlider';

<PriceRangeSlider
  min={0}
  max={10000}
  value={[1000, 5000]}
  onChange={(range) => setPriceRange(range)}
  step={100}
  formatValue={(val) => `${val} MRU`}
/>
```

## Hooks

### usePropertyFilters
Hook for managing property filter state.

```tsx
import { usePropertyFilters } from '../hooks/usePropertyFilters';

const {
  filters,
  updateFilters,
  resetFilters,
  getActiveFiltersCount,
  getFilterChips,
} = usePropertyFilters();
```

### usePropertySaleFilters
Hook for managing property sale filter state.

```tsx
import { usePropertySaleFilters } from '../hooks/usePropertySaleFilters';

const {
  filters,
  updateFilters,
  resetFilters,
  getActiveFiltersCount,
  getFilterChips,
} = usePropertySaleFilters();
```

## Server Endpoints

The components automatically fetch data from these endpoints:

- `GET /api/categories?type=property` - Property categories
- `GET /api/categories/amenities` - Property amenities
- `GET /api/categories/amenities/categories` - Amenity categories

## Features

- ✅ Clean, Airbnb-style design
- ✅ Real-time filter count badges
- ✅ Smooth animations and transitions
- ✅ Responsive layout
- ✅ TypeScript support
- ✅ Server integration
- ✅ Amenity and category fetching
- ✅ Price range sliders
- ✅ Filter chips with remove functionality
- ✅ Clear all functionality

## Usage Example

```tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { PropertyFilterModal, PropertyFilters } from './PropertyFilterModal';
import { FilterButton } from './FilterButton';
import { FilterBar } from './FilterBar';
import { usePropertyFilters } from '../hooks/usePropertyFilters';

export const PropertyScreen = () => {
  const [showFilters, setShowFilters] = useState(false);
  const {
    filters,
    updateFilters,
    resetFilters,
    getActiveFiltersCount,
    getFilterChips,
  } = usePropertyFilters();

  return (
    <View>
      <FilterButton
        onPress={() => setShowFilters(true)}
        activeFiltersCount={getActiveFiltersCount()}
        title="Filters"
      />
      
      <FilterBar
        chips={getFilterChips()}
        onClearAll={resetFilters}
      />
      
      <PropertyFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          updateFilters(newFilters);
          setShowFilters(false);
        }}
        initialFilters={filters}
      />
    </View>
  );
};
```

## Styling

All components use consistent styling with:
- Airbnb-inspired design
- Clean typography
- Proper spacing and padding
- Shadow effects
- Rounded corners
- Color scheme: #222222 (text), #FF385C (accent), #F7F7F7 (background)
