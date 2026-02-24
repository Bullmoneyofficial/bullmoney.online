import { getGlobalThermalState } from '@/hooks/useThermalOptimization';
import { IS_MOBILE } from './perf';

export function getThermalQualityMultiplier(): number {
  const state = getGlobalThermalState();
  if (!state.isPageVisible) return 0.3;
  switch (state.thermalLevel) {
    case 'critical':
      return 0.4;
    case 'hot':
      return 0.6;
    case 'warm':
      return 0.8;
    default:
      return 1.0;
  }
}

export function getThermalDpr(): number {
  const baseDpr = IS_MOBILE ? 1 : Math.min(window.devicePixelRatio ?? 1, 2);
  const multiplier = getThermalQualityMultiplier();
  return Math.max(0.5, baseDpr * multiplier);
}

export function shouldReduceAnimations(): boolean {
  const state = getGlobalThermalState();
  return state.thermalLevel === 'hot' || state.thermalLevel === 'critical' || state.powerSaverActive;
}
