#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
/**
 * Generate Integrity Manifest
 *
 * Extracts SRI hashes from HTML and generates a manifest for verifying
 * deployed instances against the official build.
 *
 * Usage: node scripts/generate-integrity-manifest.js <output-directory>
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { glob } = require('glob');
const cheerio = require('cheerio');

/**
 * Calculate SHA-384 hash of a file
 * @param {string} filePath - Path to file
 * @returns {string} Base64-encoded SHA-384 hash
 */
function calculateHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha384').update(content).digest('base64');
}

/**
 * Get git commit hash if available
 * @returns {string|null} Git commit hash or null
 */
function getGitCommit() {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Extract SRI hashes from HTML files (reuse hashes from add-sri.js)
 * @param {string} outputDir - Build output directory
 * @returns {Promise<Object>} Map of file paths to integrity hashes
 */
async function extractHashesFromHtml(outputDir) {
  const htmlFiles = await glob('**/*.html', {
    cwd: outputDir,
    nodir: true,
    absolute: false,
  });

  const hashes = {};

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(outputDir, htmlFile);
    const html = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(html);

    // Extract from <script> tags with integrity
    $('script[integrity]').each((_, element) => {
      const src = $(element).attr('src');
      const integrity = $(element).attr('integrity');
      if (src && integrity) {
        const urlPath = src.startsWith('/') ? src : '/' + src;
        hashes[urlPath] = integrity;
      }
    });

    // Extract from <link> tags with integrity
    $('link[integrity]').each((_, element) => {
      const href = $(element).attr('href');
      const integrity = $(element).attr('integrity');
      if (href && integrity) {
        const urlPath = href.startsWith('/') ? href : '/' + href;
        hashes[urlPath] = integrity;
      }
    });

    // Also hash the HTML file itself
    const htmlHash = calculateHash(htmlPath);
    const htmlUrlPath = '/' + htmlFile.replace(/\\/g, '/');
    hashes[htmlUrlPath] = `sha384-${htmlHash}`;
  }

  return hashes;
}

/**
 * Generate integrity manifest for all assets
 * @param {string} outputDir - Build output directory
 * @returns {Promise<Object>} Assets with integrity hashes
 */
async function generateManifest(outputDir) {
  console.log('📦 Extracting hashes from HTML (SRI)...\n');

  // First, extract all hashes that are already in HTML from add-sri.js
  const assets = await extractHashesFromHtml(outputDir);
  const extractedCount = Object.keys(assets).length;

  console.log(`✅ Extracted ${extractedCount} hashes from HTML (zero recalculation!)\n`);

  // Now scan for additional files that might not be referenced in HTML
  // (JSON configs, manifests, etc. - exclude images/fonts as they're not security-critical)
  console.log('📦 Scanning for additional assets...\n');

  const patterns = ['**/*.json', '**/*.txt', '**/*.xml'];

  const additionalFiles = await glob(patterns, {
    cwd: outputDir,
    nodir: true,
    absolute: false,
  });

  let additionalCount = 0;

  for (const file of additionalFiles) {
    const normalizedPath = file.replace(/\\/g, '/');
    const urlPath = normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath;

    // Skip if we already have this file's hash from HTML
    if (assets[urlPath]) {
      continue;
    }

    const fullPath = path.join(outputDir, file);

    try {
      const hash = calculateHash(fullPath);
      assets[urlPath] = `sha384-${hash}`;
      additionalCount++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  if (additionalCount > 0) {
    console.log(`✅ Calculated ${additionalCount} additional file hashes\n`);
  } else {
    console.log(`✅ No additional files to hash\n`);
  }

  console.log(`📊 Total assets in manifest: ${Object.keys(assets).length}`);

  return assets;
}

/**
 * Read package.json version
 * @returns {string|null} Version or null
 */
function getVersion() {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version || null;
  } catch {
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/generate-integrity-manifest.js <output-directory>');
    console.error('Example: node scripts/generate-integrity-manifest.js apps/web/out');
    process.exit(1);
  }

  const outputDir = args[0];

  if (!fs.existsSync(outputDir)) {
    console.error(`❌ Error: Directory not found: ${outputDir}`);
    process.exit(1);
  }

  console.log('🔐 Generating Integrity Manifest...');
  console.log(`📁 Output directory: ${outputDir}\n`);

  const assets = await generateManifest(outputDir);

  const gitCommit = getGitCommit();

  const manifestWithoutHash = {
    manifestVersion: '1.0',
    build: {
      version: getVersion(),
      commit: gitCommit,
      timestamp: new Date().toISOString(),
    },
    assets,
  };

  const manifestJsonWithoutHash = JSON.stringify(manifestWithoutHash, null, 2);
  const manifestHash = crypto.createHash('sha384').update(manifestJsonWithoutHash).digest('base64');

  const manifest = {
    ...manifestWithoutHash,
    manifestHash: `sha384-${manifestHash}`,
  };

  const manifestPath = path.join(outputDir, 'integrity-manifest.json');
  const finalManifestJson = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(manifestPath, finalManifestJson + '\n', 'utf8');

  console.log('\n✅ Integrity manifest generated successfully!');
  console.log(`📄 Manifest: ${manifestPath}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
