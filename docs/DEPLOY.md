# Deployment

## Cloudflare Pages (primary)

Production deployments run from `.github/workflows/deploy-cloudflare-pages.yml` on every push to `main`.

### Required GitHub repository secrets

Add these under **Settings → Secrets and variables → Actions → New repository secret**:

- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` — API token scoped to the target account with **Cloudflare Pages: Edit** / Pages Write permission

The token must never be committed to this repository.

### Deployment target

- Pages project: `lotm-companion`
- Production branch: `main`
- Build command: `npm run build`
- Static output directory: `out`

### Workflow

1. Checkout `main`
2. Install Node 22
3. Install dependencies
4. Run `next build`
5. Verify `out/index.html`
6. Run `wrangler pages deploy out --project-name=lotm-companion --branch=main`

### First deployment status

Phase 1 build passed successfully. The first Cloudflare deployment attempt reached Wrangler and stopped because `CLOUDFLARE_API_TOKEN` was not yet configured in GitHub Actions secrets.

Once both secrets are added, rerun the **Deploy Cloudflare Pages** workflow or push to `main`.

## Vercel (secondary)

The repository remains compatible with Vercel. Cloudflare Pages is the primary production target for this project.
