import { useState, useRef } from 'react';

/**
 * Manages core page state (stage, navigation, UI visibility)
 */
export function usePageState() {
  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false);
  const [activePage, setActivePage] = useState<number>(1);
  const [modalData, setModalData] = useState<any>(null);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [hasSeenHold, setHasSeenHold] = useState(false);

  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sessionRestoredRef = useRef(false);
  const orientationDismissedRef = useRef(false);

  return {
    currentStage,
    setCurrentStage,
    isClient,
    setIsClient,
    activePage,
    setActivePage,
    modalData,
    setModalData,
    showOrientationWarning,
    setShowOrientationWarning,
    contentMounted,
    setContentMounted,
    hasRegistered,
    setHasRegistered,
    hasSeenIntro,
    setHasSeenIntro,
    hasSeenHold,
    setHasSeenHold,
    pageRefs,
    observerRef,
    scrollContainerRef,
    sessionRestoredRef,
    orientationDismissedRef,
  };
}
