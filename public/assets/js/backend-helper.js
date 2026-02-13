/**
 * Backend Helper - CSRF Tokens, Error Handling, and Fallback
 * Provides utilities for all game files to communicate with PHP backend
 * Handles Render production and local dev backends automatically
 */

(function(window) {
    'use strict';

    // ========================================================================
    // ENVIRONMENT & CONFIGURATION
    // ========================================================================
    
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isVercel = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('bullmoney') && !isDev;
    
    // Auto-detect backend based on environment
    const BACKEND_CONFIG = {
        primary: isDev ? 'http://localhost:8000' : 'https://bullmoney-casino.onrender.com',
        fallback: 'http://localhost:8000',
        timeout: 10000, // 10 seconds
        retries: 2,
        useProxy: isVercel, // Use Next.js proxy on Vercel
        proxyUrl: '/api/games/proxy' // Next.js API proxy endpoint
    };

    // ========================================================================
    // CSRF TOKEN MANAGEMENT
    // ========================================================================

    const CsrfToken = {
        /**
         * Get CSRF token from meta tag or localStorage
         */
        get: function() {
            // Try meta tag first (from PHP Laravel)
            const metaToken = document.querySelector('meta[name="csrf-token"]');
            if (metaToken) {
                return metaToken.getAttribute('content');
            }
            
            // Fallback to localStorage
            return localStorage.getItem('_token') || '';
        },

        /**
         * Set CSRF token (if we get it from response)
         */
        set: function(token) {
            if (token) {
                localStorage.setItem('_token', token);
            }
        },

        /**
         * Refresh CSRF token from server
         */
        refresh: async function() {
            try {
                const response = await fetch('/csrf-token', { method: 'GET' });
                if (response.ok) {
                    const data = await response.json();
                    if (data.token) {
                        this.set(data.token);
                        return data.token;
                    }
                }
            } catch (err) {
                console.warn('⚠️ Could not refresh CSRF token:', err);
            }
            return this.get();
        }
    };

    // ========================================================================
    // BACKEND HEALTH CHECK
    // ========================================================================

    const BackendHealth = {
        cache: new Map(),
        cacheTimeout: 30000, // 30 seconds

        /**
         * Check if backend is responding
         */
        check: async function(backendUrl) {
            const cacheKey = `health_${backendUrl}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.healthy;
            }

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(backendUrl + '/health', {
                    method: 'GET',
                    signal: controller.signal,
                    credentials: 'include'
                });

                clearTimeout(timeoutId);

                const healthy = response.ok || response.status < 500;
                this.cache.set(cacheKey, { healthy, timestamp: Date.now() });
                return healthy;
            } catch (err) {
                console.warn(`⚠️ Backend ${backendUrl} health check failed:`, err.message);
                this.cache.set(cacheKey, { healthy: false, timestamp: Date.now() });
                return false;
            }
        },

        /**
         * Find a working backend (primary or fallback)
         */
        findWorking: async function() {
            // Check primary backend
            if (await this.check(BACKEND_CONFIG.primary)) {
                return BACKEND_CONFIG.primary;
            }

            // If different from fallback, check it
            if (BACKEND_CONFIG.primary !== BACKEND_CONFIG.fallback) {
                if (await this.check(BACKEND_CONFIG.fallback)) {
                    return BACKEND_CONFIG.fallback;
                }
            }

            // Fallback to primary anyway (will timeout and error gracefully)
            return BACKEND_CONFIG.primary;
        }
    };

    // ========================================================================
    // API REQUEST HANDLER
    // ========================================================================

    const ApiRequest = {
        /**
         * POST request with automatic error handling and retry
         */
        post: async function(endpoint, data = {}, options = {}) {
            const config = {
                timeout: BACKEND_CONFIG.timeout,
                retries: BACKEND_CONFIG.retries,
                silent: false,
                ...options
            };

            // If on Vercel/production, use the Next.js proxy route
            if (BACKEND_CONFIG.useProxy) {
                return await this.postViaProxy(endpoint, data, config);
            }

            let lastError = null;
            let backendUrl = await BackendHealth.findWorking();

            for (let attempt = 0; attempt <= config.retries; attempt++) {
                try {
                    // Add CSRF token to data
                    const postData = {
                        ...data,
                        _token: CsrfToken.get()
                    };

                    // Create request with timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

                    const url = new URL(endpoint, backendUrl).toString();
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: new URLSearchParams(postData),
                        credentials: 'include',
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);

                    // Handle response
                    if (!response.ok && response.status === 419) {
                        // CSRF token expired - refresh and retry
                        console.warn('⚠️ CSRF token expired, refreshing...');
                        await CsrfToken.refresh();
                        continue;
                    }

                    const responseData = await response.json();

                    // Check if backend returned an error
                    if (!response.ok) {
                        lastError = new Error(responseData.msg || `HTTP ${response.status}`);
                        if (response.status >= 500 || response.status === 0) {
                            // Server error, try fallback
                            if (backendUrl === BACKEND_CONFIG.primary && BACKEND_CONFIG.primary !== BACKEND_CONFIG.fallback) {
                                backendUrl = BACKEND_CONFIG.fallback;
                                continue;
                            }
                        }
                        throw lastError;
                    }

                    return {
                        success: true,
                        data: responseData,
                        backend: backendUrl
                    };

                } catch (err) {
                    lastError = err;
                    console.warn(`⚠️ Request attempt ${attempt + 1} failed:`, err.message);

                    if (attempt < config.retries) {
                        // Wait before retry with exponential backoff
                        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
                        
                        // Try fallback backend on next attempt
                        if (backendUrl === BACKEND_CONFIG.primary && BACKEND_CONFIG.primary !== BACKEND_CONFIG.fallback) {
                            backendUrl = BACKEND_CONFIG.fallback;
                        }
                    }
                }
            }

            // All retries failed
            return {
                success: false,
                error: lastError ? lastError.message : 'Request failed after retries',
                backend: backendUrl
            };
        },

        /**
         * POST request via Next.js API proxy (for Vercel)
         * Avoids CORS issues by proxying through same origin
         */
        postViaProxy: async function(endpoint, data = {}, config = {}) {
            const csrfToken = CsrfToken.get();
            
            for (let attempt = 0; attempt <= config.retries; attempt++) {
                try {
                    const proxyUrl = `${BACKEND_CONFIG.proxyUrl}?endpoint=${encodeURIComponent(endpoint)}`;
                    
                    const response = await fetch(proxyUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                        },
                        body: JSON.stringify({
                            ...data,
                            _token: csrfToken
                        })
                    });

                    const result = await response.json();

                    if (!response.ok && response.status === 419) {
                        console.warn('⚠️ CSRF token expired, refreshing...');
                        await CsrfToken.refresh();
                        continue;
                    }

                    if (!result.success && result.status >= 500) {
                        throw new Error(result.error || `HTTP ${result.status}`);
                    }

                    return {
                        success: result.success,
                        data: result.success ? result.data : { error: result.error },
                        backend: result.backend || 'proxy'
                    };
                } catch (err) {
                    console.warn(`⚠️ Proxy attempt ${attempt + 1} failed:`, err.message);
                    
                    if (attempt >= config.retries) {
                        return {
                            success: false,
                            error: err.message,
                            backend: 'proxy'
                        };
                    }
                    
                    // Wait before retry with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
                }
            }
        },

        /**
         * GET request with automatic error handling
         */
        get: async function(endpoint, options = {}) {
            const config = {
                timeout: BACKEND_CONFIG.timeout,
                silent: false,
                ...options
            };

            const backendUrl = await BackendHealth.findWorking();

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);

                const url = new URL(endpoint, backendUrl).toString();

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                return {
                    success: true,
                    data: data,
                    backend: backendUrl
                };

            } catch (err) {
                console.error(`❌ GET request to ${endpoint} failed:`, err.message);
                return {
                    success: false,
                    error: err.message,
                    backend: backendUrl
                };
            }
        }
    };

    // ========================================================================
    // ERROR HANDLER & NOTIFICATIONS
    // ========================================================================

    const ErrorHandler = {
        /**
         * Show user-friendly error message
         */
        show: function(message, duration = 3000) {
            // Try to use game's notification system
            if (typeof showNotification === 'function') {
                showNotification(message, 'error');
                return;
            }

            // Fallback to console and alert
            console.error('❌', message);
            
            // Create temporary error message element
            const errorEl = document.createElement('div');
            errorEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #d32f2f;
                color: white;
                padding: 16px 24px;
                border-radius: 4px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            `;
            errorEl.textContent = '❌ ' + message;
            document.body.appendChild(errorEl);

            setTimeout(() => {
                errorEl.remove();
            }, duration);
        },

        /**
         * Handle API error response
         */
        handle: function(response) {
            if (response.success) {
                return response.data;
            }

            const errorMsg = response.error || 'Request failed';
            
            console.error('❌ Backend Error:', {
                error: errorMsg,
                backend: response.backend
            });

            // Determine if backend is the issue
            if (response.error && response.error.includes('timeout')) {
                this.show('⏱️ Request timeout - Backend may be offline. Try again.');
            } else if (response.error && response.error.includes('CSRF')) {
                this.show('🔒 Session expired. Refreshing...');
            } else {
                this.show('❌ ' + errorMsg);
            }

            return null;
        }
    };

    // ========================================================================
    // EXPORT PUBLIC API
    // ========================================================================

    window.GameBackend = {
        // API calls
        post: ApiRequest.post.bind(ApiRequest),
        get: ApiRequest.get.bind(ApiRequest),

        // CSRF management
        csrf: CsrfToken,

        // Error handling
        error: ErrorHandler,

        // Backend health
        health: BackendHealth,

        // Configuration
        config: BACKEND_CONFIG,

        // Utilities
        log: function(msg) {
            console.log('🎮 [GameBackend]', msg);
        }
    };

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        GameBackend.log('Initialized with backends: ' + BACKEND_CONFIG.primary + ' (primary), ' + BACKEND_CONFIG.fallback + ' (fallback)');
        
        // Set CSRF token from meta tag on startup
        const token = CsrfToken.get();
        if (token) {
            GameBackend.log('CSRF token ready: ' + token.substring(0, 10) + '...');
        }
    });

})(window);
