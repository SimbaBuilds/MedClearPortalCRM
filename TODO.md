# GFE Acquisition — TODO

## Before First Outreach
- [ ] **Set up Resend sending domain** — Register a separate domain (e.g. `gfeclearance-outreach.com`) to protect primary domain deliverability. Add DNS records in Resend dashboard.
- [ ] **Warm up sending domain** — 2 weeks minimum. Start with 2-3 emails/day to known contacts, gradually increase.
- [ ] **Replace Resend API key** — Update `RESEND_API_KEY` in both `.env.local` and Vercel env vars with your real key.
- [ ] **Configure "from" address** — Update the outreach API route to use your sending domain (e.g. `cameron@gfeclearance-outreach.com`).
- [ ] **Add unsubscribe link** — Add an unsubscribe footer to email templates. Update sequence step templates in the DB.
- [ ] **Replace Calendly placeholder links** — The email templates reference `[booking link]` — replace with your actual Calendly URL.

## Resend Integration
- [ ] **Wire up actual Resend sending** — The `/api/outreach` route currently logs emails but doesn't send them via Resend. Uncomment/implement the Resend `send()` call once API key is live.
- [ ] **Add Resend webhook handler** — Track delivery, opens, clicks, and bounces. Create `/api/webhooks/resend` endpoint.
- [ ] **Add scheduled email processor** — Build a cron job or Vercel cron that checks `outreach_log` for `status = 'scheduled'` entries where `scheduled_for <= now()` and sends them via Resend.

## Email Templates
- [ ] **Personalize first lines** — The seeded templates have generic openings. Before enrolling each lead, customize the first line per prospect (their name, their medspa, specific pain point).
- [ ] **Review/edit email copy** — Templates are in `email_sequences` / `sequence_steps` tables. Edit via Supabase dashboard or add an edit UI.

## Data Enrichment
- [ ] **Add email addresses** — Most leads don't have email yet. Research and add via the lead detail panel.
- [ ] **Add LinkedIn URLs** — Find each physician's LinkedIn profile and add via lead detail panel.

## Supabase
- [ ] **Enable Row Level Security (RLS)** — Currently disabled since there's no auth. Add RLS policies before sharing the app with anyone else.
- [ ] **Add auth** — If you need to share with others, add Supabase Auth + RLS.

## Nice-to-Haves
- [ ] **Bulk actions** — Select multiple leads and enroll in sequence, change status, etc.
- [ ] **CSV export** — Export filtered leads to CSV.
- [ ] **Email preview with template interpolation** — Show the actual personalized email before sending (replace `{{physician}}`, `{{medspa}}`, etc.).
- [ ] **Sequence step editor** — Edit email templates from the UI instead of directly in DB.
- [ ] **LinkedIn DM tracking** — Manual log of LinkedIn messages sent (already supported via "Log a Note").
