import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import sirv from 'sirv';

/**
 * Configures static file serving and SPA fallback for the application.
 * Uses sirv for efficient static file serving with caching and compression.
 */
export function setupStaticAssets(app: NestFastifyApplication): void {
  const publicDir = join(__dirname, '../..', 'public');
  const indexHtmlPath = join(publicDir, 'index.html');

  // Log the resolved paths
  console.log(`[setupStaticAssets] Checking publicDir: ${publicDir}`);

  // Load index.html once at startup for SPA fallback
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
  } else {
    console.log('[setupStaticAssets] public directory found.');
  }

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
    const requestPath = request.url.replace(/\?.*$/, ''); // Remove query params

    // Skip API and docs routes - let NestJS handle them
    if (requestPath.startsWith('/api') || requestPath.startsWith('/docs')) {
      reply.callNotFound();
      return;
    }

    sirvHandler(request.raw, reply.raw, () => {
      reply.type('text/html').send(indexHtml);
    });
  });

  console.log('[setupStaticAssets] Static file serving configured with sirv');
}
