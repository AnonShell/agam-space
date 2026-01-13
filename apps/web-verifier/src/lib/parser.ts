export function extractVersion(html: string): string | null {
  const versionMatch = html.match(/<meta\s+name=["']agam-version["']\s+content=["']([^"']+)["']/i);
  return versionMatch ? versionMatch[1] : null;
}

export function extractCommit(html: string): string | null {
  const commitMatch = html.match(/<meta\s+name=["']agam-commit["']\s+content=["']([^"']+)["']/i);
  return commitMatch ? commitMatch[1] : null;
}

export function parseIntegrityHashes(html: string): Record<string, string> {
  const hashes: Record<string, string> = {};

  // Extract all script and link tags
  const tagRegex = /<(script|link)[^>]*>/gi;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];
    const tagType = match[1].toLowerCase();

    // Extract src (for scripts) or href (for links)
    const srcMatch = tag.match(/\s+src=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/\s+href=["']([^"']+)["']/i);
    const path = srcMatch ? srcMatch[1] : hrefMatch ? hrefMatch[1] : null;

    // Extract integrity attribute (works regardless of position)
    const integrityMatch = tag.match(/\s+integrity=["'](sha\d+-[^"']+)["']/i);
    const integrity = integrityMatch ? integrityMatch[1] : null;

    // Only add JS/CSS files with integrity hashes
    if (path && integrity) {
      // Include all script files
      if (tagType === 'script') {
        hashes[path] = integrity;
      }
      // Include only stylesheet link tags (not fonts or other resources)
      else if (tagType === 'link' && tag.match(/\s+rel=["']stylesheet["']/i)) {
        hashes[path] = integrity;
      }
    }
  }

  return hashes;
}
