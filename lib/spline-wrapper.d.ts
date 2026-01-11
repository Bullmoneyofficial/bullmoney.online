declare module '@/lib/spline-wrapper' {
  import { ComponentType } from 'react';
  
  export interface SplineWrapperProps {
    scene: string;
    placeholder?: string | null;
    className?: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  }
  
  const SplineWrapper: ComponentType<SplineWrapperProps>;
  export default SplineWrapper;
}
