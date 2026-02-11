import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Monitor } from 'lucide-react';
import { BROWSERS } from '@/components/ultimate-hub/constants';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { ModalWrapper } from '@/components/ultimate-hub/modals/ModalWrapper';

export const BrowserModal = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [openingBrowser, setOpeningBrowser] = useState<string | null>(null);

  const handleOpenBrowser = (browserId: string) => {
    const currentUrl = window.location.href;
    const browser = BROWSERS.find(b => b.id === browserId);
    if (!browser) return;
    
    setOpeningBrowser(browserId);
    
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    const isMac = /Macintosh/.test(userAgent);
    
    let deepLinkUrl = '';
    if (isIOS) deepLinkUrl = browser.deepLink.ios(currentUrl);
    else if (isAndroid) deepLinkUrl = browser.deepLink.android(currentUrl);
    else deepLinkUrl = browser.deepLink.desktop(currentUrl);
    
    if (isIOS || isAndroid) {
      window.location.href = deepLinkUrl;
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = isIOS ? browser.iosAppStore : browser.androidPlayStore || browser.downloadUrl;
        }
        setOpeningBrowser(null);
      }, 1500);
    } else {
      if (browserId === 'safari' && isMac) {
        window.open(currentUrl, '_blank');
      } else {
        window.open(browser.downloadUrl, '_blank');
      }
      setOpeningBrowser(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10003] flex items-center justify-center p-5 sm:p-6 bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="w-[90vw] max-w-[320px] bg-white backdrop-blur-xl rounded-2xl border border-black/15 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-black/10 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-black" />
                  <h3 className="text-sm font-bold text-black">Open in Browser</h3>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white hover:bg-white text-black"
                >
                  ✕
                </motion.button>
              </div>
            </div>
            
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto [-webkit-overflow-scrolling:touch]" style={{ touchAction: 'pan-y pan-x', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              {BROWSERS.map((browser, index) => {
                const Icon = browser.icon;
                const isLoading = openingBrowser === browser.id;
                
                return (
                  <motion.button
                    key={browser.id}
                    onClick={() => handleOpenBrowser(browser.id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white hover:from-white/20 hover:to-white/20 text-black font-medium text-xs border border-black/10 hover:border-black/15 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-black/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-black" />
                      </div>
                      <span>{browser.fullName}</span>
                    </div>
                    
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-t-transparent border-black rounded-full"
                      />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-black opacity-50" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
BrowserModal.displayName = 'BrowserModal';
