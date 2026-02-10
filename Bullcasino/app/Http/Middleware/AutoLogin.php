<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Str;

class AutoLogin
{
    /**
     * Automatically log in every visitor as a guest user.
     * This removes all login requirements so games are free to play.
     */
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            // Find or create the default guest player
            $user = User::where('username', 'Player')->first();
            if (!$user) {
                $user = User::create([
                    'username' => 'Player',
                    'password' => bcrypt(Str::random(32)),
                    'avatar' => '/assets/images/no-avatar.png',
                    'balance' => 10000,
                    'wager' => 0,
                    'admin' => 0,
                    'ban' => 0,
                    'ref_code' => Str::random(8),
                    'rank' => 0,
                ]);
            }
            Auth::login($user);
        }

        return $next($request);
    }
}
