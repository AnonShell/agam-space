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

  const scriptRegex =
    /<script[^>]*\s+src=["']([^"']+)["'][^>]*\s+integrity=["'](sha\d+-[^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const [, src, integrity] = match;
    hashes[src] = integrity;
  }

  const linkRegex = /<link[^>]*\s+href=["']([^"']+)["'][^>]*\s+integrity=["'](sha\d+-[^"']+)["']/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const [, href, integrity] = match;
    hashes[href] = integrity;
  }

  return hashes;
}
