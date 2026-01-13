import { useState, useEffect, useMemo } from 'react';
import { detectBrowser } from '@/lib/browserDetection';

// --- Type Definitions (Consolidated and Corrected) ---

/**
 * Defines the structure for a single live ticker item.
 * Note: Your original definition TickerData was redundant.
 */
export type LiveTickerItem = { 
    symbol: string; 
    price: number; 
    change: number; // Percentage change in the last 24 hours
};

/**
 * Defines the array structure returned by the hook.
 */
export type TickerDataArray = LiveTickerItem[]; 

// --- The Custom Hook ---

/**
 * Custom hook to connect to Binance WebSocket for real-time price updates 
 * for a predefined list of crypto pairs (BTC, ETH, SOL).
 * @returns {TickerDataArray} An array of live ticker data objects.
 */
export const useBinanceTicker = (): TickerDataArray => {
    // State to hold the live data array
    const [liveData, setLiveData] = useState<TickerDataArray>([]);
    
    // Define the specific symbols you want to track
    const symbols = useMemo(() => ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'], []);

    useEffect(() => {
        // Check browser capabilities for WebSocket
        const browserInfo = detectBrowser();
        if (!browserInfo.canHandleWebSocket) {
            console.log('[useBinanceTicker] WebSocket disabled for:', browserInfo.browserName);
            // Return fallback static data for in-app browsers
            setLiveData([
                { symbol: 'BTC', price: 67500, change: 2.5 },
                { symbol: 'ETH', price: 3450, change: 1.8 },
                { symbol: 'SOL', price: 145, change: 3.2 },
            ]);
            return;
        }
        
        let ws: WebSocket | null = null;
        
        try {
            // Connect to the Binance 24hr ticker stream for all pairs
            ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr'); 
            
            ws.onopen = () => {
                console.log('Binance WebSocket Connected.');
            };

            ws.onmessage = (event) => {
                try {
                    const tickers: any[] = JSON.parse(event.data);
                    
                    if (Array.isArray(tickers)) {
                        // Filter and map the raw data to match the LiveTickerItem structure
                        const filteredData: TickerDataArray = tickers
                            .filter(t => symbols.includes(t.s)) // Filter for specific symbols
                            .map(t => ({
                                // Remove 'USDT' for clean display
                                symbol: t.s.replace('USDT', ''), 
                                // Current price (c)
                                price: parseFloat(t.c),        
                                // Percentage change (P)
                                change: parseFloat(t.P),        
                            }));
                        
                        setLiveData(filteredData);
                    }
                } catch (e) {
                    // Silent fail on parse error
                }
            };

            ws.onerror = (error) => {
                console.error('Binance WebSocket Error:', error);
                // Set fallback data on error
                setLiveData([
                    { symbol: 'BTC', price: 67500, change: 2.5 },
                    { symbol: 'ETH', price: 3450, change: 1.8 },
                    { symbol: 'SOL', price: 145, change: 3.2 },
                ]);
            };

            ws.onclose = () => {
                console.log('Binance WebSocket Disconnected.');
                // Implement reconnection logic here if needed
            };
        } catch (e) {
            console.error('Failed to create WebSocket:', e);
            // Set fallback data on WebSocket creation failure
            setLiveData([
                { symbol: 'BTC', price: 67500, change: 2.5 },
                { symbol: 'ETH', price: 3450, change: 1.8 },
                { symbol: 'SOL', price: 145, change: 3.2 },
            ]);
        }

        // Cleanup function: close the WebSocket connection when the component unmounts
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.close();
                } catch (e) {
                    // Silent fail
                }
            }
        };
    }, [symbols]); // Dependency array includes symbols

    return liveData;
};