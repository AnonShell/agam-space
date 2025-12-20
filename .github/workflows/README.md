# CI/CD Workflows

## What Happens When

| Action                   | CI Check | Docker Build Test   | Docker Publish     | GitHub Release |
| ------------------------ | -------- | ------------------- | ------------------ | -------------- |
| Create PR                | ✅ Yes   | ✅ Yes (not pushed) | ❌ No              | ❌ No          |
| Push to `main`           | ✅ Yes   | ✅ Yes (not pushed) | ✅ Yes (`dev`)     | ❌ No          |
| Push tag `v0.1.0-beta.2` | ❌ No    | ❌ No               | ✅ Yes (versioned) | ✅ Yes         |

## How It Protects Main Branch

1. **PR created** → CI runs + Docker build test
   - If Docker build fails → ❌ PR shows failed, can't merge
   - If Docker build passes → ✅ PR can be merged

2. **PR merged to main** → Docker image built and pushed as `dev`

3. **Tag pushed** → Docker image built and pushed as version + `latest`

**Result:** Broken Docker builds can never reach main! 🎯

## Workflows

### 1. CI (`ci.yml`)

- Runs on: PR + push to main
- Does: Lint, format check, test, **build** (includes type checking), **Docker
  build test**
- Time: ~5-7 min
- Jobs run sequentially (fail-fast):
  1. Lint & Format
  2. Test
  3. Build - validates TypeScript types
  4. Docker Build Test

### 2. Docker Publish (`docker-publish.yml`)

- Runs on: Push to main + push tag
- Does: Build multi-arch Docker image, **push to Docker Hub**, **scan for
  vulnerabilities**
- Time: ~10-15 min
- **Actually publishes** the Docker image
- **Scans with Trivy** for security vulnerabilities
- **Uploads results** to GitHub Security tab

### 3. Release (`release.yml`)

- Runs on: Push tag only
- Does: Create GitHub Release with changelog
- Time: ~1 min

### 4. CodeQL Security Scan (`codeql.yml`)

- Runs on: PR + push to main + weekly schedule
- Does: Scans TypeScript/JavaScript code for security vulnerabilities
- Time: ~3-5 min
- **Uploads results** to GitHub Security tab

### 5. Dependabot (`dependabot.yml`)

- Runs: Automatically weekly
- Does: Creates PRs to update dependencies
- Updates: npm packages, GitHub Actions, Docker base images
- Groups: Minor/patch updates together

## Setup (One-Time)

1. Create Docker Hub account + repository
2. Get Docker Hub access token
3. Add GitHub secrets:
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`

## Releasing

```bash
git tag v0.1.0-beta.2
git push origin v0.1.0-beta.2
```

Done! Docker image + GitHub Release created automatically.

## Version Management

**Git tag = Version** (source of truth)

- Tag `v0.1.0-beta.2` → Docker image `0.1.0-beta.2`
- package.json version is optional (update if you want)

## Security Features

### Automated Security Scanning

- ✅ **CodeQL** - Scans code for vulnerabilities on every PR/push
- ✅ **Trivy** - Scans Docker images for CVEs after every build
- ✅ **Dependabot** - Auto-updates dependencies weekly
- ✅ Results visible in: Repository → Security tab

### What Gets Scanned

- TypeScript/JavaScript source code
- npm dependencies
- Docker base images
- Docker image layers

### Security Reports

All security findings are uploaded to GitHub Security tab:

- Code scanning alerts
- Dependabot alerts
- Container scanning results

## Additional Files

- `SECURITY.md` - Security policy and vulnerability reporting
- `.github/SETUP-CHECKLIST.md` - Complete setup guide
- `.github/dependabot.yml` - Dependency update configuration
