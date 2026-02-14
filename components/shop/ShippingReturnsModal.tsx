'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, RotateCcw, Shield, Clock, MapPin, AlertCircle, CreditCard, Package } from 'lucide-react';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// SHIPPING & RETURNS MODAL - Full Policy Disclaimer
// ============================================================================

interface ShippingReturnsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS = ['Shipping', 'Returns', 'Warranty'] as const;
type Tab = typeof TABS[number];

export function ShippingReturnsModal({ isOpen, onClose }: ShippingReturnsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Shipping');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-black border border-white/10 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black">
              <h2 className="text-xl font-semibold text-white">Shipping & Returns</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors relative
                    ${activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/70'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="shipping-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {activeTab === 'Shipping' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-white">
                        <Truck className="w-5 h-5" />
                        <span className="font-medium">Standard Shipping</span>
                      </div>
                      <p className="text-white/60 text-sm">5-10 business days</p>
                      <p className="text-white/80 font-medium">{useCurrencyLocaleStore.getState().formatPrice(9.99)} (Free over {useCurrencyLocaleStore.getState().formatPrice(150)})</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Express Shipping</span>
                      </div>
                      <p className="text-white/60 text-sm">2-4 business days</p>
                      <p className="text-white/80 font-medium">{useCurrencyLocaleStore.getState().formatPrice(19.99)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Shipping Regions
                    </h3>
                    <div className="text-sm text-white/60 space-y-2">
                      <p>We ship worldwide to over 200 countries and territories. Delivery times may vary by region:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong className="text-white/80">United States:</strong> 3-7 business days</li>
                        <li><strong className="text-white/80">Canada:</strong> 5-10 business days</li>
                        <li><strong className="text-white/80">Europe (UK, EU):</strong> 7-14 business days</li>
                        <li><strong className="text-white/80">Asia Pacific:</strong> 10-18 business days</li>
                        <li><strong className="text-white/80">Africa:</strong> 14-21 business days</li>
                        <li><strong className="text-white/80">South America:</strong> 12-20 business days</li>
                        <li><strong className="text-white/80">Middle East:</strong> 10-16 business days</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" /> Order Processing
                    </h3>
                    <p className="text-sm text-white/60">
                      Orders are processed within 1-2 business days. You will receive a tracking number via email once your order ships.
                      Custom and limited edition items may require additional processing time of 3-5 business days.
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-white/60">
                        <p className="text-white/80 font-medium mb-1">Import Duties & Taxes</p>
                        <p>International orders may be subject to customs duties and taxes imposed by the destination country.
                          These charges are the responsibility of the recipient. Bullmoney is not responsible for any additional
                          fees charged by customs authorities.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'Returns' && (
                <>
                  <div className="p-4 bg-white/5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <RotateCcw className="w-5 h-5" />
                      <span className="font-medium">30-Day Return Policy</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      We accept returns within 30 days of delivery for a full refund or exchange on most items.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-white font-medium">Return Conditions</h3>
                    <ul className="text-sm text-white/60 space-y-2 list-disc pl-5">
                      <li>Items must be unworn, unwashed, and in their original packaging with all tags attached</li>
                      <li>Items must be returned within 30 days of delivery date</li>
                      <li>Proof of purchase (order confirmation email) is required</li>
                      <li>Items purchased during sales or with discount codes are eligible for exchange or store credit only</li>
                      <li>Gift cards, custom/personalized items, and intimate apparel are non-returnable</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-white font-medium">How to Return</h3>
                    <ol className="text-sm text-white/60 space-y-2 list-decimal pl-5">
                      <li>Email <span className="text-white/80">support@bullmoney.com</span> with your order number and reason for return</li>
                      <li>You will receive a return authorization and shipping label within 2 business days</li>
                      <li>Pack items securely in original packaging and attach the return label</li>
                      <li>Drop off the package at any authorized shipping location</li>
                      <li>Refunds are processed within 5-7 business days after we receive the returned item</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Refund Policy
                    </h3>
                    <p className="text-sm text-white/60">
                      Refunds are issued to the original payment method. Please allow 5-10 business days for the refund
                      to appear on your statement. Shipping costs are non-refundable unless the return is due to a defective
                      or incorrect item. For exchanges, standard shipping on the replacement item is free.
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="text-sm text-white/60">
                        <p className="text-white/80 font-medium mb-1">Damaged or Defective Items</p>
                        <p>If you receive a damaged or defective item, please contact us within 48 hours of delivery
                          with photos of the damage. We will arrange a free replacement or full refund immediately.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'Warranty' && (
                <>
                  <div className="p-4 bg-white/5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Quality Guarantee</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      All Bullmoney products come with a 90-day quality guarantee covering manufacturing defects.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-white font-medium">What's Covered</h3>
                    <ul className="text-sm text-white/60 space-y-2 list-disc pl-5">
                      <li>Manufacturing defects in materials or workmanship</li>
                      <li>Seam failures under normal usage</li>
                      <li>Print fading or peeling within 90 days (apparel)</li>
                      <li>Hardware/accessory defects (zippers, buttons, closures)</li>
                      <li>Tech gear hardware malfunctions within warranty period</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-white font-medium">What's Not Covered</h3>
                    <ul className="text-sm text-white/60 space-y-2 list-disc pl-5">
                      <li>Normal wear and tear, fading, or pilling</li>
                      <li>Damage caused by improper care, washing, or storage</li>
                      <li>Alterations or modifications made to the product</li>
                      <li>Damage from accidents, misuse, or negligence</li>
                    </ul>
                  </div>

                  <div className="text-sm text-white/40 mt-6 pt-4 border-t border-white/10">
                    <p className="font-medium text-white/60 mb-2">Legal Disclaimer</p>
                    <p>
                      Bullmoney provides this warranty in addition to statutory consumer rights applicable in your jurisdiction.
                      This warranty does not affect your legal rights. The warranty is non-transferable and applies only to the
                      original purchaser. Bullmoney's liability under this warranty is limited to the purchase price of the product.
                      All product descriptions and specifications are provided for informational purposes. While we strive for accuracy,
                      colors may appear differently on screens than in person. By making a purchase, you agree to these terms.
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
