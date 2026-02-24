import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Box, X } from 'lucide-react';

import { createSupabaseClient } from '@/lib/supabase';
import { useProductsModalUI, useUltimateHubUI } from '@/contexts/UIStateContext';

import { CyclingBackground } from './background/CyclingBackground';
import { Styles } from './HeroDesktopStyles';

const UltimateHub = dynamic(() => import('@/components/UltimateHub').then(m => ({ default: m.default })), {
  ssr: false,
  loading: () => null,
});
const ProductsSection = dynamic(() => import('@/components/ProductsSection').then(m => ({ default: m.default })), {
  ssr: false,
  loading: () => null,
});

interface HeroProps {
  sources?: string[];
  onOpenModal?: () => void;
  variant?: string;
}

interface LiveStreamVideo {
  id: string;
  title: string;
  youtube_id: string;
  is_live: boolean;
  order_index: number;
}

export default function Hero({ sources, onOpenModal, variant }: HeroProps) {
  const [videos, setVideos] = useState<LiveStreamVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showNewShopModal, setShowNewShopModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use UIStateContext for proper modal management (mutual exclusion)
  const { isUltimateHubOpen, setUltimateHubOpen } = useUltimateHubUI();
  const { isOpen: isProductsModalOpen, setIsOpen: setProductsModalOpen } = useProductsModalUI();

  // Modal handlers
  const handleOpenHub = useCallback(() => {
    setUltimateHubOpen(true);
  }, [setUltimateHubOpen]);

  const handleOpenShop = useCallback(() => {
    setProductsModalOpen(true);
  }, [setProductsModalOpen]);

  const handleOpenNewShop = useCallback(() => {
    setShowNewShopModal(true);
  }, []);

  // Detect desktop vs mobile
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Fetch videos from Supabase livestream_videos table
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const supabase = createSupabaseClient();

        const { data, error } = await supabase
          .from('livestream_videos')
          .select('*')
          .order('is_live', { ascending: false }) // Prioritize live streams
          .order('order_index', { ascending: true });

        if (error) {
          console.error('Error fetching videos:', error);
        } else if (data && data.length > 0) {
          // Normalize is_live to boolean
          const normalizedVideos = data.map(video => ({
            ...video,
            is_live: (video as any).is_live === true || (video as any).is_live === 'true',
          }));
          setVideos(normalizedVideos as any);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const currentVideo = videos[currentVideoIndex];

  // Skip to next video on error
  const handleVideoError = useCallback(() => {
    console.log('Video failed to load, trying next video...');
    setVideoError(true);

    // Try next video after a short delay
    setTimeout(() => {
      setCurrentVideoIndex(prev => {
        const nextIndex = (prev + 1) % videos.length;
        setVideoError(false);
        return nextIndex;
      });
    }, 1000);
  }, [videos.length]);

  // Listen for iframe errors
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log('Video loaded successfully');
      setVideoError(false);
    };

    const handleError = () => {
      console.log('Video iframe error');
      handleVideoError();
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [handleVideoError, currentVideo]);

  // Auto-advance through videos every 3 minutes if not live
  useEffect(() => {
    if (!currentVideo || currentVideo.is_live || videos.length <= 1) return;

    const timer = setTimeout(() => {
      setCurrentVideoIndex(prev => (prev + 1) % videos.length);
    }, 180000); // 3 minutes

    return () => clearTimeout(timer);
  }, [currentVideo, videos.length]);

  const videoId = currentVideo?.youtube_id || 'jfKfPfyJRdk';

  return (
    <>
      <Styles />
      <div className="hero-wrapper">
        {/* Cycling Background Effects - SPLINE FIRST */}
        <CyclingBackground
          reloadsPerCycle={2}
          effects={['spline', 'liquidEther', 'galaxy', 'terminal', 'darkVeil', 'lightPillar', 'letterGlitch', 'gridScan', 'ballpit', 'gridDistortion']}
          videoId={videoId}
          videoLoading={loading}
          videoError={videoError}
          onVideoError={handleVideoError}
          onOpenHub={handleOpenHub}
          onOpenShop={handleOpenShop}
          onOpenNewShop={handleOpenNewShop}
        />
      </div>

      {/* Ultimate Hub - Renders its own backdrop/drawer via UnifiedHubPanel */}
      <UltimateHub />

      {/* Products Modal - Support drawer style */}
      <AnimatePresence>
        {isProductsModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              onClick={() => setProductsModalOpen(false)}
              className="fixed inset-0"
              style={{ zIndex: 2147483648, background: 'rgba(0,0,0,0.2)' }}
            />
            <motion.div
              initial={isDesktop ? { y: '-100%' } : { x: '100%' }}
              animate={isDesktop ? { y: 0 } : { x: 0 }}
              exit={isDesktop ? { y: '-100%' } : { x: '100%' }}
              transition={{ type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
              onClick={e => e.stopPropagation()}
              className={
                isDesktop
                  ? 'fixed top-0 left-0 right-0 w-full bg-white border-b border-black/10 flex flex-col safe-area-inset-bottom max-h-[90vh]'
                  : 'fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-black/10 flex flex-col safe-area-inset-bottom'
              }
              style={{ zIndex: 2147483649, color: '#1d1d1f' }}
              data-apple-section
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10">
                <button
                  onClick={() => setProductsModalOpen(false)}
                  className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-9 w-9 rounded-xl bg-black/5 flex items-center justify-center">
                    <Box className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <h2 className="text-lg md:text-xl font-light">Products</h2>
                </div>

                <button
                  onClick={() => setProductsModalOpen(false)}
                  className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ background: '#0a0a0c' }}>
                <ProductsSection />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Shop Modal */}
      {showNewShopModal && (
        <div className="modal-overlay" onClick={() => setShowNewShopModal(false)}>
          <div className="modal-content modal-content-hub" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowNewShopModal(false)}>
              ×
            </button>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #0a0a0c 0%, #151518 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: '#fff',
                textAlign: 'center',
              }}
            >
              <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: 700 }}>🛒 BullMoney Shop</h2>
              <p
                style={{
                  fontSize: '1.2rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '40px',
                  maxWidth: '500px',
                }}
              >
                Premium trading merchandise, courses, and exclusive VIP access coming soon.
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '30px',
                    width: '200px',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📚</div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Trading Courses</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Coming Soon</p>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '30px',
                    width: '200px',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👕</div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Merch Store</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Coming Soon</p>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '30px',
                    width: '200px',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💎</div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>VIP Membership</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
