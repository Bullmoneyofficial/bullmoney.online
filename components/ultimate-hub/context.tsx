import { createContext, useContext } from 'react';
import type { HubContextType } from './types';

export const HubContext = createContext<HubContextType | null>(null);

export const useHub = () => {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used within HubProvider');
  return ctx;
};
