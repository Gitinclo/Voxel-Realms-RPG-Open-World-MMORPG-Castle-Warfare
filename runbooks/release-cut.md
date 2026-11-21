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

## 3. Package Release Artifacts Locally (`< 2 GB` Limit & Naming Convention)

All game release artifacts MUST be compiled in **Release** mode and follow `<GameName>-v<SemVer>-<Platform>.<ext>` (`VoxelRealmsRPG-v1.5.0-WebGL.zip`, `VoxelRealmsRPG-v1.5.0-Linux.tar.gz`, etc.), with every individual asset strictly under `2 GB`:

```bash
npm run release:package
```

This creates:

- `release-assets/VoxelRealmsRPG-v1.5.0-WebGL.zip` (`index.html` + all compiled WebGL assets at archive root for offline local play)
- `release-assets/RELEASE_NOTES_PLAYER.md` (player-facing changelog omitting raw git hashes and internal refactors)
- `release-assets/SHA256SUMS.txt`

---

## 4. Create & Verify a Cryptographically Signed Tag

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

Alternatively, for manual GitHub CLI publication of a prerelease playtest build (include `--prerelease` ONLY for alpha/beta/rc playtests):

```bash
gh release create v1.5.0-beta.1 \
  ./release-assets/VoxelRealmsRPG-v1.5.0-beta.1-WebGL.zip \
  ./release-assets/SHA256SUMS.txt \
  --title "v1.5.0-beta.1" \
  --notes-file ./release-assets/RELEASE_NOTES_PLAYER.md \
  --prerelease
```

---

## 5. Automated Release & Browser Play Outputs (`.github/workflows/release.yml` & `pages-webgl.yml`)

Pushing a signed `v*` tag triggers `release.yml` (gated by the `production-release` environment), which verifies the tag signature, runs validation + ops + E2E + Trivy container scan, enforces `< 2 GB` per artifact, and publishes via `softprops/action-gh-release@v2`:

- `VoxelRealmsRPG-v1.5.0-WebGL.zip` (Offline WebGL Release package with `index.html` at root)
- `VoxelRealmsRPG-v1.5.0-Linux.tar.gz` (Self-hosted full-stack Linux/Node 22+ server bundle)
- `SHA256SUMS.txt`
- `SBOM.cdx.json` (CycloneDX JSON via Syft)
- `SBOM.spdx.json` (SPDX JSON via Syft)
- `provenance.json` (in-toto / SLSA v1 statement)
- `release-attestation.json`
- GitHub Artifact Attestation (`actions/attest-build-provenance`)

Publishing the release (or pushing to `main`) also triggers `.github/workflows/pages-webgl.yml` to deploy the browser-playable WebGL build directly to GitHub Pages.

Verify published checksums and attestations after publication:

```bash
sha256sum -c SHA256SUMS.txt
gh attestation verify VoxelRealmsRPG-v1.5.0-WebGL.zip --repo Gitinclo/Voxel-Realms-RPG-Open-World-MMORPG-Castle-Warfare
```
