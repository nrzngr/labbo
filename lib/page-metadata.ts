import type { Metadata } from "next";

export const BASE_APP_TITLE = "Labbo Lab Inventory";

/**
 * Returns a formatted page title following the Labbo naming rules.
 * - Home & dashboard: "Labbo Lab Inventory"
 * - Other pages: "Labbo | <Page Name>"
 */
export const formatPageTitle = (pageName?: string) =>
  pageName ? `Labbo | ${pageName}` : BASE_APP_TITLE;

export const createPageMetadata = (pageName?: string): Metadata => ({
  title: formatPageTitle(pageName),
});
