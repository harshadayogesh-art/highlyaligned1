# HighlyAligned

**Spiritual Wellness, E-Commerce & Booking Platform**

Built for Harshada Yogesh — Vedic Astrologer, Healer & Spiritual Guide.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS 4 + shadcn/ui (radix-nova)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **State**: Zustand (cart), React Query (server state)
- **Payments**: Razorpay (India)
- **AI**: OpenAI GPT-4o-mini
- **Notifications**: Gupshup (WhatsApp), MSG91 (SMS), Resend (Email)
- **Charts**: Recharts
- **PWA**: next-pwa

---

## Features

### Customer Storefront
- Product catalog with filters, sorting, and search
- Product detail with image gallery and related products
- Cart with mini-drawer and localStorage persistence
- Checkout with shipping form, GST calculation, coupon support
- Razorpay online payments + Cash on Delivery
- Service booking wizard (5-step: service → date → mode → intake → payment)
- Lead Magnet 2.0: free astrology Q&A with AI-generated answers
- My Account: orders, bookings, remedies, referral code
- Blog with categories, tags, and related posts
- PWA with offline support and add-to-home-screen

### Admin Dashboard
- Orders: Kanban pipeline + table view, shipping, COD collection
- Products: CRUD with image upload to Supabase Storage
- Services: configurable durations, prices, modes
- Bookings: calendar view (month/week/day), session management
- Leads: inbox with status pipeline, area manager, AI prompt editor
- Remedies: prescribe from booking detail, customer tracks progress
- Referrals: code generation, commission tracking, payouts
- Coupons: percentage/fixed/free-shipping with validation rules
- CMS: banners, pages, footer editor
- Blog: CRUD with scheduled publish, SEO meta
- Reports: revenue, products, bookings, leads charts
- Settings: GST toggle, business info, AI config

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# AI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Notifications
GUPSHUP_API_KEY=
GUPSHUP_APP_NAME=
WHATSAPP_BUSINESS_NUMBER=
MSG91_AUTH_KEY=
MSG91_TEMPLATE_ID=
MSG91_SENDER_ID=HGHLYA
RESEND_API_KEY=
FROM_EMAIL=Harshada <harshada@highlyaligned.in>

# App
NEXT_PUBLIC_SITE_URL=https://highlyaligned.in
CRON_SECRET=your-random-secret-here
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

---

## Database Setup

1. Create a Supabase project
2. Run `supabase-schema.sql` in the SQL Editor
3. Create Storage buckets: `products`, `shipping-labels`, `remedies`, `blog`
4. Set bucket policies (public read, authenticated write)

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step launch instructions.

---

## License

Private — for Harshada Yogesh only.
