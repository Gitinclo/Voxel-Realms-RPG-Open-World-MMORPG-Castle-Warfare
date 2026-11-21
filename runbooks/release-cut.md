# Runbook: Signed Release Cut & Supply-Chain Governance

**Last Updated:** `20/11/2026`  
**Target Public Launch Date:** `30/03/2030`  
**Policy:** NEVER create or push a `v*` tag automatically until all 24 gates in [`../docs/release-evidence-template.md`](../docs/release-evidence-template.md) are signed off by independent approvers.

---

## 1. Repository Governance Prerequisites

Configure the following GitHub repository controls before cutting a production release:

1. **Branch Protection (`main`):**
   - Require pull requests with `>= 2` approvals and stale review dismissal.
   - Require passing status checks: CI (`validate`, `verify:ops`, `verify:e2e`), Security Audit, and Release Gates.
   - Require signed commits on `main`.
2. **Protected Environments:**
   - `staging`: required reviewers for cluster rollout (`deploy-staging.yml`).
   - `staging-soak`: restricted to release engineers (`staging-soak.yml`).
   - `production-release`: require `>= 2` independent approvers (`release.yml`).
3. **GitHub Actions Pinning Policy:**
   - Before public launch, pin all third-party `uses:` references across `.github/workflows/*.yml` to immutable 40-character commit SHAs with version comments (managed via Dependabot `github-actions` weekly PRs).

---

## 2. Pre-Tag Verification

Run the `.github/workflows/release-gates.yml` workflow against `main` AND verify locally on a clean checkout:

```bash
git checkout main
git pull --ff-only origin main
npm ci
npm run validate
npm run verify:ops
npm run verify:e2e
```

Confirm `package.json` `"version"` matches the target tag (e.g., `1.5.0` for `v1.5.0`) and `CHANGELOG.md` is updated.

---

## 3. Create & Verify a Cryptographically Signed Tag

GitHub Artifact Attestations supplement build provenance, but they **cannot replace** a maintainer-held GPG or SSH signing key.

```bash
git tag -s v1.5.0 -m "Voxel Realms RPG v1.5.0"

# Verify locally before pushing
git rev-parse v1.5.0^{}
git tag -v v1.5.0
git verify-tag v1.5.0
```

Only after `git verify-tag` succeeds and the 24-gate release evidence checklist is approved:

```bash
git push origin v1.5.0
```

---

## 4. Release Workflow Outputs (`.github/workflows/release.yml`)

Pushing the signed tag triggers `release.yml` (gated by the `production-release` environment), which verifies the tag signature, runs validation + ops + E2E + Trivy container scan, and attaches:

- `voxel-realms-rpg-v1.5.0-dist.tar.gz`
- `SHA256SUMS.txt`
- `SBOM.cdx.json` (CycloneDX JSON via Syft)
- `SBOM.spdx.json` (SPDX JSON via Syft)
- `provenance.json` (in-toto / SLSA v1 statement)
- `release-attestation.json`
- GitHub Artifact Attestation (`actions/attest-build-provenance`)

Verify published checksums and attestations after publication:

```bash
sha256sum -c SHA256SUMS.txt
gh attestation verify voxel-realms-rpg-v1.5.0-dist.tar.gz --repo Gitinclo/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare
```
