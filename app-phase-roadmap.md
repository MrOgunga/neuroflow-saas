# Neuroflow App Phase Roadmap

## Where We Are Now

Neuroflow is live as a web MVP with:

- dark glowing tracker interface
- installable PWA behavior
- local device saving
- editable tracker cards

This is enough to test interest and collect reactions.

## What "App Phase" Means

The next version should stop being only a local visual demo and become a real user product.

That means:

- users can create accounts
- progress saves to the cloud
- the same account works across devices
- premium features can be locked behind a free trial

## Best Build Order

### Phase 1: App Foundation

- Add Supabase project
- Add email auth
- Create `profiles`, `trackers`, and `tracker_entries` tables
- Save user progress per account

### Phase 2: Real Product Behavior

- Replace local-only storage with database-backed sync
- Let users create, edit, archive, and reorder trackers
- Allow custom names, colors, and emojis
- Preserve local mode for guests if needed

### Phase 3: SaaS Layer

- Add Stripe
- Add 30-day free trial
- Limit free users to a small number of trackers
- Unlock unlimited trackers, themes, sync history, and reminders for Pro

### Phase 4: Retention Layer

- Add n8n onboarding flow
- Add reminder emails or gentle nudges
- Add weekly summary flow
- Add abandoned trial recovery flow

## Product Versioning

### Current Version

`v0.1`

- installable web MVP
- no account
- no sync
- no billing

### Next Version

`v0.2`

- auth
- cloud sync
- app shell thinking
- better onboarding

### First Paid Version

`v1.0`

- trial
- paid plan
- account dashboard
- reliable cross-device experience

## App Store / Desktop Direction

Right now, the smartest path is:

1. keep improving the installable web app
2. validate interest
3. convert into a stronger app shell
4. only later consider full desktop or mobile packaging

That avoids unnecessary complexity too early.

## What We Need Next

- Supabase account/project
- product auth decisions
- first pricing gate
- sign-in screen
- settings/profile flow
- feedback loop from early users

## Recommended Immediate Step

Start with `Supabase auth + cloud sync` before anything else.

That is the real beginning of the app phase.
