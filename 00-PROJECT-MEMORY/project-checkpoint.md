# Neuroflow Project Checkpoint

## Current State

Neuroflow is live as a web MVP and has now entered the first app phase.

Live URL:

- `https://neuroflow-saas.vercel.app/`

GitHub Repo:

- `https://github.com/MrOgunga/neuroflow-saas`

## Current Product Direction

- audience: general ADHD adults
- style: dark, glowing, glassy tracker interface
- core interaction: visual 31-day tracker cards
- current default cards:
  - `Deep Focus`
  - `Move My Body`
  - `Brain Dump`

## What Has Been Added

- installable PWA behavior
- local storage guest mode
- app-phase auth strip
- Supabase-ready sync scaffold
- SaaS monetization roadmap

## Important Files

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `saas-monetization-flow.md`
- `app-phase-roadmap.md`
- `supabase-data-model.sql`
- `supabase-config.js`
- `supabase-setup.md`

## Next Required Step

Set up Supabase:

1. create project
2. run SQL schema
3. enable email magic-link auth
4. add redirect URLs
5. paste project URL + anon key into `supabase-config.js`

## Notes

- guest mode still works without Supabase
- cloud sync will not work until real Supabase keys are added
- the app is currently a web app / PWA, not a native mobile app yet
