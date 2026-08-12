import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { loadRazorpayScript } from '../lib/razorpay';
import { useAuthStore } from '../store/authStore';
import { PaidPlan, PaymentRecord, User } from '../types';

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  plan: PaidPlan;
  planName: string;
  user: {
    email: string;
    name: string;
  };
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  plan: PaidPlan;
  user: User;
  payment?: PaymentRecord;
}

export interface RazorpayCheckoutOptions {
  /** Called after successful verification and user state update. */
  onSuccess?: (result: VerifyPaymentResponse) => void | Promise<void>;
  /** Called when the user closes the Razorpay modal without paying. */
  onDismiss?: () => void;
  /** Route to navigate after success. Set to `false` to stay on current page. */
  redirectTo?: string | false;
  /** Skip auth redirect (billing page is already protected). */
  requireAuth?: boolean;
}

/**
 * Reusable Razorpay checkout hook.
 * 1. Loads Razorpay SDK
 * 2. Creates order via backend (server-side amount validation)
 * 3. Opens checkout modal
 * 4. Verifies payment signature on success
 */
export function useRazorpayCheckout(defaultOptions: RazorpayCheckoutOptions = {}) {
  const navigate = useNavigate();
  const { isAuthenticated, setUser } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<PaidPlan | null>(null);

  const startCheckout = useCallback(
    async (plan: PaidPlan, overrideOptions: RazorpayCheckoutOptions = {}) => {
      const options = { ...defaultOptions, ...overrideOptions };
      const requireAuth = options.requireAuth ?? true;

      if (requireAuth && !isAuthenticated) {
        sessionStorage.setItem('checkoutPlan', plan);
        toast('Please sign in to upgrade your plan');
        navigate('/login', { state: { from: '/#pricing', plan } });
        return;
      }

      setIsProcessing(true);
      setProcessingPlan(plan);

      try {
        // Step 1: Load Razorpay Checkout SDK
        await loadRazorpayScript();

        // Step 2: Create order on backend (amount validated server-side)
        const { data } = await api.post<CreateOrderResponse>('/payments/create-order', { plan });

        // Step 3: Open Razorpay modal with order details + user prefill
        const razorpay = new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'InterviewAce',
          description: `${data.planName} Plan — Monthly Subscription`,
          order_id: data.orderId,
          prefill: {
            name: data.user.name,
            email: data.user.email,
          },
          theme: { color: '#0891b2' },
          handler: async (response) => {
            try {
              // Step 4: Verify payment signature on backend
              const { data: verifyData } = await api.post<VerifyPaymentResponse>(
                '/payments/verify',
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }
              );

              // Step 5: Update global auth state with new plan
              setUser(verifyData.user);
              toast.success(verifyData.message);

              await options.onSuccess?.(verifyData);

              if (options.redirectTo !== false) {
                navigate(options.redirectTo ?? '/dashboard');
              }
            } catch (error: unknown) {
              const message =
                (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                'Payment verification failed. Please contact support if amount was deducted.';
              toast.error(message);
            } finally {
              setIsProcessing(false);
              setProcessingPlan(null);
            }
          },
          modal: {
            ondismiss: () => {
              toast.error('Payment cancelled');
              options.onDismiss?.();
              setIsProcessing(false);
              setProcessingPlan(null);
            },
          },
        });

        razorpay.on('payment.failed', (response) => {
          toast.error(response.error.description || 'Payment failed. Please try again.');
          setIsProcessing(false);
          setProcessingPlan(null);
        });

        razorpay.open();
      } catch (error: unknown) {
        const message =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          (error as Error)?.message ||
          'Unable to start checkout. Please try again.';
        toast.error(message);
        setIsProcessing(false);
        setProcessingPlan(null);
      }
    },
    [defaultOptions, isAuthenticated, navigate, setUser]
  );

  return { startCheckout, isProcessing, processingPlan };
}
