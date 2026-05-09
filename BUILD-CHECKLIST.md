# Neuroflow Build Checklist

## Product Description

Neuroflow is a gentle ADHD support app that helps people restart, track small wins, and stay grounded without the pressure of a traditional productivity tool.

## Current Build Status

### Done

- [x] web MVP exists
- [x] core tracker interface is live
- [x] installable PWA behavior is in place
- [x] local guest mode works
- [x] daily anchor input works
- [x] default focus tiles work
- [x] visual completion tracking works
- [x] recovery messaging is in place
- [x] Supabase project keys are connected
- [x] magic-link auth trigger is wired
- [x] signed-in session handling is wired
- [x] first cloud sync path for tracker tiles is wired
- [x] simplified hero preview now shows a 365-day year-view customization card
- [x] real tracker cards now support 365-day boards with year and focus views
- [x] date cells now open a hidden short note pad with checkbox support

### In Progress

- [ ] verify full magic-link sign-in flow on local and hosted app
- [ ] verify cloud sync reads and writes correctly from Supabase tables
- [ ] confirm redirect URLs are correct in Supabase auth settings
- [x] push latest app-phase changes to GitHub
- [x] deploy latest app-phase changes to Vercel

### Next Build Priorities

- [x] add proper signed-in and signed-out states in the UI
- [x] let users create custom tile names, icons, and colors more cleanly
- [ ] add archive and reorder for tiles
- [ ] decide what stays guest-only and what becomes account-only
- [x] store daily anchor in cloud for signed-in users
- [ ] add basic onboarding for first-time users
- [ ] add lightweight settings/profile screen

### Product Foundations Still Ahead

- [ ] custom Supabase auth email branding
- [ ] better app copy across the full experience
- [ ] clearer empty states and first-use guidance
- [ ] trial / free-plan limits
- [ ] Stripe billing
- [ ] reminders / nudges
- [ ] weekly recap flow
- [ ] feedback capture

## Recommended Build Order

### Phase 1: Stabilize The App Core

- [ ] confirm auth works
- [ ] confirm sync works
- [x] push to GitHub
- [x] verify hosted build

### Phase 2: Make It Feel Like A Real Product

- [ ] onboarding
- [ ] settings
- [ ] cleaner tile management
- [x] cloud-backed daily anchor

### Phase 3: Add Useful Daily-Life Support

- [ ] reminders
- [ ] weekly summaries
- [ ] recovery prompts
- [ ] simple reflections

### Phase 4: Add SaaS Layer

- [ ] free plan limits
- [ ] Pro plan rules
- [ ] Stripe checkout
- [ ] trial logic

## Current Focus

Right now, the most important immediate move is:

1. test auth and sync in the live app
2. confirm the mobile experience feels right
3. re-run the latest Supabase schema so signed-in users get the 365-day board upgrade
4. then improve the signed-in product experience
5. then start monetization and publicity setup
