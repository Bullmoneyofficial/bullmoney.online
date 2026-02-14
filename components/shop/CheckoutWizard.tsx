'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Lock, 
  CreditCard,
  Package,
  Truck,
  Shield,
  ShoppingBag,
  ChevronDown,
  Wallet
} from 'lucide-react';

import { useCartStore, useCheckoutStore } from '@/stores/cart-store';
import { CryptoCheckoutTrigger } from '@/components/shop/CryptoCheckoutInline';

// ============================================================================
// CHECKOUT WIZARD - MULTI-STEP CHECKOUT FLOW
// ============================================================================

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Validation schema for address
const addressSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  line1: z.string().min(1, 'Address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(5, 'Valid postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

type CheckoutStep = 'information' | 'shipping' | 'payment' | 'confirmation';

const STEPS: { id: CheckoutStep; label: string; icon: typeof Package }[] = [
  { id: 'information', label: 'Information', icon: Package },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
];

const SHIPPING_METHODS = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: '5-7 business days',
    price: 9.99,
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: '2-3 business days',
    price: 19.99,
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Next business day',
    price: 34.99,
  },
];

export function CheckoutWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('information');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { items, getSummary, clearCart } = useCartStore();
  const { 
    email, 
    shippingAddress, 
    shippingMethodId,
    setEmail, 
    setShippingAddress,
    setShippingMethod,
    resetCheckout,
  } = useCheckoutStore();

  const summary = getSummary();

  const selectedShipping = SHIPPING_METHODS.find(m => m.id === shippingMethodId) || SHIPPING_METHODS[0];
  const finalTotal = summary.subtotal + selectedShipping.price + summary.tax - summary.discount;

  // Address form
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid },
    watch,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: 'onChange',
    defaultValues: {
      email: email,
      first_name: shippingAddress?.first_name || '',
      last_name: shippingAddress?.last_name || '',
      line1: shippingAddress?.line1 || '',
      line2: shippingAddress?.line2 || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      postal_code: shippingAddress?.postal_code || '',
      country: shippingAddress?.country || 'US',
      phone: shippingAddress?.phone || '',
    },
  });

  const watchedEmail = watch('email');

  // Create payment intent when moving to payment step
  const createPaymentIntent = async () => {
    if (!shippingAddress) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: item.product.id,
            variant_id: item.variant.id,
            quantity: item.quantity,
          })),
          email: email,
          shipping_address: shippingAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      setClientSecret(data.client_secret);
      setOrderId(data.order_id);
      setOrderNumber(data.order_number);
      setCurrentStep('payment');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle information form submission
  const onInformationSubmit = (data: AddressFormData) => {
    setEmail(data.email);
    setShippingAddress({
      first_name: data.first_name,
      last_name: data.last_name,
      line1: data.line1,
      line2: data.line2 || '',
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      country: data.country,
      phone: data.phone || '',
    });
    setCurrentStep('shipping');
  };

  // Handle shipping selection
  const handleShippingSelect = (methodId: string) => {
    setShippingMethod(methodId);
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    setCurrentStep('confirmation');
    clearCart();
    resetCheckout();
  };

  // Step indicator
  const getStepStatus = (step: CheckoutStep) => {
    const stepOrder = ['information', 'shipping', 'payment'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  // Back button handler
  const handleBack = () => {
    const stepOrder: CheckoutStep[] = ['information', 'shipping', 'payment'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header with Back Button */}
      {/* Header - No blur, high z-index above overlays */}
      <header className="border-b border-white/10 sticky top-0 bg-black z-[960]">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          {/* Back Button */}
          {currentStep === 'information' ? (
            <Link 
              href="/store" 
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : currentStep !== 'confirmation' ? (
            <button
              onClick={handleBack}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}

          {/* Logo / Title */}
          <Link href="/store" className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm md:text-lg">B</span>
            </div>
            <span className="text-lg md:text-xl font-light hidden sm:block">Checkout</span>
          </Link>

          <div className="flex items-center gap-2 text-white/60">
            <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm">Secure</span>
          </div>
        </div>

        {/* Step Indicator - Mobile Optimized */}
        {currentStep !== 'confirmation' && (
          <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
            <div className="flex items-center justify-center gap-2 md:gap-8">
              {STEPS.map((step, index) => {
                const status = getStepStatus(step.id);
                const Icon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-colors text-xs
                        ${status === 'completed' ? 'bg-white text-black' : ''}
                        ${status === 'current' ? 'bg-white/20 text-white ring-2 ring-white/30' : ''}
                        ${status === 'upcoming' ? 'bg-white/5 text-white/30' : ''}
                      `}>
                        {status === 'completed' ? (
                          <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        )}
                      </div>
                      <span className={`text-xs md:text-sm hidden sm:block transition-colors
                        ${status === 'current' ? 'text-white font-medium' : 'text-white/40'}
                      `}>
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`w-6 md:w-16 h-px transition-colors
                        ${index < STEPS.findIndex(s => s.id === currentStep) ? 'bg-white' : 'bg-white/10'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          {/* Form Section */}
          <div className="order-2 lg:order-1">
            <AnimatePresence mode="wait">
              {currentStep === 'information' && (
                <motion.div
                  key="information"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6 md:space-y-8"
                >
                  <div>
                    <h2 className="text-xl md:text-2xl font-light mb-1 md:mb-2">Contact & Shipping</h2>
                    <p className="text-white/40 text-sm">Enter your shipping details</p>
                  </div>

                  <form onSubmit={handleSubmit(onInformationSubmit)} className="space-y-4 md:space-y-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm text-white/60 mb-1.5 md:mb-2">Email</label>
                      <input
                        type="email"
                        {...register('email')}
                        className={`w-full h-11 md:h-12 px-4 bg-white/5 border rounded-xl focus:outline-none focus:bg-white/[0.07] transition-all text-sm md:text-base
                          ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-white/20'}
                        `}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-xs md:text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-1.5 md:mb-2">First Name</label>
                        <input
                          type="text"
                          {...register('first_name')}
                          className={`w-full h-11 md:h-12 px-4 bg-white/5 border rounded-xl focus:outline-none focus:bg-white/[0.07] transition-all text-sm md:text-base
                            ${errors.first_name ? 'border-red-500' : 'border-white/10 focus:border-white/20'}
                          `}
                        />
                        {errors.first_name && (
                          <p className="text-red-400 text-xs mt-1">{errors.first_name.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-1.5 md:mb-2">Last Name</label>
                        <input
                          type="text"
                          {...register('last_name')}
                          className={`w-full h-11 md:h-12 px-4 bg-white/5 border rounded-xl focus:outline-none focus:bg-white/[0.07] transition-all text-sm md:text-base
                            ${errors.last_name ? 'border-red-500' : 'border-white/10 focus:border-white/20'}
                          `}
                        />
                        {errors.last_name && (
                          <p className="text-red-400 text-xs mt-1">{errors.last_name.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Address</label>
                      <input
                        type="text"
                        {...register('line1')}
                        className={`w-full h-12 px-4 bg-white/5 border rounded-xl focus:outline-none transition-colors
                          ${errors.line1 ? 'border-red-500' : 'border-white/10 focus:border-white/20'}
                        `}
                        placeholder="Street address"
                      />
                      {errors.line1 && (
                        <p className="text-red-400 text-sm mt-1">{errors.line1.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-white/60 mb-2">Apartment, suite, etc. (optional)</label>
                      <input
                        type="text"
                        {...register('line2')}
                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/20"
                      />
                    </div>

                    {/* City, State, Zip */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">City</label>
                        <input
                          type="text"
                          {...register('city')}
                          className={`w-full h-12 px-4 bg-white/5 border rounded-xl focus:outline-none transition-colors
                            ${errors.city ? 'border-red-500' : 'border-white/10 focus:border-white/20'}
                          `}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">State</label>
                        <input
                          type="text"
                          {...register('state')}
                          className={`w-full h-12 px-4 bg-white/5 border rounded-xl focus:outline-none transition-colors
                            ${errors.state ? 'border-red-500' : 'border-white/10 focus:border-white/20'}
                          `}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">ZIP</label>
                        <input
                          type="text"
                          {...register('postal_code')}
                          className={`w-full h-12 px-4 bg-white/5 border rounded-xl focus:outline-none transition-colors
                            ${errors.postal_code ? 'border-red-500' : 'border-white/10 focus:border-white/20'}
                          `}
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Country</label>
                      <select
                        {...register('country')}
                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/20 appearance-none"
                      >
                        <option value="US" className="bg-black">United States</option>
                        <option value="CA" className="bg-black">Canada</option>
                        <option value="GB" className="bg-black">United Kingdom</option>
                      </select>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Phone (optional)</label>
                      <input
                        type="tel"
                        {...register('phone')}
                        className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/20"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4">
                      <Link href="/store" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Return to store
                      </Link>
                      <button
                        type="submit"
                        className="h-12 px-8 bg-white text-black rounded-xl font-medium flex items-center gap-2 hover:bg-white/90 transition-colors"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {currentStep === 'shipping' && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-2xl font-light mb-2">Shipping Method</h2>
                    <p className="text-white/40 text-sm">Select your preferred shipping option</p>
                  </div>

                  <div className="space-y-3">
                    {SHIPPING_METHODS.map((method) => {
                      const isSelected = shippingMethodId === method.id || (!shippingMethodId && method.id === 'standard');
                      
                      return (
                        <button
                          key={method.id}
                          onClick={() => handleShippingSelect(method.id)}
                          className={`w-full p-4 rounded-xl border text-left transition-all
                            ${isSelected 
                              ? 'bg-white/10 border-white' 
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                ${isSelected ? 'border-white bg-white' : 'border-white/40'}
                              `}>
                                {isSelected && <Check className="w-3 h-3 text-black" />}
                              </div>
                              <div>
                                <p className="font-medium">{method.name}</p>
                                <p className="text-white/40 text-sm">{method.description}</p>
                              </div>
                            </div>
                            <span className="font-medium">${method.price.toFixed(2)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Shipping Address Summary */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-sm">Ship to</span>
                      <button 
                        onClick={() => setCurrentStep('information')}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-sm">
                      {shippingAddress?.first_name} {shippingAddress?.last_name}<br />
                      {shippingAddress?.line1}<br />
                      {shippingAddress?.line2 && <>{shippingAddress.line2}<br /></>}
                      {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postal_code}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4">
                    <button 
                      onClick={handleBack}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      onClick={createPaymentIntent}
                      disabled={isProcessing}
                      className="h-12 px-8 bg-white text-black rounded-xl font-medium flex items-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 'payment' && clientSecret && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-2xl font-light mb-2">Payment</h2>
                    <p className="text-white/40 text-sm">Choose your payment method</p>
                  </div>

                  {/* Crypto Payment Option */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white/60 uppercase tracking-wider">Pay with Cryptocurrency</p>
                    <CryptoCheckoutTrigger
                      productName="BullMoney Store Order"
                      priceUSD={summary.total}
                      productId="checkout-order"
                      quantity={1}
                      onPaymentSubmitted={(txHash, coin, network) => {
                        toast.success('Crypto payment submitted! Verifying transaction...');
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t border-white/10" />
                    <span className="text-white/30 text-sm">or pay with card</span>
                    <div className="flex-1 border-t border-white/10" />
                  </div>

                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: '#ffffff',
                          colorBackground: '#000000',
                          colorText: '#ffffff',
                          colorDanger: '#ef4444',
                          fontFamily: 'system-ui, sans-serif',
                          borderRadius: '12px',
                        },
                        rules: {
                          '.Input': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                          '.Input:focus': {
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: 'none',
                          },
                          '.Label': {
                            color: 'rgba(255, 255, 255, 0.6)',
                          },
                        },
                      },
                    }}
                  >
                    <PaymentForm 
                      onBack={handleBack}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                </motion.div>
              )}

              {currentStep === 'confirmation' && (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-20 h-20 rounded-full bg-white mx-auto mb-6 flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-black" />
                  </motion.div>

                  <h2 className="text-3xl font-light mb-2">Thank You</h2>
                  <p className="text-white/60 mb-8">Your order has been placed successfully</p>

                  {orderNumber && (
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-8 inline-block">
                      <p className="text-white/40 text-sm mb-1">Order Number</p>
                      <p className="text-xl font-mono">{orderNumber}</p>
                    </div>
                  )}

                  <p className="text-white/40 text-sm mb-8 max-w-md mx-auto">
                    We've sent a confirmation email with your order details and tracking information.
                  </p>

                  <Link
                    href="/store"
                    className="inline-flex items-center gap-2 h-12 px-8 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
                  >
                    Continue Shopping
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          {currentStep !== 'confirmation' && (
            <div className="order-1 lg:order-2 lg:border-l lg:border-white/10 lg:pl-12">
              {/* Mobile Order Summary Toggle */}
              <details className="lg:hidden group mb-6">
                <summary className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-white/60" />
                    <span className="font-medium">Order summary</span>
                    <span className="text-white/40">({items.length} items)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${finalTotal.toFixed(2)}</span>
                    <ChevronDown className="w-4 h-4 text-white/40 transition-transform group-open:rotate-180" />
                  </div>
                </summary>
                <div className="mt-4 space-y-4">
                  {/* Items */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {items.map((item) => {
                      const price = item.product.base_price + item.variant.price_adjustment;
                      const optionsText = Object.values(item.variant.options).filter(Boolean).join(' / ');
                      
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white/5 shrink-0">
                            {item.product.primary_image ? (
                              <Image
                                src={(() => {
                                  let src = item.product.primary_image;
                                  if (src.startsWith('/http://') || src.startsWith('/https://')) {
                                    src = src.substring(1);
                                  }
                                  if (src.startsWith('http://') || src.startsWith('https://')) {
                                    return src;
                                  }
                                  return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
                                })()}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">B</div>
                            )}
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white/50 rounded-full text-[10px] flex items-center justify-center text-black font-medium">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                            {optionsText && <p className="text-white/40 text-xs">{optionsText}</p>}
                          </div>
                          <p className="text-sm">${(price * item.quantity).toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
              
              {/* Desktop Order Summary */}
              <div className="hidden lg:block lg:sticky lg:top-8 space-y-6">
                <h3 className="text-lg font-medium">Order Summary</h3>

                {/* Items */}
                <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-hide">
                  {items.map((item) => {
                    const price = item.product.base_price + item.variant.price_adjustment;
                    const optionsText = Object.values(item.variant.options).filter(Boolean).join(' / ');
                    
                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/5 shrink-0">
                          {item.product.primary_image ? (
                            <Image
                              src={(() => {
                                let src = item.product.primary_image;
                                if (src.startsWith('/http://') || src.startsWith('/https://')) {
                                  src = src.substring(1);
                                }
                                if (src.startsWith('http://') || src.startsWith('https://')) {
                                  return src;
                                }
                                return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
                              })()}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">B</div>
                          )}
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                          {optionsText && <p className="text-white/40 text-xs">{optionsText}</p>}
                        </div>
                        <p className="text-sm">${(price * item.quantity).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="border-t border-white/10 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>${summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>${selectedShipping.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Tax</span>
                    <span>${summary.tax.toFixed(2)}</span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-${summary.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4 flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-white/40 text-sm pt-4">
                  <Shield className="w-4 h-4" />
                  <span>Secure 256-bit SSL encryption</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// PAYMENT FORM COMPONENT
// ============================================================================

function PaymentForm({ 
  onBack, 
  onSuccess 
}: { 
  onBack: () => void; 
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store/checkout/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setErrorMessage(error.message || 'Payment failed');
      } else {
        setErrorMessage('An unexpected error occurred');
      }
      setIsProcessing(false);
    } else {
      // Payment succeeded
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="h-12 px-8 bg-white text-black rounded-xl font-medium flex items-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pay Now
            </>
          )}
        </button>
      </div>
    </form>
  );
}
