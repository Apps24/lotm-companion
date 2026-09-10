# Deployment

## Preferred production: Cloudflare Pages
Static export output: `out/`
Build command: `npm ci && npm run build`
Output directory: `out`

## Secondary / preview: Vercel Hobby
The same Next.js project can deploy directly on Vercel.

## Phase policy
1. Push `phase/*` branch.
2. Preview deployment.
3. Run acceptance checks.
4. Merge to `main`.
5. Production deployment.
6. Record URL + commit in `docs/PHASE_LOG.md`.
