'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler } from 'lucide-react';

// ============================================================================
// SIZE GUIDE MODAL - Apparel Sizing Reference
// ============================================================================

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string; // 'tops', 'bottoms', 'shoes'
}

const SIZE_TABS = ['Tops / Hoodies', 'Bottoms', 'Hats'] as const;
type SizeTab = typeof SIZE_TABS[number];

const TOPS_SIZES = [
  { size: 'XS', chest: '32-34"', waist: '26-28"', length: '26"', eu: '44', uk: '34' },
  { size: 'S', chest: '34-36"', waist: '28-30"', length: '27"', eu: '46', uk: '36' },
  { size: 'M', chest: '38-40"', waist: '30-32"', length: '28"', eu: '48-50', uk: '38-40' },
  { size: 'L', chest: '42-44"', waist: '34-36"', length: '29"', eu: '52', uk: '42' },
  { size: 'XL', chest: '46-48"', waist: '38-40"', length: '30"', eu: '54', uk: '44' },
  { size: '2XL', chest: '50-52"', waist: '42-44"', length: '31"', eu: '56', uk: '46' },
  { size: '3XL', chest: '54-56"', waist: '46-48"', length: '32"', eu: '58-60', uk: '48-50' },
];

const BOTTOMS_SIZES = [
  { size: 'XS', waist: '26-28"', hip: '34-36"', inseam: '30"', eu: '36', uk: '6-8' },
  { size: 'S', waist: '28-30"', hip: '36-38"', inseam: '30"', eu: '38', uk: '8-10' },
  { size: 'M', waist: '30-32"', hip: '38-40"', inseam: '31"', eu: '40-42', uk: '10-12' },
  { size: 'L', waist: '34-36"', hip: '42-44"', inseam: '32"', eu: '44', uk: '14' },
  { size: 'XL', waist: '38-40"', hip: '46-48"', inseam: '32"', eu: '46', uk: '16' },
  { size: '2XL', waist: '42-44"', hip: '50-52"', inseam: '33"', eu: '48-50', uk: '18-20' },
];

const HAT_SIZES = [
  { size: 'S', circ: '21.25"', cm: '54 cm' },
  { size: 'M', circ: '22"', cm: '56 cm' },
  { size: 'L', circ: '22.75"', cm: '58 cm' },
  { size: 'XL', circ: '23.5"', cm: '60 cm' },
  { size: 'One Size', circ: '21-23.5"', cm: '54-60 cm' },
];

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<SizeTab>('Tops / Hoodies');
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  const toCm = (inches: string) => {
    return inches.replace(/(\d+\.?\d*)/g, (_, num) => (parseFloat(num) * 2.54).toFixed(1));
  };

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
            className="relative w-full max-w-3xl max-h-[85vh] bg-black border border-white/10 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black">
              <div className="flex items-center gap-3">
                <Ruler className="w-5 h-5 text-white/60" />
                <h2 className="text-xl font-semibold text-white">Size Guide</h2>
              </div>
              <div className="flex items-center gap-3">
                {/* Unit Toggle */}
                <div className="flex h-8 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                  <button
                    onClick={() => setUnit('in')}
                    className={`px-3 text-xs font-medium transition-colors ${
                      unit === 'in' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    IN
                  </button>
                  <button
                    onClick={() => setUnit('cm')}
                    className={`px-3 text-xs font-medium transition-colors ${
                      unit === 'cm' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    CM
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {SIZE_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors relative
                    ${activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/70'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="size-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activeTab === 'Tops / Hoodies' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Size</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Chest</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Waist</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Length</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">EU</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">UK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOPS_SIZES.map((row) => (
                        <tr key={row.size} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-medium text-white">{row.size}</td>
                          <td className="py-3 px-3 text-white/70">{unit === 'cm' ? toCm(row.chest) : row.chest}</td>
                          <td className="py-3 px-3 text-white/70">{unit === 'cm' ? toCm(row.waist) : row.waist}</td>
                          <td className="py-3 px-3 text-white/70">{unit === 'cm' ? toCm(row.length) : row.length}</td>
                          <td className="py-3 px-3 text-white/70">{row.eu}</td>
                          <td className="py-3 px-3 text-white/70">{row.uk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'Bottoms' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Size</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Waist</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Hip</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Inseam</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">EU</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">UK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BOTTOMS_SIZES.map((row) => (
                        <tr key={row.size} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-medium text-white">{row.size}</td>
                          <td className="py-3 px-3 text-white/70">{unit === 'cm' ? toCm(row.waist) : row.waist}</td>
                          <td className="py-3 px-3 text-white/70">{unit === 'cm' ? toCm(row.hip) : row.hip}</td>
                          <td className="py-3 px-3 text-white/70">{unit === 'cm' ? toCm(row.inseam) : row.inseam}</td>
                          <td className="py-3 px-3 text-white/70">{row.eu}</td>
                          <td className="py-3 px-3 text-white/70">{row.uk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'Hats' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Size</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Head Circumference</th>
                        <th className="text-left py-3 px-3 text-white/60 font-medium">Metric</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HAT_SIZES.map((row) => (
                        <tr key={row.size} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-medium text-white">{row.size}</td>
                          <td className="py-3 px-3 text-white/70">{row.circ}</td>
                          <td className="py-3 px-3 text-white/70">{row.cm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* How to Measure */}
              <div className="mt-8 p-4 bg-white/5 rounded-xl space-y-3">
                <h3 className="text-white font-medium">How to Measure</h3>
                <div className="text-sm text-white/60 space-y-2">
                  <p><strong className="text-white/80">Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</p>
                  <p><strong className="text-white/80">Waist:</strong> Measure around your natural waistline, keeping the tape comfortably loose.</p>
                  <p><strong className="text-white/80">Hip:</strong> Measure around the fullest part of your hips.</p>
                  <p><strong className="text-white/80">Inseam:</strong> Measure from crotch to ankle bone along the inside of your leg.</p>
                  <p><strong className="text-white/80">Head:</strong> Wrap tape around the widest part of your head, above ears and eyebrows.</p>
                </div>
                <p className="text-xs text-white/40 mt-3">
                  Tip: If you&apos;re between sizes, we recommend sizing up for a more relaxed fit.
                  Our apparel uses a &quot;streetwear-cut&quot; which is slightly oversized.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
