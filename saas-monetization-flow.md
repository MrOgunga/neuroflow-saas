# Neuroflow SaaS Monetization Flow

## Product Position

Neuroflow is a calm visual progress tracker for ADHD adults who struggle with traditional task systems. The product should feel low-pressure, beautiful, and easy to return to after rough days.

## Best Monetization Model

Use a freemium SaaS model with a 30-day free trial for the paid tier.

- Free plan:
  - Up to 4 tracker cards
  - Local device saving
  - Installable web app
  - Basic weekly progress view
- Pro plan:
  - Unlimited tracker cards
  - Cloud sync across devices
  - Custom colors and tracker themes
  - Reminder nudges
  - Recovery insights
  - Focus history and streak summaries
  - Export/share progress snapshots

## Recommended Pricing

Start simple:

- Monthly: `$7/month`
- Annual: `$60/year`

This is accessible enough for consumers while still feeling like a real product.

## What We Build In Stages

### Stage 1: Web MVP

- Beautiful tracker UI
- 31-day glowing tiles
- Local storage
- Installable PWA

### Stage 2: Product Foundation

- User accounts with Supabase Auth
- Cloud database for trackers
- Save per user
- Landing page + waitlist

### Stage 3: SaaS Conversion

- Stripe subscription
- 30-day free trial
- Billing portal
- Locked Pro features

### Stage 4: Retention Layer

- Email onboarding
- Gentle reminder system
- Weekly recap
- Recovery prompts

## Suggested SaaS Flow

1. Visitor lands on the website
2. Sees visual tracker demo immediately
3. Clicks `Try free for 30 days`
4. Creates account
5. Starts with 4 default trackers
6. Uses the product for free
7. Hits premium moments:
   - wants more trackers
   - wants sync
   - wants reminders
8. Upgrades to Pro

## Where n8n Can Help Later

n8n is not required for the MVP, but it becomes useful after launch for:

- onboarding email flow
- free-trial reminder emails
- churn prevention nudges
- feedback collection
- support handoff
- weekly motivational summaries

## Desktop/App Direction

The current build can become an installable app as a PWA.

That means:

- users can install it from the browser
- it can open in its own window like an app
- it feels close to a desktop app without extra complexity

A true desktop widget can come later using:

- Electron
- Tauri
- or native widget wrappers

For now, PWA is the smartest path.

## Best Next Product Build

After deployment, the next real product milestones should be:

1. reduce the UI to the pure tracker experience
2. add user auth
3. add cloud sync
4. add trial + billing
5. gather user feedback
