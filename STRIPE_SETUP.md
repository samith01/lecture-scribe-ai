# Stripe Integration Setup Guide

## Overview

The landing page now integrates directly with Stripe. When users click "Get Beta Access," they:
1. Enter their email
2. Click the button
3. Immediately redirect to Stripe Checkout
4. Complete payment on Stripe's hosted page
5. Return to `/success` page with confirmation

## What's Been Deployed

### Edge Functions

1. **create-checkout-session** - Creates Stripe checkout sessions
   - URL: `https://ramujbluqjmapctgnygz.supabase.co/functions/v1/create-checkout-session`
   - Accepts: `{ email: string }`
   - Returns: `{ sessionId: string, url: string }`

2. **stripe-webhook** - Handles Stripe webhook events
   - URL: `https://ramujbluqjmapctgnygz.supabase.co/functions/v1/stripe-webhook`
   - Listens for: `checkout.session.completed`
   - Updates: `beta_signups` table with payment info

## Required Environment Variables

You need to add these secrets to your Supabase project:

### 1. Get Your Stripe Keys

Go to https://dashboard.stripe.com/test/apikeys

**Test Mode Keys (for development):**
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

**Live Mode Keys (for production):**
- Publishable key: `pk_live_...`
- Secret key: `sk_live_...`

### 2. Add to Supabase

The edge functions need these secrets set in Supabase:

```bash
# STRIPE_SECRET_KEY
# Your Stripe secret key (sk_test_... or sk_live_...)
sk_test_51ABC...

# STRIPE_WEBHOOK_SECRET
# Your webhook signing secret (whsec_...)
whsec_123...
```

**How to add secrets:**
1. Go to https://supabase.com/dashboard/project/ramujbluqjmapctgnygz/settings/functions
2. Click "Edge Functions"
3. Click on "Secrets"
4. Add `STRIPE_SECRET_KEY` with your secret key
5. Add `STRIPE_WEBHOOK_SECRET` (after setting up webhook below)

### 3. Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Set endpoint URL to:
   ```
   https://ramujbluqjmapctgnygz.supabase.co/functions/v1/stripe-webhook
   ```
4. Select event: `checkout.session.completed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add this as `STRIPE_WEBHOOK_SECRET` in Supabase secrets

## Testing the Integration

### Test Mode

1. Use Stripe test keys (`pk_test_...` and `sk_test_...`)
2. Test card numbers:
   - Success: `4242 4242 4242 4242`
   - Requires authentication: `4000 0025 0000 3155`
   - Declined: `4000 0000 0000 9995`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC
   - Any ZIP code

### Test Flow

1. Visit your landing page
2. Enter an email address
3. Click "Get Beta Access - $5"
4. You should be redirected to Stripe Checkout
5. Enter test card: `4242 4242 4242 4242`
6. Complete the form
7. You'll be redirected to `/success?session_id=cs_test_...`
8. Check your `beta_signups` table - should see the completed payment

## Going Live

When ready to accept real payments:

1. **Complete Stripe Account Setup**
   - Verify your business details
   - Connect your bank account
   - Complete any required documentation

2. **Switch to Live Keys**
   - Update `STRIPE_SECRET_KEY` in Supabase to your live key (`sk_live_...`)
   - Update webhook endpoint to use live mode

3. **Test with Real Card**
   - Use a real card with a small amount first
   - Verify the full flow works

4. **Monitor Dashboard**
   - Watch for payments in https://dashboard.stripe.com/payments
   - Check for webhook delivery at https://dashboard.stripe.com/webhooks

## How It Works

### User Flow

```
1. User enters email on landing page
2. Clicks "Get Beta Access - $5"
3. Frontend calls: /functions/v1/create-checkout-session
4. Edge function creates Stripe checkout session
5. User redirected to Stripe's hosted checkout page
6. User completes payment on Stripe
7. Stripe redirects to: /success?session_id=cs_...
8. Stripe sends webhook to: /functions/v1/stripe-webhook
9. Webhook updates beta_signups table
10. Success page verifies payment and shows confirmation
```

### Database Flow

When payment completes:
- Webhook receives `checkout.session.completed` event
- Extracts customer email from session
- Upserts to `beta_signups` table:
  ```sql
  {
    email: 'user@example.com',
    payment_status: 'completed',
    stripe_payment_intent_id: 'pi_...',
    stripe_customer_id: 'cus_...',
    amount_paid: 500,
    access_granted_at: '2025-11-20T...'
  }
  ```

## Troubleshooting

### Webhook Not Firing

1. Check webhook endpoint is correct in Stripe dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check edge function logs in Supabase dashboard
4. Test webhook manually in Stripe dashboard

### Payment Not Recording

1. Check `beta_signups` table RLS policies
2. Verify webhook event is `checkout.session.completed`
3. Check edge function logs for errors
4. Ensure Supabase service role key is set

### Checkout Session Fails

1. Verify `STRIPE_SECRET_KEY` is set correctly
2. Check edge function logs
3. Ensure email format is valid
4. Test with Stripe test keys first

## Security Notes

- All secrets are stored in Supabase, never in frontend code
- Webhook signatures are verified before processing
- RLS policies protect database access
- Payments processed entirely through Stripe's secure infrastructure
- No card details ever touch your servers

## Support

- Stripe docs: https://stripe.com/docs
- Supabase edge functions: https://supabase.com/docs/guides/functions
- Webhook testing: https://dashboard.stripe.com/test/webhooks

---

Once you add the Stripe keys, the integration is complete and ready to accept payments!
