import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Check, Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/');
    }
  }, [email, navigate]);

  const handlePayment = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    toast({
      title: 'Coming Soon',
      description: 'Stripe integration will be added. For now, collecting emails.',
    });

    setTimeout(() => {
      navigate('/success?email=' + encodeURIComponent(email));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Secure Your Beta Access</h1>
            <p className="text-slate-600 mb-6">
              Join the first wave of students revolutionizing how they take notes
            </p>

            <Card className="p-6 mb-6 border-2 border-blue-200 bg-blue-50">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Beta Access</span>
                <span className="text-2xl font-bold">$5</span>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Lifetime beta discount</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Full app access</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </Card>

          </div>

          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Details</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    We'll send your access credentials here
                  </p>
                </div>

                
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing || !email}
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay $5 - Get Beta Access</>
                )}
              </Button>

              <p className="text-xs text-center text-slate-500 mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </Card>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
