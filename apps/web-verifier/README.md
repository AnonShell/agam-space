# Agam Space Web Verifier

**URL:** https://web-verifier.agamspace.app

Verify that the web assets (HTML, CSS, JavaScript) served by an Agam Space
instance match the official release.

## What It Does

Compares cryptographic hashes of frontend files against the official release
manifest from GitHub. Detects if the client-side code has been modified.

**Important:** This only verifies web assets served to your browser. It does not
verify server-side code, API behavior, or backend functionality.

## How to Use

Enter the instance URL (e.g., `https://agam.example.com`) and click verify.

The verifier will automatically fetch and verify all HTML routes along with all
JavaScript and CSS files.

## What Gets Verified

**Complete Frontend Verification:**

- ✅ ALL HTML files (root, explorer, settings routes)
- ✅ All JavaScript files with SRI hashes
- ✅ All CSS files with SRI hashes
- ✅ Complete frontend integrity

**NOT verified:**

- Server-side code, API endpoints, database
- Server configuration

## Requirements

- Instance must be running a tagged release (v0.2.7 or later)
- Cannot verify dev builds or custom versions
- Instance must have `ALLOW_CORS_FOR_INTEGRITY_VERIFICATION=true` (enabled by
  default) or be publicly accessible with no authentication layer

## Technical Details

**Hashes are extracted from:**

- `<script integrity="sha384-...">` tags
- `<link integrity="sha384-...">` tags

**Official manifest source:**

- GitHub Releases: `github.com/agam-space/agam-space/releases`
- File: `integrity-manifest.json`

**Version detection:**

- `<meta name="agam-version" content="v0.2.7">`

## Development

```bash
pnpm install
pnpm dev
```

Runs on `http://localhost:3004`

## Build

```bash
pnpm build
```

Generates static site in `.next/` directory.

## License

Same as Agam Space main project.
