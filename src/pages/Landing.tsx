import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Play, ArrowRight, Zap, Clock, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import PaymentSuccessModal from '@/components/PaymentSuccessModal';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paidUserEmail, setPaidUserEmail] = useState<string | undefined>();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const checkPaymentSuccess = async () => {
      const paymentStatus = searchParams.get('payment');

      if (paymentStatus === 'success') {
        const { data } = await supabase
          .from('beta_signups')
          .select('email')
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.email) {
          setPaidUserEmail(data.email);
        }

        setShowSuccessModal(true);

        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('payment');
        setSearchParams(newSearchParams, { replace: true });
      }
    };

    checkPaymentSuccess();
  }, [searchParams, setSearchParams]);

  const handleCheckout = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PaymentSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        email={paidUserEmail}
      />

      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="NotesByAI" className="h-10 w-auto" />
            <span className="font-bold text-xl">NotesByAI</span>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            Limited Beta Launch
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Show Up to Class
            <span className="block text-blue-600 mt-2">
              Leave With Perfect Notes!
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-600 mb-8 leading-relaxed">
            Finally focus on learning—let AI handle your lecture notes
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-xs h-12 text-lg"
            />
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              size="lg"
              className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Get Early Access ($5)
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              <span>30-Day Money Back</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              <span>Lifetime Discount</span>
            </div>
              <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              <span>Only 50 early-access spots — lifetime discount.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="aspect-video bg-slate-800 flex items-center justify-center relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20">
            <video src="notesbyaidemo.mp4" width={1200} height={300} controls="true" autoplay="true" />
            
            </div>
            <div className="relative z-10">
              {/* <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-blue-600 ml-1" />
              </div> */}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Focus on Understanding, Not Writing
          </h2>
          <p className="text-xl text-slate-600">
            Real-time, perfectly structured notes generated as your professor speaks
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-colors">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Focus on Learning</h3>
            <p className="text-slate-600 leading-relaxed">
              No need to write. Just listen, understand, and engage with your professor while AI captures everything.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-colors">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real-Time Structure</h3>
            <p className="text-slate-600 leading-relaxed">
              Watch as your lecture transforms into organized, study-ready notes with sections, bullets, and key terms highlighted.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-colors">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Export & Review</h3>
            <p className="text-slate-600 leading-relaxed">
              Download as PDF or Markdown. Review anytime. Perfect for studying, sharing, or uploading to your note system.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-slate-50 rounded-xl p-8 border">
          <h3 className="text-xl font-semibold mb-4">Works Everywhere</h3>
          <p className="text-slate-600 mb-4">
            In-person lectures, online classes, recorded sessions—just hit record and let AI do the work.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">In-Person Classes</Badge>
            <Badge variant="outline">Zoom Lectures</Badge>
            <Badge variant="outline">Recorded Sessions</Badge>
            <Badge variant="outline">Office Hours</Badge>
            <Badge variant="outline">Study Groups</Badge>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-white/20 text-white hover:bg-white/20 border-white/30">
            Early Beta Access
          </Badge>

          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Reserve Your Spot Today
          </h2>

          <p className="text-xl mb-4 text-blue-100">
            One-time payment of <span className="font-bold text-white text-3xl">$5</span> for beta access
          </p>

          <p className="text-lg mb-8 text-blue-100">
            No free trial—watch the demo, then decide. Beta users get priority support and special Discord perks.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8 border border-white/20">
            <h3 className="text-2xl font-semibold mb-4">What You Get:</h3>
            <ul className="text-left max-w-md mx-auto space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>Full access to AI note-taking app</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>50% discount for first 3 months (join Discord)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>Priority support and feature requests</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>Early access to new features</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>30-day money-back guarantee</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-xs h-14 text-lg bg-white text-slate-900"
            />
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              size="lg"
              className="h-14 px-10 text-lg bg-white text-blue-600 hover:bg-slate-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Signup For Beta Access Now!
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          <div className="bg-orange-500/20 border border-orange-300/50 rounded-lg p-4 max-w-md mx-auto">
            <p className="font-semibold text-orange-100">
              ⚡ Join our Discord for exclusive 50% discount
            </p>
            <p className="text-sm text-orange-200 mt-1">
              Valid for your first 3 months after launch
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t bg-slate-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            <div className="flex items-center gap-3">
              <img src="/transparent-logo.png" alt="NotesByAI" className="h-10 w-auto" />
              <span className="font-bold text-lg">NotesByAI</span>
            </div>

            <div className="text-sm text-slate-600">
              <p className="mb-2">
                <strong>Questions?</strong> Email us at{' '}
                <a href="mailto:samithnfernando@gmail.com" className="text-blue-600 hover:underline">
                  samithnfernando@gmail.com
                </a>
              </p>
              <p>We typically respond within 24 hours.</p>
            </div>
          </div>

          <div className="text-center mt-8 text-sm text-slate-500">
            © 2025 NotesByAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
