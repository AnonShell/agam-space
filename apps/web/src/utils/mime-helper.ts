export function isImage(mime: string) {
  return mime.startsWith('image/');
}

export function isText(mime: string, filename?: string): boolean {
  const knownTextMimes = [
    'application/json',
    'application/javascript',
    'application/xml',
    'application/yaml',
    'application/x-yaml',
    'application/x-env',
  ];

  if (mime.startsWith('text/')) return true;
  if (knownTextMimes.includes(mime)) return true;

  // Check by extension if provided
  if (filename) {
    const ext = filename.toLowerCase();
    return (
      ext.endsWith('.md') ||
      ext.endsWith('.json') ||
      ext.endsWith('.js') ||
      ext.endsWith('.ts') ||
      ext.endsWith('.html') ||
      ext.endsWith('.css') ||
      ext.endsWith('.env') ||
      ext.endsWith('.yml') ||
      ext.endsWith('.yaml')
    );
  }

  return false;
}

export function isPdf(mime: string) {
  return mime === 'application/pdf';
}

export function isVideo(mime: string) {
  return mime.startsWith('video/');
}

export function detectLanguage(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.md')) return 'markdown';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.ts')) return 'typescript';
  if (lower.endsWith('.js')) return 'javascript';
  if (lower.endsWith('.html')) return 'html';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.env')) return 'ini';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
  return 'plaintext';
}
