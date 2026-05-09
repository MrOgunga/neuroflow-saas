# Neuroflow Supabase Setup

This is the next real step that turns Neuroflow from a local-only tracker into an app.

## 1. Create a Supabase Project

- Go to Supabase
- Create a new project for `Neuroflow`

## 2. Run the Database Schema

Open the SQL editor in Supabase and paste:

- [supabase-data-model.sql](/Users/mac/ProjectTee/🙂%20neuroflow-saas/supabase-data-model.sql)

Run it once.

If you already ran an older version of the schema, run the latest file again so the `daily_anchors`
table, the tracker `view_mode` column, and the 365-day `tracker_entries` constraint are added.

## 3. Turn On Email Auth

Inside Supabase Auth:

- enable Email provider
- keep magic link / OTP enabled

## 4. Add Redirect URL

In Supabase Auth URL settings, add:

- your local preview URL
- your Vercel production URL

Example:

- `http://127.0.0.1:4173`
- `https://neuroflow-saas.vercel.app`

## 5. Add Your Public Keys

Open:

- [supabase-config.js](/Users/mac/ProjectTee/🙂%20neuroflow-saas/supabase-config.js)

Replace:

- `url`
- `anonKey`

with your actual project values from Supabase.

## 6. Test the Flow

After adding the keys:

1. enter your email
2. click `Send Magic Link`
3. open the email
4. return to the app
5. confirm the auth strip says you are signed in

## 7. What Works After That

- guest mode still works
- local progress still works
- signed-in users can sync tracker boards, view modes, and the daily anchor

## Important Note

This project is now prepared for Supabase, but it will stay in guest mode until real keys are added.
