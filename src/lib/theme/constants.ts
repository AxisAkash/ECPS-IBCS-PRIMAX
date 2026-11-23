export type Theme = "light" | "dark";
export const THEME_COOKIE = "ecps-theme";

/** Light is the default whenever no explicit choice has been saved. */
export function parseTheme(value: string | undefined): Theme {
  return value === "dark" ? "dark" : "light";
}
