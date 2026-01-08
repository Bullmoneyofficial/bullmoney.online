import { useState, useRef } from 'react';

/**
 * Manages UI overlay and modal states
 */
export function useUIState() {
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [showThemeQuickPick, setShowThemeQuickPick] = useState(false);
  const [showEdgeSwipeHints, setShowEdgeSwipeHints] = useState(false);
  const [showPerfPrompt, setShowPerfPrompt] = useState(false);
  const [swipeIndicator, setSwipeIndicator] = useState<'left' | 'right' | null>(null);
  const [perfToast, setPerfToast] = useState<{message: string; type: 'success' | 'info' | 'warning'} | null>(null);

  const edgeHintsShownRef = useRef(false);
  const controlCenterThemeRef = useRef<HTMLDivElement | null>(null);
  const perfPromptTimeoutRef = useRef<number | null>(null);

  return {
    showConfigurator,
    setShowConfigurator,
    faqOpen,
    setFaqOpen,
    infoPanelOpen,
    setInfoPanelOpen,
    controlCenterOpen,
    setControlCenterOpen,
    showThemeQuickPick,
    setShowThemeQuickPick,
    showEdgeSwipeHints,
    setShowEdgeSwipeHints,
    showPerfPrompt,
    setShowPerfPrompt,
    swipeIndicator,
    setSwipeIndicator,
    perfToast,
    setPerfToast,
    edgeHintsShownRef,
    controlCenterThemeRef,
    perfPromptTimeoutRef,
  };
}
