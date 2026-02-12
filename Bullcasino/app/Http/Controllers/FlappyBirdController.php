<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Payments;
use App\Models\Withdraws;
use App\Models\FlappyBird;
use App\Models\Settings;

class FlappyBirdController extends Controller
{
    /**
     * Submit game result
     */
    public function result(Request $request)
    {
        $settings = Settings::where('id', 1)->first();
        
        // Check if game is enabled
        if (!isset($settings->flappybird_enabled) || $settings->flappybird_enabled != 1) {
            return response()->json([
                'error' => true,
                'msg' => 'Flappy Bird is currently unavailable!'
            ]);
        }

        // Validate request
        $request->validate([
            'bet' => 'required|numeric|min:1',
            'multiplier' => 'required|numeric|min:0',
            'score' => 'required|integer|min:0',
            'won' => 'required|boolean',
            'amount' => 'required|numeric|min:0'
        ]);

        $bet = $request->bet;
        $multiplier = $request->multiplier;
        $score = $request->score;
        $won = $request->won;
        $amount = $request->amount;

        // Get user
        DB::beginTransaction();
        $user = User::where('id', Auth::id())->lockForUpdate()->first();

        if (!$user) {
            DB::rollBack();
            return response()->json([
                'error' => true,
                'msg' => 'User not found'
            ]);
        }

        // Check if user has sufficient balance (bet should have been deducted already)
        // For this implementation, we assume the bet was deducted when starting
        // If you want to deduct here, uncomment the following:
        // if ($user->balance < $bet) {
        //     DB::rollBack();
        //     return response()->json([
        //         'error' => true,
        //         'msg' => 'Insufficient funds'
        //     ]);
        // }

        // Validate multiplier vs score (0.1x per pipe, starting at 1.0x)
        $expectedMultiplier = 1.0 + ($score * 0.1);
        $tolerance = 0.2; // Allow some tolerance for timing/rounding
        
        if (abs($multiplier - $expectedMultiplier) > $tolerance) {
            DB::rollBack();
            return response()->json([
                'error' => true,
                'msg' => 'Invalid multiplier for score'
            ]);
        }

        // Validate win amount
        $expectedAmount = round($bet * $multiplier, 2);
        if (abs($amount - $expectedAmount) > 0.1) {
            DB::rollBack();
            return response()->json([
                'error' => true,
                'msg' => 'Invalid win amount'
            ]);
        }

        // Anti-minus system - similar to other games
        $userdep = Payments::where('user_id', $user->id)
            ->where('status', '!=', 2)
            ->sum('amount');
        
        $userwith = Withdraws::where('user_id', $user->id)
            ->where('status', '!=', 2)
            ->sum('amount');
        
        $with_today = Withdraws::where('status', '!=', 2)
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');
        
        $pay_today = Payments::where('status', '!=', 0)
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');

        $profit = ($userdep - $userwith) - $user->balance;

        // Calculate house edge chance
        $houseChance = 10;
        
        if (($with_today + $user->balance) > ($pay_today * 1.2)) {
            $houseChance = 15;
        } else {
            if ($user->balance < 0.99) {
                $houseChance = 15;
            }
            if ($userwith > $userdep) {
                $houseChance = 15;
                if ($userwith > ($userdep * 1.2)) {
                    $houseChance = 20;
                }
            }
        }

        // Apply house edge for high scores/multipliers
        if ($score >= 20 && $multiplier >= 3.0) {
            $forceLoss = rand(0, 100) < $houseChance;
            if ($forceLoss) {
                $won = false;
                $amount = 0;
                $multiplier = 0;
            }
        }

        // Calculate final balance
        $finalBalance = $user->balance;
        $dep_wager = $user->wager;

        if ($won && $amount > 0) {
            // Win - add winnings
            $finalBalance += $amount;
            
            // Update wager if multiplier is significant
            if ($multiplier >= 1.3 && $dep_wager > 0) {
                $dep_wager -= $bet;
                if ($dep_wager < 0) {
                    $dep_wager = 0;
                }
            }
        } else {
            // Loss - deduct bet (if not already deducted)
            // Since we're recording the result, assume bet was taken at start
            $dep_wager -= $bet;
            if ($dep_wager < 0 || $finalBalance < 1) {
                $dep_wager = 0;
            }
        }

        // Update user balance and wager
        $user->balance = $finalBalance;
        $user->wager = $dep_wager;
        $user->save();

        // Record game in database
        FlappyBird::create([
            'user_id' => $user->id,
            'bet' => $bet,
            'multiplier' => $multiplier,
            'score' => $score,
            'won' => $won,
            'win_amount' => $amount,
            'status' => $won ? 'win' : 'loss'
        ]);

        DB::commit();

        return response()->json([
            'error' => false,
            'msg' => $won ? "You won " . number_format($amount, 2) . "!" : "Better luck next time!",
            'balance' => $finalBalance,
            'won' => $won,
            'amount' => $amount
        ]);
    }

    /**
     * Get leaderboard
     */
    public function leaderboard()
    {
        $leaderboard = FlappyBird::select(
                'users.username',
                DB::raw('MAX(flappy_bird.score) as score'),
                DB::raw('MAX(flappy_bird.multiplier) as best_multiplier')
            )
            ->join('users', 'flappy_bird.user_id', '=', 'users.id')
            ->where('flappy_bird.created_at', '>=', Carbon::today())
            ->groupBy('users.id', 'users.username')
            ->orderBy('score', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'leaderboard' => $leaderboard
        ]);
    }

    /**
     * Get user stats
     */
    public function stats()
    {
        $user = Auth::user();
        
        $stats = [
            'total_games' => FlappyBird::where('user_id', $user->id)->count(),
            'total_wins' => FlappyBird::where('user_id', $user->id)->where('won', true)->count(),
            'total_losses' => FlappyBird::where('user_id', $user->id)->where('won', false)->count(),
            'highest_score' => FlappyBird::where('user_id', $user->id)->max('score') ?? 0,
            'highest_multiplier' => FlappyBird::where('user_id', $user->id)->max('multiplier') ?? 1.0,
            'total_wagered' => FlappyBird::where('user_id', $user->id)->sum('bet'),
            'total_won' => FlappyBird::where('user_id', $user->id)->where('won', true)->sum('win_amount'),
            'win_rate' => 0
        ];

        if ($stats['total_games'] > 0) {
            $stats['win_rate'] = round(($stats['total_wins'] / $stats['total_games']) * 100, 2);
        }

        return response()->json($stats);
    }

    /**
     * Get recent games
     */
    public function history(Request $request)
    {
        $limit = $request->input('limit', 20);
        
        $games = FlappyBird::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'games' => $games
        ]);
    }

    /**
     * Start a new game (deduct bet)
     */
    public function start(Request $request)
    {
        $settings = Settings::where('id', 1)->first();
        
        // Check if game is enabled
        if (!isset($settings->flappybird_enabled) || $settings->flappybird_enabled != 1) {
            return response()->json([
                'error' => true,
                'msg' => 'Flappy Bird is currently unavailable!'
            ]);
        }

        // Validate bet
        $request->validate([
            'bet' => 'required|numeric|min:1|max:10000'
        ]);

        $bet = $request->bet;

        DB::beginTransaction();
        $user = User::where('id', Auth::id())->lockForUpdate()->first();

        if (!$user) {
            DB::rollBack();
            return response()->json([
                'error' => true,
                'msg' => 'User not found'
            ]);
        }

        // Check balance
        if ($user->balance < $bet) {
            DB::rollBack();
            return response()->json([
                'error' => true,
                'msg' => 'Insufficient funds'
            ]);
        }

        // Deduct bet
        $user->balance -= $bet;
        $user->save();

        DB::commit();

        return response()->json([
            'error' => false,
            'msg' => 'Game started! Good luck!',
            'balance' => $user->balance
        ]);
    }

    /**
     * View game page
     */
    public function index()
    {
        return view('flappybird');
    }
}
