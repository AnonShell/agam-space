#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
/**
 * Add Subresource Integrity (SRI) hashes to Next.js static export
 *
 * This script:
 * 1. Scans all HTML files in the Next.js output directory
 * 2. Finds all <script> and <link> tags referencing local assets
 * 3. Calculates SHA-384 hashes for the referenced files
 * 4. Adds integrity and crossorigin attributes to the tags
 *
 * Usage: node scripts/add-sri.js <output-directory>
 * Example: node scripts/add-sri.js apps/web/out
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { glob } = require('glob');
const cheerio = require('cheerio');

function calculateHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha384').update(content).digest('base64');
}

/**
 * Process a single HTML file and add SRI attributes
 * @param {string} htmlPath - Path to HTML file
 * @param {string} baseDir - Base directory for resolving asset paths
 * @returns {number} Number of tags updated
 */
function processHtmlFile(htmlPath, baseDir) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);
  let updateCount = 0;

  // Process <script> tags
  $('script[src]').each((_, element) => {
    const src = $(element).attr('src');

    // Only process local assets (starting with / or _next)
    if (!src || src.startsWith('http://') || src.startsWith('https://')) {
      return;
    }

    // Resolve file path (decode URL encoding like %5B -> [)
    const decodedSrc = decodeURIComponent(src);
    const assetPath = path.join(
      baseDir,
      decodedSrc.startsWith('/') ? decodedSrc.slice(1) : decodedSrc
    );

    if (!fs.existsSync(assetPath)) {
      console.warn(`⚠️  Warning: Asset not found: ${src} (${assetPath})`);
      return;
    }

    try {
      const hash = calculateHash(assetPath);
      $(element).attr('integrity', `sha384-${hash}`);
      $(element).attr('crossorigin', 'anonymous');
      updateCount++;
    } catch (error) {
      console.error(`❌ Error processing ${src}:`, error.message);
    }
  });

  // Process <link> tags (stylesheets, preloads)
  $('link[href]').each((_, element) => {
    const href = $(element).attr('href');
    const rel = $(element).attr('rel');

    // Only process stylesheets and preloads
    if (rel !== 'stylesheet' && rel !== 'preload') {
      return;
    }

    // Only process local assets
    if (!href || href.startsWith('http://') || href.startsWith('https://')) {
      return;
    }

    const decodedHref = decodeURIComponent(href);
    const assetPath = path.join(
      baseDir,
      decodedHref.startsWith('/') ? decodedHref.slice(1) : decodedHref
    );

    if (!fs.existsSync(assetPath)) {
      console.warn(`⚠️  Warning: Asset not found: ${href} (${assetPath})`);
      return;
    }

    try {
      const hash = calculateHash(assetPath);
      $(element).attr('integrity', `sha384-${hash}`);
      $(element).attr('crossorigin', 'anonymous');
      updateCount++;
    } catch (error) {
      console.error(`❌ Error processing ${href}:`, error.message);
    }
  });

  // Write updated HTML back to file
  if (updateCount > 0) {
    fs.writeFileSync(htmlPath, $.html(), 'utf8');
  }

  return updateCount;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/add-sri.js <output-directory>');
    console.error('Example: node scripts/add-sri.js apps/web/out');
    process.exit(1);
  }

  const outputDir = args[0];

  if (!fs.existsSync(outputDir)) {
    console.error(`❌ Error: Directory not found: ${outputDir}`);
    process.exit(1);
  }

  console.log('🔒 Adding SRI (Subresource Integrity) hashes...');
  console.log(`📁 Output directory: ${outputDir}\n`);

  // Find all HTML files
  const htmlFiles = await glob('**/*.html', {
    cwd: outputDir,
    absolute: false,
  });

  if (htmlFiles.length === 0) {
    console.warn('⚠️  No HTML files found');
    process.exit(0);
  }

  console.log(`📄 Found ${htmlFiles.length} HTML file(s)\n`);

  let totalUpdates = 0;
  const startTime = Date.now();

  for (const htmlFile of htmlFiles) {
    const fullPath = path.join(outputDir, htmlFile);
    const updates = processHtmlFile(fullPath, outputDir);

    if (updates > 0) {
      console.log(`✅ ${htmlFile}: ${updates} tag(s) updated`);
      totalUpdates += updates;
    }
  }

  const duration = Date.now() - startTime;

  console.log(
    `\n✨ Done! Updated ${totalUpdates} tag(s) in ${htmlFiles.length} file(s) (${duration}ms)`
  );
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
