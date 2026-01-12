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
  }
  
  const SplineWrapper: ComponentType<SplineWrapperProps>;
  export default SplineWrapper;
}
