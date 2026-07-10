import React from "react";
import { LocationPickerList } from "../location/LocationPickerList";
import type { LocationPickerItem } from "../location/LocationPickerList";

type Props = {
  title?: string;
  subtitle?: string;
  items: LocationPickerItem[];
  selectedId?: number;
  search: string;
  onSearchChange: (q: string) => void;
  onSelect: (item: LocationPickerItem) => void;
  label: (item: LocationPickerItem) => string;
  loading?: boolean;
  emptyText?: string;
  disabled?: boolean;
  leadingOption?: {
    key: string;
    label: string;
    selected: boolean;
    onPress: () => void;
  };
};

/** Add-with-AI location step — uses shared LocationPickerList (AI theme). */
export function ListingAiLocationPickerStep(props: Props) {
  return <LocationPickerList {...props} variant="ai" />;
}
