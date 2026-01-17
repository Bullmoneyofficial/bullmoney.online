"use client";

/**
 * AnalysisModal.tsx
 * 
 * Trigger component for the Analysis Modal.
 * Works like LiveStreamModal and ProductsModal - renders both
 * a transparent trigger button and uses the centralized UI state.
 * 
 * The actual modal content is rendered by EnhancedAnalysisModal 
 * which is included globally in ClientProviders.tsx
 */

import React, { memo, useCallback, createContext, useContext } from 'react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useAnalysisModalUI } from '@/contexts/UIStateContext';

// Re-export the enhanced modal for direct use
export { EnhancedAnalysisModal } from './analysis-enhanced/EnhancedAnalysisModal';

// Modal Context for internal use (mirrors the pattern in LiveStreamModal/ProductsModal)
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = useContext(ModalContext);
  if (!context) {
    // Fallback to global UI state if not in context (allows standalone usage)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const globalState = useAnalysisModalUI();
    return { isOpen: globalState.isOpen, setIsOpen: globalState.setIsOpen };
  }
  return context;
};

/**
 * AnalysisTrigger - Internal trigger button
 */
const AnalysisTriggerInternal = memo(() => {
  const { setIsOpen } = useModalState();
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[AnalysisTrigger] Click detected, opening modal');
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[AnalysisTrigger] Touch detected, opening modal');
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);
  
  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleTouch}
      onTouchStart={(e) => {
        console.log('[AnalysisTrigger] TouchStart detected');
      }}
      onMouseDown={(e) => {
        console.log('[AnalysisTrigger] MouseDown detected');
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        console.log('[AnalysisTrigger] PointerDown detected');
        e.stopPropagation();
      }}
      className="w-full h-full absolute inset-0 cursor-pointer bg-transparent border-0 outline-none z-[100]"
      style={{ 
        background: 'transparent',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      aria-label="Open Analysis"
    />
  );
});
AnalysisTriggerInternal.displayName = 'AnalysisTriggerInternal';

/**
 * AnalysisModal - Main component that renders the trigger
 * Works like LiveStreamModal - uses context and renders trigger
 */
export const AnalysisModal = memo(() => {
  const { isOpen, setIsOpen } = useAnalysisModalUI();
  
  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      <AnalysisTriggerInternal />
    </ModalContext.Provider>
  );
});
AnalysisModal.displayName = 'AnalysisModal';

// Alias for backwards compatibility
export const AnalysisTrigger = AnalysisModal;

/**
 * Hook to open the analysis modal programmatically
 */
export const useOpenAnalysisModal = () => {
  const { setIsOpen } = useAnalysisModalUI();
  
  return useCallback(() => {
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);
};

// Default export
export default AnalysisModal;
