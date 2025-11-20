import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Mail, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('beta_signups')
          .select('email')
          .eq('stripe_payment_intent_id', sessionId)
          .maybeSingle();

        if (error || !data) {
          const allSignups = await supabase
            .from('beta_signups')
            .select('email, stripe_payment_intent_id')
            .eq('payment_status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (allSignups.data?.email) {
            setEmail(allSignups.data.email);
          }
        } else {
          setEmail(data.email);
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Welcome to the Beta! 🎉
        </h1>

        <p className="text-xl text-slate-600 mb-8">
          You're officially part of the NoteSync AI early access program
        </p>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold mb-3 text-lg">What Happens Next:</h2>
          <ol className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <span>
                <strong>Check your email ({email})</strong> - You'll receive login credentials and onboarding instructions within 24 hours
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <span>
                <strong>Join our Discord community</strong> - Get priority support, share feedback, and connect with other beta users
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <span>
                <strong>Start using the app</strong> - Record your first lecture and see AI notes in action
              </span>
            </li>
          </ol>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <a
            href="https://discord.gg/notesync"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="p-6 hover:border-blue-300 transition-colors cursor-pointer h-full">
              <MessageSquare className="w-8 h-8 text-blue-600 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Join Discord</h3>
              <p className="text-sm text-slate-600">
                Get instant support and beta updates
              </p>
            </Card>
          </a>

          <Card className="p-6 bg-slate-50">
            <Mail className="w-8 h-8 text-slate-600 mb-3 mx-auto" />
            <h3 className="font-semibold mb-2">Check Email</h3>
            <p className="text-sm text-slate-600">
              Access details sent to {email}
            </p>
          </Card>
        </div>

        <Button
          onClick={() => navigate('/app')}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 h-12 px-8"
        >
          Go to App Dashboard
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        <p className="text-sm text-slate-500 mt-6">
          Questions? Email us at{' '}
          <a href="mailto:support@notesync.ai" className="text-blue-600 hover:underline">
            support@notesync.ai
          </a>
        </p>

        <div className="mt-8 pt-8 border-t">
          <p className="text-xs text-slate-500">
            Remember: You have a 30-day money-back guarantee. If NoteSync AI doesn't meet your expectations,
            we'll refund you in full, no questions asked.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Success;
