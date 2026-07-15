# Velara

AI-powered customer feedback analysis and improvement-plan generation for
e-commerce product managers, with GitHub and Vercel integrations and
Stripe-powered monthly subscriptions.

## Live subscription plans (Stripe, live mode)
- Starter — $49/mo
- Growth — $149/mo
- Scale — $399/mo

## Setup
1. Copy `.env.example` to `.env` and fill in every value (see comments per key).
2. `npm install`
3. `npx prisma migrate deploy` (once `DATABASE_URL` points at a real Postgres instance)
4. `npm run dev`

## Deploy (Vercel)
1. Import this repo into a new Vercel project.
2. Storage tab → Add → Postgres (auto-fills `DATABASE_URL`).
3. Add the remaining env vars from `.env.example` in Project Settings → Environment Variables.
4. Deploy. Then in Stripe Dashboard → Developers → Webhooks, add an endpoint at
   `https://<your-domain>/api/stripe/webhook` for events `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`, and copy the
   signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Register a GitHub OAuth App and a Vercel Integration (see `.env.example` comments)
   so your customers can connect their own repos/projects from the Integrations page.

## Core flow
1. A PM signs up, creates an org.
2. Feedback comes in via the dashboard (or, in the future, an ingestion API key).
3. "Run AI analysis" classifies sentiment/theme per item and generates or updates
   prioritized improvement plans per theme (`/api/analyze`, powered by OpenAI).
4. Plans can sync to GitHub issues once GitHub is connected (extend
   `/api/integrations/github/callback` flow with an issue-creation action).
