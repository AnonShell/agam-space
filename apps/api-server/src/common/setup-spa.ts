import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import sirv from 'sirv';

/**
 * Route mapping for Next.js dynamic routes.
 * Maps URL path patterns to their corresponding static HTML file paths.
 */
const DYNAMIC_ROUTE_MAPPINGS = [
  {
    // Match /explorer/* paths
    urlPattern: /^\/explorer\/.+/,
    htmlPath: 'explorer/[[...folderId]]/index.html',
  },
  {
    // Match /settings/* paths (but not /settings itself)
    urlPattern: /^\/settings\/.+/,
    htmlPath: 'settings/[tab]/index.html',
  },
];

/**
 * Configures static file serving and SPA fallback for the application.
 * Uses sirv for efficient static file serving with caching and compression.
 */
export function setupStaticAssets(app: NestFastifyApplication): void {
  const publicDir = join(__dirname, '../..', 'public');
  const indexHtmlPath = join(publicDir, 'index.html');

  console.log(`[setupStaticAssets] Checking publicDir: ${publicDir}`);

  // Load root index.html for fallback
  let indexHtml = '';
  if (existsSync(indexHtmlPath)) {
    indexHtml = readFileSync(indexHtmlPath, 'utf-8');
    console.log('[setupStaticAssets] index.html found.');
  } else {
    console.warn(`[setupStaticAssets] ⚠️  index.html not found at ${indexHtmlPath}`);
    return;
  }

  if (!existsSync(publicDir)) {
    console.warn(`[setupStaticAssets] ⚠️  public directory not found at ${publicDir}`);
    return;
  }

  console.log('[setupStaticAssets] public directory found.');

  const instance = app.getHttpAdapter().getInstance();

  // Create sirv handler with optimal settings
  const sirvHandler = sirv(publicDir, {
    dev: process.env.NODE_ENV === 'development',
    etag: true,
    maxAge: 31536000,
    immutable: true,
    gzip: true,
    brotli: true,
    dotfiles: false,
  });

  instance.get('/*', (request, reply) => {
    const requestPath = request.url.replace(/\?.*$/, '');

    // Skip API and docs routes - let NestJS handle them
    if (requestPath.startsWith('/api') || requestPath.startsWith('/docs')) {
      reply.callNotFound();
      return;
    }

    sirvHandler(request.raw, reply.raw, () => {
      // Next.js static export creates route-specific HTML files with different JS bundles
      // Check if this path matches any dynamic route pattern
      for (const route of DYNAMIC_ROUTE_MAPPINGS) {
        if (route.urlPattern.test(requestPath)) {
          const dynamicHtmlPath = join(publicDir, route.htmlPath);
          if (existsSync(dynamicHtmlPath)) {
            const dynamicHtml = readFileSync(dynamicHtmlPath, 'utf-8');
            reply.type('text/html').send(dynamicHtml);
            return;
          }
        }
      }

      // Default: serve root index.html
      reply.type('text/html').send(indexHtml);
    });
  });

  console.log('[setupStaticAssets] Static file serving configured with sirv');
}
