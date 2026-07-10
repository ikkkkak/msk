/** API rental unit type — not building category. */
export type RentUnitType = "entire_place" | "private_room" | "shared_room";

const UNIT_TYPES = new Set<RentUnitType>([
  "entire_place",
  "private_room",
  "shared_room",
]);

/** Maps compose / draft values → POST /property `propertyType`. */
export function resolveRentUnitType(
  raw?: string | null,
): RentUnitType {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "private_room" || v === "shared_room") return v;
  return "entire_place";
}

export function isRentUnitType(raw?: string | null): raw is RentUnitType {
  return UNIT_TYPES.has(resolveRentUnitType(raw));
}
