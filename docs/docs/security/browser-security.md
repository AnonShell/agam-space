# Browser Security

Web-based E2EE applications face unique challenges. Since the code is delivered
over the network on every page load, protecting against code injection and
tampering is critical.

Agam Space implements multiple layers of defense to protect your encryption keys
in the browser.

## Content Security Policy (CSP)

CSP is a security standard that controls which resources the browser can load
and execute. It acts as a firewall for your browser session.

[Learn more about CSP on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

**What CSP does:**

- Restricts which external sources can load scripts, styles, and other resources
- Controls where network requests can be sent
- Blocks unauthorized external scripts
- Limits what loaded code can do

**Our CSP configuration:**

- Scripts must come from same origin or approved CDNs (Monaco Editor for code
  preview)
- Inline scripts are permitted (required for Next.js static builds)
- Network requests limited to same origin and approved CDNs
- WebAssembly allowed (for encryption operations)
- Frames and plugins blocked
- Form submissions restricted to same origin

CSP significantly reduces the attack surface by controlling resource loading and
network communication. External scripts from unauthorized sources are blocked,
and the browser enforces strict rules about where data can be sent.

## Subresource Integrity (SRI)

SRI ensures that files delivered from CDNs or servers haven't been tampered with
during transit or at the source.

[Learn more about SRI on MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)

**How it works:**

Every JavaScript and CSS file is given a cryptographic hash at build time. The
browser verifies the hash before executing the code.

```html
<!-- Example with SRI hash: -->
<script
  src="/_next/static/chunks/main.js"
  integrity="sha384-zNm4dqORnfttcryhAF0z9ARdXx38BqIXMS7os7RGMs8muiMsc6F6vnbHyDCALreF"
  crossorigin="anonymous"
></script>
```

If the file is modified (by an attacker or a compromised CDN), the hash won't
match and the browser refuses to execute it.

**What SRI protects against:**

- Compromised CDN serving malicious code
- Man-in-the-middle attacks modifying JavaScript
- Accidental or malicious file modifications on the server

**Coverage:**

All static assets in Agam Space include SRI hashes - every script, stylesheet,
and font file is protected.

## What These Don't Protect Against

**Malicious server operator:** If the server operator wants to steal your keys,
they can serve completely different code with valid hashes. CSP and SRI make
opportunistic attacks harder, but a determined malicious operator can work
around them.

**Zero-day browser vulnerabilities:** If your browser has a security flaw, these
protections might not help.

**Compromised device:** If your computer has malware, it can steal keys directly
from memory.

## What This Means for You

CSP and SRI provide defense in depth:

- **Unauthorized external resources** - Blocked by CSP
- **Network communication** - Restricted by CSP
- **File tampering** - Detected by SRI
- **CDN compromise** - Caught by SRI hash verification

These measures work together with HTTPS and the open-source codebase to create
multiple security layers.

**Understanding the limits:**

No browser-based security measure is perfect. CSP and SRI make attacks
significantly harder but don't eliminate all risks. They're part of a broader
security strategy that includes secure coding practices, regular updates, and
the fundamental design principle of client-side encryption.

## Technical Details

If you want to inspect the security headers yourself:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Click on the main document request
5. Check Response Headers for `Content-Security-Policy`

You'll see the exact policy being enforced.

Similarly, you can inspect any script or stylesheet tag in the HTML to verify
the `integrity` attribute is present with a SHA-384 hash.
