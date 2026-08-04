# Deploying

## Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Leave the defaults — `vercel.json` sets `npm install` / `npm run build`.
3. Deploy.

Vercel sets `VERCEL=1` during the build, which switches the Nitro build target
to the `vercel` preset (see `vite.config.ts`). The build emits Vercel's
`.vercel/output` bundle, which Vercel picks up automatically. No environment
variables, database, or external services are required.

## Anywhere else

Force a target with `NITRO_PRESET`:

```bash
NITRO_PRESET=node-server npm run build   # plain Node server
NITRO_PRESET=static npm run build        # prerendered static output
```

With no preset set, the build defaults to Cloudflare Workers.

## Local development

```bash
npm install
npm run dev     # http://localhost:8080
npm run build   # production build
```

## Notes

- All gameplay (puzzle generation, validation, hints, timer, notes, streak,
  saved games) runs entirely in the browser via `localStorage`. There is no
  backend, no API, and no telemetry outside the Lovable editor.
