/**
 * Route mapping for Agam Space dynamic routes.
 * Duplicated from api-server/src/common/setup-spa.ts
 *
 * Maps HTML file paths to sample URLs that can be fetched for verification.
 */

export interface RouteMapping {
  htmlPath: string;
  sampleUrl: string;
}

/**
 * All HTML routes that need to be verified
 */
export const HTML_ROUTE_MAPPINGS: RouteMapping[] = [
  {
    htmlPath: '/index.html',
    sampleUrl: '/',
  },
  {
    htmlPath: '/explorer/[[...folderId]]/index.html',
    sampleUrl: '/explorer/root',
  },
  {
    htmlPath: '/settings/[tab]/index.html',
    sampleUrl: '/settings/general',
  },
];
