import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Bullmoney Store',
  description: 'Complete your purchase securely',
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen bg-black text-white"
      style={{
        // No extra padding needed - parent StoreLayout already handles main navbar offset
        // Checkout has its own header inside CheckoutWizard
      }}
    >
      {children}
    </div>
  );
}
