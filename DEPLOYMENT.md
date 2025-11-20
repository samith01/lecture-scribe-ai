# NoteSync AI - Landing Page Deployment Guide

## What's Been Built

A conversion-focused landing page for NoteSync AI with:

- **Landing Page** (`/`) - Hero section, value proposition, demo video placeholder, pricing
- **Checkout Page** (`/checkout`) - Payment form (Stripe integration ready)
- **Success Page** (`/success`) - Post-purchase onboarding
- **App Page** (`/app`) - Original note-taking app
- **Database** - Beta signups table with Supabase

## Pages Overview

### Landing Page (`src/pages/Landing.tsx`)
- Hero headline: "Stop Missing Details: AI Takes Notes While You Listen"
- Email capture + $5 beta access CTA
- Demo video placeholder (ready for real video)
- 3 value propositions: Focus on Learning, Real-Time Structure, Export & Review
- Urgency messaging (47 spots remaining)
- 30-day money-back guarantee
- Footer with contact/social links

### Checkout Page (`src/pages/Checkout.tsx`)
- Email confirmation
- Stripe payment integration placeholder
- Order summary with beta benefits
- Secure payment messaging

### Success Page (`src/pages/Success.tsx`)
- Confirmation message
- Next steps (check email, join Discord, start using app)
- Links to Discord community
- 30-day guarantee reminder

## Database Schema

Table: `beta_signups`
- `id` (uuid, primary key)
- `email` (text, unique)
- `payment_status` ('pending' | 'completed' | 'refunded')
- `stripe_payment_intent_id` (text, nullable)
- `stripe_customer_id` (text, nullable)
- `amount_paid` (integer, default 500 = $5)
- `created_at`, `access_granted_at`, `refunded_at` (timestamps)

## Stripe Integration (To Complete)

The landing page is ready for Stripe. To activate payments:

### 1. Get Stripe Keys
```bash
# Visit https://dashboard.stripe.com/apikeys
# Copy your Publishable Key and Secret Key
```

### 2. Add to .env
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Install Stripe
```bash
npm install @stripe/stripe-js
```

### 4. Update Checkout.tsx

Replace the placeholder `handlePayment` function with real Stripe integration:

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const handlePayment = async () => {
  // Create Stripe checkout session via your backend
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, priceId: 'price_beta_access' })
  });

  const { sessionId } = await response.json();
  const stripe = await stripePromise;
  await stripe.redirectToCheckout({ sessionId });
};
```

### 5. Create Supabase Edge Function for Stripe

Deploy a Stripe webhook handler:

```typescript
// supabase/functions/stripe-webhook/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  // Verify webhook signature
  // Update beta_signups table when payment succeeds
  // Send welcome email

  return new Response(JSON.stringify({ received: true }));
});
```

## Deployment Instructions

### Option 1: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_GROQ_API_KEY
# - VITE_STRIPE_PUBLISHABLE_KEY
```

### Option 2: Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

### Option 3: Deploy to Custom Server

```bash
# Build
npm run build

# Upload dist/ folder to your server
# Configure nginx or Apache to serve static files
```

## Environment Variables Required

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_API_KEY=your-groq-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (when ready)
```

## Post-Launch Checklist

- [ ] Record professional demo video
- [ ] Replace demo placeholder with real video
- [ ] Set up Stripe product ($5 one-time payment)
- [ ] Test full payment flow in Stripe test mode
- [ ] Deploy Stripe webhook handler
- [ ] Create Discord server and add link
- [ ] Set up transactional email (welcome email)
- [ ] Add Google Analytics or tracking
- [ ] Test responsive design on mobile
- [ ] Set up custom domain
- [ ] Configure SSL certificate
- [ ] Test checkout flow end-to-end
- [ ] Set up monitoring (Sentry, LogRocket)

## Marketing Copy Highlights

**Headline:** "Stop Missing Details: AI Takes Notes While You Listen"

**Value Props:**
1. Focus on understanding—no need to write
2. Real-time, perfectly structured notes generated as your professor speaks
3. Export, review, and study anytime

**Pricing:** $5 one-time for lifetime beta access (save 50%+ when we launch at $10/month)

**Urgency:** Limited to 100 beta users, then price increases

**Guarantee:** 30-day money-back, no questions asked

## Next Steps

1. **Record Demo Video** - Show the app transcribing a real lecture
2. **Activate Stripe** - Follow Stripe integration steps above
3. **Test Everything** - Run through full signup → payment → success flow
4. **Launch** - Share on Product Hunt, Reddit (r/college, r/studytips), Twitter
5. **Collect Feedback** - Discord community is key for early users

## Support

- Email: support@notesync.ai
- Discord: discord.gg/notesync (create this)
- Twitter: @notesyncai (create this)

---

Built with React, Vite, Tailwind CSS, shadcn/ui, Supabase, and Stripe.
