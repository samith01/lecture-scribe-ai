import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X } from 'lucide-react';

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  email?: string;
}

const PaymentSuccessModal = ({ open, onClose, email }: PaymentSuccessModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold">
              Thank You for Your Payment!
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-slate-600">
              You will get full access to the product within two weeks. Please keep an eye on your email{email ? ` (${email})` : ''} for updates and your access details.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 w-full space-y-3">
            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Close
            </Button>

            <a
              href="https://discord.gg/notesync"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button
                variant="outline"
                className="w-full"
                size="lg"
              >
                Join Discord for Updates
              </Button>
            </a>
          </div>

          <div className="mt-6 pt-6 border-t w-full">
            <p className="text-xs text-slate-500 leading-relaxed">
              Questions or need a refund? Contact us at{' '}
              <a
                href="mailto:support@notesync.ai"
                className="text-blue-600 hover:underline"
              >
                support@notesync.ai
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSuccessModal;
