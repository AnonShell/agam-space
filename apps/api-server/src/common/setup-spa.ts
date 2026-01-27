import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import sirv from 'sirv';
import { AppConfig } from '@/config/config.schema';

/**
 * Route mapping for Next.js dynamic routes.
 * Maps URL path patterns to their corresponding static HTML file paths.
 */
const DYNAMIC_ROUTE_MAPPINGS = [
  {
    urlPattern: /^\/explorer\/.+/,
    htmlPath: 'explorer/[[...folderId]]/index.html',
  },
  {
    urlPattern: /^\/settings\/.+/,
    htmlPath: 'settings/[tab]/index.html',
  },
  {
    urlPattern: /^\/public\/share/,
    htmlPath: 'public/share/[shareId]/index.html',
  },
];

/**
 * Check if origin is allowed for CORS
 */
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;

  if (origin === 'https://web-verifier.agamspace.app') {
    return true;
  }

  if (process.env.NODE_ENV !== 'production' && origin.match(/^http:\/\/localhost:\d+$/)) {
    return true;
  }

  return false;
}

/**
 * Add CORS headers for integrity verification paths if allowed
 */
function addIntegrityVerificationCorsHeaders(
  requestPath: string,
  origin: string | undefined,
  reply: any,
  config: AppConfig
): boolean {
  if (!(config.integrityVerification?.allowCorsForVerification ?? true)) {
    return false;
  }

  const isAllowedPath =
    requestPath === '/' ||
    requestPath === '/integrity-manifest.json' ||
    DYNAMIC_ROUTE_MAPPINGS.some(route => route.urlPattern.test(requestPath));

  if (!isAllowedPath) {
    return false;
  }

  if (!origin || !isOriginAllowed(origin)) {
    return false;
  }

  reply.raw.setHeader('Access-Control-Allow-Origin', origin);
  reply.raw.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  reply.raw.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  reply.raw.setHeader('Vary', 'Origin');

  return true;
}

/**
 * Configures static file serving and SPA fallback for the application.
 * Uses sirv for efficient static file serving with caching and compression.
 */
export function setupStaticAssets(app: NestFastifyApplication, config: AppConfig): void {
  const publicDir = join(__dirname, '../..', 'public');
  const indexHtmlPath = join(publicDir, 'index.html');

  console.log(`[setupStaticAssets] Checking publicDir: ${publicDir}`);

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

  const sirvHandler = sirv(publicDir, {
    dev: process.env.NODE_ENV === 'development',
    etag: true,
    maxAge: 31536000,
    immutable: true,
    gzip: true,
    brotli: true,
    dotfiles: false,
  });

  instance.options('/*', (request, reply) => {
    const requestPath = request.url.replace(/\?.*$/, '');
    const origin = request.headers.origin;

    if (addIntegrityVerificationCorsHeaders(requestPath, origin, reply, config)) {
      return reply.code(204).send();
    }

    return reply.code(404).send();
  });

  instance.get('/*', (request, reply) => {
    const requestPath = request.url.replace(/\?.*$/, '');

    if (requestPath.startsWith('/api') || requestPath.startsWith('/docs')) {
      reply.callNotFound();
      return;
    }

    const origin = request.headers.origin;

    addIntegrityVerificationCorsHeaders(requestPath, origin, reply, config);

    sirvHandler(request.raw, reply.raw, () => {
      // If sirv didn't handle it, fallback to SPA routes
      for (const route of DYNAMIC_ROUTE_MAPPINGS) {
        if (route.urlPattern.test(requestPath)) {
          const dynamicHtmlPath = join(publicDir, route.htmlPath);
          if (existsSync(dynamicHtmlPath)) {
            const dynamicHtml = readFileSync(dynamicHtmlPath, 'utf-8');
            reply
              .header('Cache-Control', 'no-cache, must-revalidate')
              .header('Pragma', 'no-cache')
              .header('Expires', '0')
              .type('text/html')
              .send(dynamicHtml);
            return;
          }
        }
      }

      reply
        .header('Cache-Control', 'no-cache, must-revalidate')
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .type('text/html')
        .send(indexHtml);
    });
  });

  console.log('[setupStaticAssets] Static file serving configured with sirv');
}
