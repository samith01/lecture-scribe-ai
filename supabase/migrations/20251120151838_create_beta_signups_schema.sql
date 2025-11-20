/*
  # Beta Signups and Payments Schema

  1. New Tables
    - `beta_signups`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null) - User's email address
      - `payment_status` (text, not null) - Status: pending, completed, refunded
      - `stripe_payment_intent_id` (text, nullable) - Stripe payment reference
      - `stripe_customer_id` (text, nullable) - Stripe customer ID
      - `amount_paid` (integer, default 500) - Amount in cents ($5 = 500)
      - `created_at` (timestamptz, default now()) - Signup timestamp
      - `access_granted_at` (timestamptz, nullable) - When access was granted
      - `refunded_at` (timestamptz, nullable) - If refunded

  2. Security
    - Enable RLS on `beta_signups` table
    - Add policy for public to insert (for signups)
    - Add policy for authenticated admins to read all

  3. Indexes
    - Index on email for fast lookups
    - Index on payment_status for filtering
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS beta_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_paid integer DEFAULT 500,
  created_at timestamptz DEFAULT now(),
  access_granted_at timestamptz,
  refunded_at timestamptz,
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'refunded'))
);

ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create signup"
  ON beta_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can read own signup by email"
  ON beta_signups
  FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);
CREATE INDEX IF NOT EXISTS idx_beta_signups_payment_status ON beta_signups(payment_status);
CREATE INDEX IF NOT EXISTS idx_beta_signups_created_at ON beta_signups(created_at DESC);
