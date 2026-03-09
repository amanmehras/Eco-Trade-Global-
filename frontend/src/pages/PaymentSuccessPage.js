import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/orders');
      return;
    }

    const pollPaymentStatus = async (attempts = 0) => {
      const maxAttempts = 5;
      if (attempts >= maxAttempts) {
        setStatus('timeout');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/payments/status/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.payment_status === 'paid') {
          setStatus('success');
          setPaymentInfo(data);
        } else if (data.status === 'expired') {
          setStatus('expired');
        } else {
          setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
        }
      } catch (error) {
        console.error('Error checking payment:', error);
        setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
      }
    };

    pollPaymentStatus();
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" data-testid="payment-success-page">
      <div className="max-w-md w-full text-center">
        {status === 'checking' && (
          <div data-testid="payment-checking">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#2A5934] animate-spin" />
            <h1 className="text-3xl font-bold mb-2">Processing Payment...</h1>
            <p className="text-[#595959]">Please wait while we confirm your payment</p>
          </div>
        )}

        {status === 'success' && (
          <div data-testid="payment-success">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-[#595959] mb-6">Your order has been confirmed and payment received.</p>
            {paymentInfo && (
              <div className="bg-[#F4F4F0] p-6 rounded-sm mb-6">
                <p className="text-sm text-[#595959] mb-2">Amount Paid</p>
                <p className="text-2xl font-bold mono">
                  {(paymentInfo.amount_total / 100).toFixed(2)} {paymentInfo.currency.toUpperCase()}
                </p>
              </div>
            )}
            <Button onClick={() => navigate('/orders')} className="btn-primary" data-testid="view-orders-button">
              View My Orders
            </Button>
          </div>
        )}

        {status === 'timeout' && (
          <div data-testid="payment-timeout">
            <h1 className="text-3xl font-bold mb-2">Payment Check Timeout</h1>
            <p className="text-[#595959] mb-6">Please check your orders page for payment status</p>
            <Button onClick={() => navigate('/orders')} className="btn-primary">
              View Orders
            </Button>
          </div>
        )}

        {status === 'expired' && (
          <div data-testid="payment-expired">
            <h1 className="text-3xl font-bold mb-2">Payment Session Expired</h1>
            <p className="text-[#595959] mb-6">Your payment session has expired. Please try again.</p>
            <Button onClick={() => navigate('/orders')} className="btn-primary">
              Back to Orders
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}