---
id: web-assets-integrity-verification
title: Web Assets Integrity Verification
---

# Web Assets Integrity Verification

:::info **Want to verify now?** Open
[web-verifier.agamspace.app](https://web-verifier.agamspace.app) and check your
instance. :::

## Why verify?

Agam Space stays private only if the app you load is the one we shipped. Think
of this as a “trust but verify” step: you can confirm the HTML, JS, and CSS
match the official release before you use the site.

## What this page covers

- How the verifier checks your page against the official manifest
- When to use URL vs. paste modes
- What it can and cannot tell you about HTML

## How it works

- Every release publishes SRI-tagged assets plus an integrity manifest on
  GitHub.
- The Web Verifier (a separate static app at
  [web-verifier.agamspace.app](https://web-verifier.agamspace.app)) uses the
  page you provide—either by URL (if reachable/CORS-allowed) or pasted
  HTML—reads its SRI hashes, downloads the manifest from GitHub, and compares
  them.
- You get a simple result: Authentic ✅ or Modified ❌.

## Using the Web Verifier

Open [web-verifier.agamspace.app](https://web-verifier.agamspace.app) and pick
how you want to check:

- Verify URL: works when the instance allows cross-origin reads
  (`ALLOW_CORS_FOR_INTEGRITY_VERIFICATION=true`) or is publicly reachable
  without VPN/WAF blocking.
- Paste HTML: copy the full page source from the instance and paste it; this
  bypasses CORS entirely. The app then compares the hashes against the official
  manifest and shows the verdict.

## What’s covered

If someone tampers with JS or CSS, SRI will fail and the hash comparison will
show it. If an operator swaps files, the manifest mismatch is caught. Even if an
instance hosts a fake manifest, the verifier trusts the one published with the
release on GitHub.

### HTML caveat

When a WAF/CDN (e.g., Cloudflare) injects its own inline scripts, the HTML hash
will differ. In those cases, the tool can’t prove the HTML is clean—it only
checks the SRI-tagged assets. This is a starting point; we’ll keep improving
verification paths as we add safer ways to validate HTML.

## If you run an instance

Ship unmodified official builds, keep SRI and manifest files intact, and tell
users which version you’re running so they can verify easily.

## If you’re a user

Prefer instances you trust (or self-host). Run the Web Verifier when you try a
new instance. If you see “Modified,” don’t enter sensitive data.

## Coming next

These are possible improvements, not commitments: manifest signing, CLI/browser
extension verifiers, and publishing manifests from multiple sources for
redundancy.
