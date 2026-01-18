declare module '@/lib/spline-wrapper' {
  import { ComponentType } from 'react';
  
  export interface SplineWrapperProps {
    scene: string;
    placeholder?: string | null;
    className?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    /** Set true for hero/above-fold content - enables instant loading */
    priority?: boolean;
    /** Alias for priority - optimizes for hero section with 200ms load target */
    isHero?: boolean;
    /** Optional: cap render FPS for this scene */
    targetFPS?: number;
    /** Optional: cap devicePixelRatio used for canvas resolution */
    maxDpr?: number;
    /** Optional: floor devicePixelRatio used for canvas resolution */
    minDpr?: number;
    /** Callback to receive Spline app instance for external animation control */
    onSplineApp?: (app: any) => void;
    /** Animation progress (0-100) for timeline scrubbing control */
    animationProgress?: number;
  }
  
  const SplineWrapper: ComponentType<SplineWrapperProps>;
  export default SplineWrapper;
}
