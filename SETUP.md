# FundHub Event Ratings — Setup Guide
<!-- Updated: May 2026 -->

## What you need before deploying

1. A **Supabase** account (free) → supabase.com
2. A **Vercel** account (free) → vercel.com
3. A **GitHub** account (free) — to connect to Vercel
4. A **Twilio** account → twilio.com (paid per message)
5. WhatsApp Business API approved on Twilio

---

## Step 1 — Set up Supabase

1. Create a new project at supabase.com
2. Go to **SQL Editor** and paste the entire contents of `supabase/schema.sql`
3. Click **Run** — this creates all tables, indexes, and views
4. Go to **Settings → API** and copy:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` secret key (`SUPABASE_SERVICE_ROLE_KEY`) — keep this private

---

## Step 2 — Set up Twilio WhatsApp

1. Sign up at twilio.com
2. In the Twilio console, go to **Messaging → Try it out → Send a WhatsApp message**
3. Apply for a WhatsApp-enabled number via **Messaging → Senders → WhatsApp senders**
4. Connect your Facebook Business Manager (required by Meta)
5. Once approved, copy:
   - Account SID (`TWILIO_ACCOUNT_SID`)
   - Auth Token (`TWILIO_AUTH_TOKEN`)
   - Your WhatsApp sender number → format as `whatsapp:+27XXXXXXXXX` (`TWILIO_WHATSAPP_FROM`)

> ⚠️ WhatsApp Business API approval takes 3–7 days. Start this now.

---

## Step 3 — Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to vercel.com → **New Project** → import your GitHub repo
3. Add all environment variables (from `.env.example`) in Vercel's project settings
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g. `https://fundhub-ratings.vercel.app`)
5. Click **Deploy**

Vercel will automatically run the notification cron every minute (configured in `vercel.json`).

---

## Step 4 — First Event Setup

1. Open `https://your-app.vercel.app/admin`
2. Enter your admin password
3. Click **New Event** → fill in event details
4. Go to **Import Data** → upload the session agenda spreadsheet (map columns)
5. Upload the delegate export from Gel (map columns — barcode, name, phone, sessions)
6. On event day, open `/scan` on a tablet at the registration desk

---

## Day-of-event flow

```
Delegate arrives at desk
  → Staff scan badge barcode on /scan page
  → System looks up delegate in database
  → Sends WhatsApp welcome message with their unique rating link
  → Delegate saves the link

5 minutes before each new session starts:
  → Cron fires → system checks if any session just ended
  → Sends WhatsApp to all checked-in delegates for that session
  → "Rate your session with [Speaker]" + direct link

Delegate taps link → rates session → done
```

---

## Costs (approximate per event)

| Item | Cost |
|------|------|
| Vercel hosting | Free |
| Supabase database | Free (500MB) |
| Twilio WhatsApp messages | ~R0.80–R1.20 per conversation |
| 1000 delegates × 1 conversation/day | ~R800–R1,200 per event |

WhatsApp charges per 24-hour conversation window, not per message, so all messages to a delegate in one day = 1 conversation.

---

## Need help?

Contact the development team or refer to:
- Supabase docs: docs.supabase.com
- Vercel docs: vercel.com/docs
- Twilio WhatsApp: twilio.com/docs/whatsapp
