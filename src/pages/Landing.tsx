import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Play, ArrowRight, Zap, Clock, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PaymentSuccessModal from '@/components/PaymentSuccessModal';
import { useSearchParams } from 'react-router-dom';


const Landing = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paidUserEmail, setPaidUserEmail] = useState<string | undefined>();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();


  useEffect(() => {
    const checkPaymentSuccess = () => {
  const paymentStatus = searchParams.get('payment');

  if (paymentStatus === 'success') {
    setShowSuccessModal(true);

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('payment');
    setSearchParams(newSearchParams, { replace: true });
  }
};
;

    checkPaymentSuccess();
  }, [searchParams, setSearchParams]);

 const handleCheckout = () => {
  if (!email || !email.includes('@')) {
    toast({
      title: 'Invalid Email',
      description: 'Please enter a valid email address',
      variant: 'destructive',
    });
    return;
  }

  const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
  window.location.href = paymentLink;
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
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100 animate-fade-in">
            Limited Beta Launch
          </Badge>
         
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Stop Typing.
            <span className="block text-blue-600 mt-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
              Start Understanding.
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-600 mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '300ms' }}>
            Finally focus on learning and let AI handle your lecture notes
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
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
              className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700 hover-scale"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Get Early Access ($4.99)
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 animate-fade-in" style={{ animationDelay: '500ms' }}>
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
            
           <a href="https://www.producthunt.com/products/notesbyai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-notesbyai" target="_blank">
<img
  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1041005&theme=dark&t=1763773386854"
  alt="NotesByAI - Finally… a way to actually listen in class. | Product Hunt"
  style={{ width: "150px", height: "54px" }}
  width={250}
  height={54}
/>

          </a>
          </div>

        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl hover-scale">
          <div className="aspect-video bg-slate-800 flex items-center justify-center relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20">
            <video src="notesbyaidemo.mp4" width={1200} height={300} controls autoPlay />
            
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
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Focus on Understanding, Not Writing
          </h2>
          <p className="text-xl text-slate-600">
            Real-time, perfectly structured notes generated as your professor speaks
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-all hover-scale animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Focus on Learning</h3>
            <p className="text-slate-600 leading-relaxed">
              No need to write. Just listen, understand, and engage with your professor while AI captures everything.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-all hover-scale animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real-Time Structure</h3>
            <p className="text-slate-600 leading-relaxed">
              Watch as your lecture transforms into organized, study-ready notes with sections, bullets, and key terms highlighted.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-all hover-scale animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Export & Review</h3>
            <p className="text-slate-600 leading-relaxed">
              Download as PDF or Markdown. Review anytime. Perfect for studying, sharing, or uploading to your note system.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-slate-50 rounded-xl p-8 border animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="text-xl font-semibold mb-4">Works Everywhere</h3>
          <p className="text-slate-600 mb-4">
            In-person lectures, online classes, recorded sessions—just hit record and let AI do the work.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="animate-scale-in" style={{ animationDelay: '500ms' }}>In-Person Classes</Badge>
            <Badge variant="outline" className="animate-scale-in" style={{ animationDelay: '550ms' }}>Zoom Lectures</Badge>
            <Badge variant="outline" className="animate-scale-in" style={{ animationDelay: '600ms' }}>Recorded Sessions</Badge>
            <Badge variant="outline" className="animate-scale-in" style={{ animationDelay: '650ms' }}>Office Hours</Badge>
            <Badge variant="outline" className="animate-scale-in" style={{ animationDelay: '700ms' }}>Study Groups</Badge>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-white/20 text-white hover:bg-white/20 border-white/30 animate-fade-in">
            Early Beta Access
          </Badge>

          <h2 className="text-4xl sm:text-5xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Reserve Your Spot Today
          </h2>

          <p className="text-xl mb-4 text-blue-100 animate-fade-in" style={{ animationDelay: '200ms' }}>
            One-time payment of <span className="font-bold text-white text-3xl">$4.99</span> for beta access
          </p>

          <p className="text-lg mb-8 text-blue-100 animate-fade-in" style={{ animationDelay: '300ms' }}>
            No free trial—watch the demo, then decide. Beta users get priority support and special Discord perks.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8 border border-white/20 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <h3 className="text-2xl font-semibold mb-4">What You Get:</h3>
            <ul className="text-left max-w-md mx-auto space-y-3">
              <li className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>Full access to AI note-taking app</span>
              </li>
              <li className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '600ms' }}>
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>50% discount for first 3 months (join Discord)</span>
              </li>
              <li className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '700ms' }}>
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>Priority support and feature requests</span>
              </li>
              <li className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '800ms' }}>
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>Early access to new features</span>
              </li>
              <li className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: '900ms' }}>
                <Check className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                <span>30-day money-back guarantee</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6 animate-fade-in" style={{ animationDelay: '1000ms' }}>
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
              className="h-14 px-10 text-lg bg-white text-blue-600 hover:bg-slate-100 hover-scale"
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

          <div className="bg-orange-500/20 border border-orange-300/50 rounded-lg p-4 max-w-md mx-auto animate-scale-in" style={{ animationDelay: '1100ms' }}>
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
