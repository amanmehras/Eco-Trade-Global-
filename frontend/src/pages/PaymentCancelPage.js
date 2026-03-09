import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" data-testid="payment-cancel-page">
      <div className="max-w-md w-full text-center">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-[#FF6B35]" />
        <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-[#595959] mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/orders')} className="btn-secondary" data-testid="back-to-orders-button">
            Back to Orders
          </Button>
          <Button onClick={() => navigate('/products')} className="btn-primary" data-testid="browse-products-button">
            Browse Products
          </Button>
        </div>
      </div>
    </div>
  );
}