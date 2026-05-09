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
- homepage preview: single 365-day glowing year card that showcases customization
- current default cards:
  - `Deep Focus`
  - `Move My Body`
  - `Brain Dump`

## What Has Been Added

- installable PWA behavior
- local storage guest mode
- app-phase auth strip
- Supabase-ready sync scaffold
- real Supabase magic-link trigger
- signed-in session detection
- first cloud sync path for tracker tiles
- cloud-backed daily anchor sync for signed-in users
- clearer signed-in / signed-out UI states
- simplified hero with a single 365-day year-view customization preview
- SaaS monetization roadmap

## Updated Product Description

Neuroflow is a gentle ADHD support app that helps people restart, track small wins, and stay grounded without the pressure of a traditional productivity tool.

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

Stabilize and ship the first app-phase version:

1. verify magic-link sign-in works fully
2. verify tracker sync writes and reads correctly
3. confirm the hosted auth flow works as expected
4. confirm the hosted Vercel build updates correctly
5. confirm the latest schema is applied so `daily_anchors` exists in Supabase
6. then continue with onboarding, settings, and cleaner tile management
7. keep the homepage explaining the product visually with the year-view preview

## Notes

- guest mode still works without Supabase
- Supabase keys are now present in `supabase-config.js`
- the auth email still uses Supabase default branding for now
- the app is currently a web app / PWA, not a native mobile app yet
- the new working checklist lives in `BUILD-CHECKLIST.md`
- the latest polished app-phase build has been pushed to GitHub and deployed to Vercel
