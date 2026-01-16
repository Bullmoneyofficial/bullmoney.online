"use client";

import { useEffect, useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';

export default function YouTubeCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash fragment (contains access_token for implicit flow)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');
        const tokenType = params.get('token_type');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        if (!accessToken) {
          throw new Error('No access token received');
        }

        // Fetch user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userInfo = await userInfoResponse.json();

        // Get YouTube channel info
        let channelId = null;
        try {
          const channelResponse = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            }
          );
          
          if (channelResponse.ok) {
            const channelData = await channelResponse.json();
            channelId = channelData.items?.[0]?.id || null;
          }
        } catch (e) {
          console.warn('Could not fetch YouTube channel:', e);
        }

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'YOUTUBE_AUTH_SUCCESS',
            accessToken,
            expiresIn: parseInt(expiresIn || '3600'),
            tokenType,
            user: {
              name: userInfo.name,
              email: userInfo.email,
              picture: userInfo.picture,
              channelId
            }
          }, window.location.origin);
        }

        setStatus('success');
        
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (err) {
        console.error('YouTube auth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
        
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'YOUTUBE_AUTH_ERROR',
            error: err instanceof Error ? err.message : 'Authentication failed'
          }, window.location.origin);
        }
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">Connecting to YouTube</h2>
            <p className="text-neutral-400 text-sm">Please wait while we complete the authentication...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Connected Successfully!</h2>
            <p className="text-neutral-400 text-sm">You can now close this window and watch your YouTube videos.</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm hover:bg-neutral-700 transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
