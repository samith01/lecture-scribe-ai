# Payment Flow Documentation

## Updated Payment Flow

After successful payment, users are redirected back to the landing page with a success modal.

### Complete User Journey

1. **Landing Page** - User enters email and clicks "Get Beta Access - $5"
2. **Stripe Checkout** - Redirected to Stripe's secure hosted checkout page
3. **Payment** - User completes $5 payment with credit card
4. **Redirect** - Stripe redirects back to: `/?payment=success`
5. **Success Modal** - Landing page shows modal with:
   - "Thank you for your payment!"
   - "You will get full access within two weeks"
   - "Keep an eye on your email for updates"
   - Two buttons: "Close" and "Join Discord for Updates"
6. **Email Confirmation** - User receives email with order details (from Stripe)

### Backend Flow

1. **Checkout Session Created**
   - Edge function: `create-checkout-session`
   - Creates Stripe session with $5 payment
   - Sets success URL: `/?payment=success`
   - Sets cancel URL: `/`

2. **Payment Completed**
   - Stripe processes payment
   - Sends webhook to: `stripe-webhook` edge function
   - Event: `checkout.session.completed`

3. **Database Updated**
   - Webhook extracts customer email
   - Updates `beta_signups` table:
     ```sql
     {
       email: 'user@example.com',
       payment_status: 'completed',
       stripe_payment_intent_id: 'pi_...',
       stripe_customer_id: 'cus_...',
       amount_paid: 500,
       access_granted_at: timestamp
     }
     ```

4. **Modal Displayed**
   - Landing page checks for `?payment=success` query param
   - Queries database for latest completed signup
   - Shows `PaymentSuccessModal` with user's email
   - Removes query param from URL (clean URL)

## Key Features

### Honest & Transparent
- Modal explicitly states "within two weeks" for access
- No misleading instant access promises
- Clear communication about what happens next

### Mobile-Friendly
- Responsive modal design
- Works on all screen sizes
- Touch-friendly buttons

### Professional
- Clean, minimalist design
- Blue and green color scheme
- Clear hierarchy and spacing

### Clear Support
- Footer includes:
  - Refund policy (30-day guarantee)
  - Access timeline explanation
  - Support contact: support@notesync.ai
  - Discord community link

## Modal Content

```
[Green checkmark icon]

Thank You for Your Payment!

You will get full access to the product within two weeks.
Please keep an eye on your email (user@example.com) for
updates and your access details.

[Close Button]
[Join Discord for Updates Button]

Questions or need a refund? Contact us at support@notesync.ai
```

## Footer Information

### Refund Policy
30-day money-back guarantee, no questions asked. Contact support@notesync.ai.

### Access Timeline
Beta access granted within two weeks. Users onboarded in small batches for best experience.

### Support
- Email: support@notesync.ai
- Response time: Within 24 hours
- Discord: discord.gg/notesync

## Testing the Flow

1. Enter email on landing page
2. Click "Get Beta Access - $5"
3. Redirected to Stripe checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Redirected to landing page
7. Modal appears with success message
8. Check database - payment recorded
9. Click "Close" - modal dismisses
10. Landing page remains

## Error Handling

- Invalid email: Toast notification
- Stripe error: Toast with error message
- Webhook failure: Check Supabase logs
- Modal doesn't show: Check browser console

## Security

- No sensitive data in URL (just `?payment=success` flag)
- Email fetched from database, not URL params
- HTTPS required for all transactions
- Stripe handles all card data
- Webhook signature verification

---

The flow is designed to be simple, honest, and transparent while maintaining professional standards and mobile responsiveness.
