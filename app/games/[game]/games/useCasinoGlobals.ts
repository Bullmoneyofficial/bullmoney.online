import { useEffect } from 'react';

export function useCasinoGlobals(game: string) {
  useEffect(() => {
    const casinoBase = '';
    const casinoSocket = '';
    (window as any).client_user = 0;
    (window as any).__BULLCASINO_BASE__ = casinoBase;
    (window as any).__BULLCASINO_SOCKET__ = casinoSocket;
    if (game === 'crash') {
      (window as any).game_active = false;
      (window as any).bet = undefined;
      (window as any).isCashout = undefined;
      (window as any).withdraw = undefined;
    }
  }, [game]);
}
