import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Payment features will be disabled.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface BetaSignup {
  id: string;
  email: string;
  payment_status: 'pending' | 'completed' | 'refunded';
  stripe_payment_intent_id?: string;
  stripe_customer_id?: string;
  amount_paid: number;
  created_at: string;
  access_granted_at?: string;
  refunded_at?: string;
}

export const createBetaSignup = async (email: string) => {
  const { data, error } = await supabase
    .from('beta_signups')
    .insert([{ email, payment_status: 'pending' }])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateBetaSignupPayment = async (
  email: string,
  paymentIntentId: string,
  customerId: string
) => {
  const { data, error } = await supabase
    .from('beta_signups')
    .update({
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: customerId,
      access_granted_at: new Date().toISOString(),
    })
    .eq('email', email)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getBetaSignup = async (email: string) => {
  const { data, error } = await supabase
    .from('beta_signups')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
};
