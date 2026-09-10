# Deployment

## Cloudflare Pages

Cloudflare Pages is the only deployment target for this project.

Production deployments run from `.github/workflows/deploy-cloudflare-pages.yml` on every push to `main`.

### Required GitHub repository secrets

Add these under **Settings → Secrets and variables → Actions → New repository secret**:

- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` — API token scoped to the target account with **Cloudflare Pages: Edit** / Pages Write permission

The token must never be committed to this repository.

### Deployment target

- Pages project: `lotm-companion`
- Production branch: `main`
- Production URL: `https://lotm-companion.pages.dev`
- Build command: `npm run build`
- Static output directory: `out`

### Workflow

1. Checkout `main`
2. Install Node 22
3. Install dependencies
4. Run `next build`
5. Verify `out/index.html`
6. Ensure the `lotm-companion` Pages project exists
7. Run `wrangler pages deploy out --project-name=lotm-companion --branch=main`

### Status

Phase 1 production deployment completed successfully on Cloudflare Pages. Future phase merges to `main` deploy automatically.
