<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AllowIframeEmbedding
{
    /**
     * Allow the app to be embedded in an iframe from specific origins.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Remove X-Frame-Options to allow iframe embedding
        $response->headers->remove('X-Frame-Options');

        // In dev, allow all frame ancestors for easier testing
        if (app()->environment('local', 'development')) {
            $response->headers->set('Content-Security-Policy', "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* http://192.168.1.162:*");
            return $response;
        }

        // Production: allow only specific origins
        $allowedOrigins = array_filter([
            'https://www.bullmoney.online',
            'https://bullmoney.online',
            'https://www.bullmoney.shop',
            'https://bullmoney.shop',
            env('IFRAME_ALLOWED_ORIGIN'),
        ]);

        $origin = $request->header('Origin') ?? $request->header('Referer');

        if ($origin) {
            foreach ($allowedOrigins as $allowed) {
                if (str_starts_with($origin, $allowed)) {
                    $response->headers->set('Content-Security-Policy', "frame-ancestors {$allowed}");
                    $response->headers->set('Access-Control-Allow-Origin', $allowed);
                    $response->headers->set('Access-Control-Allow-Credentials', 'true');
                    break;
                }
            }
        } else {
            $response->headers->set(
                'Content-Security-Policy',
                'frame-ancestors ' . implode(' ', $allowedOrigins)
            );
        }

        return $response;
    }
}
