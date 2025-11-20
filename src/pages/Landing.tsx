import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Play, ArrowRight, Zap, Clock, Download } from 'lucide-react';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const spotsRemaining = 47;

  const handleCheckout = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    window.location.href = '/checkout?email=' + encodeURIComponent(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">NoteSync AI</span>
          </div>
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            Limited Beta Launch
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Stop Missing Details:
            <span className="block text-blue-600 mt-2">
              AI Takes Notes While You Listen
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
              Get Beta Access - $5
              <ArrowRight className="ml-2 w-5 h-5" />
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
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="font-semibold">{spotsRemaining} Spots Left</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="aspect-video bg-slate-800 flex items-center justify-center relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-blue-600 ml-1" />
              </div>
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-lg font-semibold mb-2">Watch Full Demo</p>
              <p className="text-sm text-slate-300">See how students are already using AI to ace their classes</p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-white/20 text-white hover:bg-white/20 border-white/30">
            Early Beta Access
          </Badge>

          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Reserve Your Spot Today
          </h2>

          <p className="text-xl mb-4 text-blue-100">
            One-time payment of <span className="font-bold text-white text-3xl">$5</span> for lifetime beta access
          </p>

          <p className="text-lg mb-8 text-blue-100">
            No free trial—watch the demo, then decide. Beta users get lifetime discount and priority support.
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
                <span>Lifetime beta discount (save 50%+ when we launch)</span>
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
              Get Beta Access Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <div className="bg-orange-500/20 border border-orange-300/50 rounded-lg p-4 max-w-md mx-auto">
            <p className="font-semibold text-orange-100">
              ⚡ Limited Launch: Only {spotsRemaining} seats at $5
            </p>
            <p className="text-sm text-orange-200 mt-1">
              Next pricing starts at $10/month
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-slate-50 rounded-xl p-8 text-center border">
          <h3 className="text-2xl font-semibold mb-4">Why $5 Now?</h3>
          <p className="text-slate-600 max-w-2xl mx-auto mb-6">
            We're validating the product with real students. Your $5 commitment shows you're serious,
            funds early development, and locks in your lifetime discount. Once we hit 100 users,
            the price jumps to $10/month subscription.
          </p>
          <p className="text-sm text-slate-500">
            30-day money-back guarantee. No questions asked.
          </p>
        </div>
      </section>

      <footer className="border-t bg-slate-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">NoteSync AI</span>
            </div>

            <div className="flex gap-6 text-sm text-slate-600">
              <a href="mailto:support@notesync.ai" className="hover:text-blue-600">
                Contact
              </a>
              <a href="#" className="hover:text-blue-600">
                Privacy
              </a>
              <a href="#" className="hover:text-blue-600">
                Terms
              </a>
              <a href="https://discord.gg/notesync" className="hover:text-blue-600">
                Discord Community
              </a>
            </div>
          </div>

          <div className="text-center mt-8 text-sm text-slate-500">
            © 2025 NoteSync AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
