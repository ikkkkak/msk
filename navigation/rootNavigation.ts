import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";

let rootNav: NavigationContainerRefWithCurrent<any> | null = null;

export function setRootNavigationRef(
  ref: NavigationContainerRefWithCurrent<any> | null,
): void {
  rootNav = ref;
}

/** Switch to the Organizations tab so the publish progress card is visible. */
export function navigateToOrganizationsTab(): void {
  const nav = rootNav;
  if (!nav?.isReady?.()) return;
  try {
    nav.navigate("Organizations" as never);
  } catch {
    /* tab may not be mounted yet */
  }
}
