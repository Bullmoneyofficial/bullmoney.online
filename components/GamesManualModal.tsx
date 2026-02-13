'use client';

import { memo } from 'react';
import { X, Gamepad2, AlertTriangle, Gift, HelpCircle } from 'lucide-react';

interface GamesManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GamesManualModal = memo(function GamesManualModal({ isOpen, onClose }: GamesManualModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
          style={{ backgroundColor: '#ffffff', color: '#111827', colorScheme: 'light' as const }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">BullMoney Games Manual</h2>
                <p className="text-sm text-gray-500">Demo Entertainment Platform</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto max-h-[calc(85vh-80px)]">
            {/* Important Notice */}
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Demo Only - No Real Money</h3>
                  <p className="text-sm text-yellow-800">
                    All games use virtual play money with no real-world value. This is NOT real gambling.
                    No purchase necessary. 18+ entertainment only.
                  </p>
                </div>
              </div>
            </div>

            {/* How to Play */}
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">How to Play</h3>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Browse available demo games on the main page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Click any game to launch it in full-screen mode</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>All games start with virtual play money automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Use the browser back button or close tab to exit a game</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>No account or registration required to play</span>
                </li>
              </ul>
            </section>

            {/* Support Development */}
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Support Development</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <p className="text-gray-700 mb-3">
                  Your voluntary donations help us obtain proper gaming licenses and keep these demo games free for everyone.
                </p>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Donations are voluntary and non-refundable
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Does NOT grant in-game advantages
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Helps fund licensing & server costs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Tax receipts available upon request
                  </li>
                </ul>
              </div>
            </section>

            {/* Important Rules */}
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Rules</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600 font-semibold text-sm">1</span>
                  <div>
                    <p className="font-medium text-gray-900">Entertainment Only</p>
                    <p className="text-sm text-gray-600">No real money gambling - virtual credits have no cash value</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-semibold text-sm">2</span>
                  <div>
                    <p className="font-medium text-gray-900">Age Requirement</p>
                    <p className="text-sm text-gray-600">Must be 18+ years old to access these games</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600 font-semibold text-sm">3</span>
                  <div>
                    <p className="font-medium text-gray-900">Play Responsibly</p>
                    <p className="text-sm text-gray-600">Take breaks and remember this is just entertainment</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Need Help? */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">For questions, technical issues, or feedback:</p>
                <div className="space-y-2 text-sm">
                  <a href="/community" className="block text-purple-600 hover:text-purple-700 font-medium">
                    → Visit our Community Page
                  </a>
                  <a href="/" className="block text-purple-600 hover:text-purple-700 font-medium">
                    → Back to Main Site
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all active:scale-[0.98]"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
