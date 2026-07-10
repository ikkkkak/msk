import { states } from "../constants/USStates";

export const getStateAbbreviation = (state: string) => {
  if (!state) return "";
  // In Mauritania we return the wilaya label itself
  const key = state.replaceAll(" ", "_");
  const match = (states as any)[key] || (states as any)[state];
  return match || state;
};
