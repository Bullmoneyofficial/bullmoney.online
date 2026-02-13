<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    /**
     * Handle an incoming request - Allow Next.js frontend to communicate
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Get origin from request
        $origin = $request->header('Origin');
        
        // Allowed origins (localhost, IP addresses, production)
        $allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://192.168.1.163:3000',
            'https://bullmoney.online',
            'https://www.bullmoney.online',
        ];
        
        // Check if origin matches any allowed pattern
        $isAllowed = false;
        foreach ($allowedOrigins as $allowed) {
            if ($origin === $allowed) {
                $isAllowed = true;
                break;
            }
        }
        
        // Also check patterns for any localhost/local IP
        if (!$isAllowed && $origin) {
            if (preg_match('/^http:\/\/localhost:\d+$/', $origin) ||
                preg_match('/^http:\/\/127\.0\.0\.1:\d+$/', $origin) ||
                preg_match('/^http:\/\/192\.168\.\d+\.\d+:\d+$/', $origin) ||
                preg_match('/^http:\/\/10\.\d+\.\d+\.\d+:\d+$/', $origin)) {
                $isAllowed = true;
            }
        }
        
        // Handle preflight OPTIONS request
        if ($request->method() === 'OPTIONS') {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $isAllowed ? $origin : $allowedOrigins[0])
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-CSRF-TOKEN, X-Requested-With')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }
        
        // Process the request
        $response = $next($request);
        
        // Add CORS headers to response
        if ($isAllowed && $origin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        } else {
            $response->headers->set('Access-Control-Allow-Origin', $allowedOrigins[0]);
        }
        
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-CSRF-TOKEN, X-Requested-With');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        
        return $response;
    }
}
