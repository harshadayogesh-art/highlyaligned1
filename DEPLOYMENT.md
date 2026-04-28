# HighlyAligned — Deployment Guide

## Step 1: Prerequisites

- [ ] Vercel account (pro plan recommended for cron jobs)
- [ ] Supabase project
- [ ] Razorpay account (Live mode)
- [ ] OpenAI API key
- [ ] Gupshup account + WhatsApp Business API approval
- [ ] MSG91 account + DLT-registered templates
- [ ] Resend account + domain verification
- [ ] Domain: highlyaligned.in (or your domain)

## Step 2: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In SQL Editor, run the entire `supabase-schema.sql` file
3. Go to Storage → Create buckets:
   - `products` (public)
   - `shipping-labels` (private)
   - `remedies` (private)
   - `blog` (public)
4. Set bucket policies:
   - Public read for `products` and `blog`
   - Authenticated write for all
5. Copy Project URL and Anon Key to `.env.local`

## Step 3: Local Development

```bash
git clone <repo-url>
cd highlyaligned
npm install
```

Create `.env.local` with all variables from README.md.

```bash
npm run dev
# Open http://localhost:3000
```

Test these flows:
1. Sign up → verify profile created
2. Add product → upload image → publish
3. Place test order with Razorpay test card: `5267 3181 8797 5449`
4. Book a service → verify slot blocking
5. Lead magnet popup → fill form → get AI answer

## Step 4: Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel Dashboard → Settings → Environment Variables
4. Add `vercel.json` at root:

```json
{
  "crons": [
    { "path": "/api/cron/booking-reminders", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/remedy-reminders", "schedule": "0 9 * * *" },
    { "path": "/api/cron/cod-followup", "schedule": "0 10 * * *" }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

5. Deploy

## Step 5: Domain Setup

1. In Vercel Dashboard → Domains → Add `highlyaligned.in`
2. Update DNS records at your registrar to point to Vercel
3. Update `NEXT_PUBLIC_SITE_URL` to `https://highlyaligned.in`
4. Redeploy

## Step 6: Razorpay Live Mode

1. Switch Razorpay account to Live mode
2. Generate Live API keys
3. Update environment variables with live keys
4. Add webhook URL: `https://highlyaligned.in/api/razorpay/webhook`
5. Set webhook secret in env vars

## Step 7: Notification Providers

### WhatsApp (Gupshup)
1. Create app at [gupshup.io](https://gupshup.io)
2. Get API key and app name
3. Create templates (must be pre-approved by Meta):
   - `order_update`
   - `booking_confirmed`
   - `booking_reminder`
   - `lead_report`
   - `remedy_reminder`
4. Update env vars

### SMS (MSG91)
1. Create account at [msg91.com](https://msg91.com)
2. Get auth key
3. Register DLT templates
4. Update env vars

### Email (Resend)
1. Create account at [resend.com](https://resend.com)
2. Verify domain `highlyaligned.in`
3. Get API key
4. Update env vars

## Step 8: SEO Verification

1. Submit sitemap to Google Search Console:
   `https://highlyaligned.in/sitemap.xml`
2. Add Google Analytics 4 tracking code to layout (optional)
3. Test robots.txt: `https://highlyaligned.in/robots.txt`

## Step 9: PWA Testing

1. Open site on Android Chrome
2. Tap "Add to Home Screen" in menu
3. Verify app installs with icon and splash screen
4. Test offline: turn off WiFi, reload page

## Step 10: Launch Checklist

- [ ] All env vars set in Vercel
- [ ] Database schema applied
- [ ] Storage buckets created
- [ ] Razorpay webhooks configured
- [ ] WhatsApp templates approved
- [ ] SMS templates DLT-registered
- [ ] Email domain verified
- [ ] Cron jobs configured
- [ ] Domain DNS propagated
- [ ] Sitemap submitted to Google
- [ ] PWA installable on mobile
- [ ] Test order placed successfully
- [ ] Test booking confirmed
- [ ] Test lead magnet generates answer
- [ ] No console errors in production

## Post-Launch

- Monitor Vercel Analytics for errors
- Check Supabase logs for slow queries
- Review Razorpay dashboard for failed payments
- Respond to lead magnet submissions within 24h

## Support

For technical issues, contact the development team.
For business questions, contact Harshada Yogesh.
