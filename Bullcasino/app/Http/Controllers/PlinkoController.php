<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Payments;
use App\Models\Withdraws;
use App\Models\Settings;
use App\Models\Plinko;

class PlinkoController extends Controller
{
    public function play(Request $r) {
        $settings = Settings::where('id', 1)->first();
        
        if($settings->plinko_enabled != 1) {
            return response()->json(['type' => 'error', 'msg' => 'This game mode is currently unavailable!']);
        }
        
        $bet = $r->bet;
        $rows = $r->rows ?? 16; // Default to 16 rows
        $balance = Auth::user()->balance;
        $dep_wager = Auth::user()->wager;
        $user_id = Auth::user()->id;

        // Validation
        if($bet > $balance) {
            return response()->json(['type' => 'error', 'msg' => 'Insufficient funds']);
        }
        
        if($bet < 1 || !is_numeric($bet)) {
            return response()->json(['type' => 'error', 'msg' => 'Minimum bet amount is 1!']);
        }
        
        if(!in_array($rows, [8, 12, 16])) {
            return response()->json(['type' => 'error', 'msg' => 'Invalid number of rows']);
        }

        // Plinko multipliers based on rows
        $multipliers = $this->getMultipliers($rows);
        
        // Simulate ball drop - binomial distribution
        $position = $this->simulateDrop($rows);
        $multiplier = $multipliers[$position];
        
        // Calculate winnings
        $winAmount = $bet * $multiplier;
        $profit = $winAmount - $bet;
        
        // Check user profit for fairness adjustment
        $userdep = Payments::where('user_id', Auth::user()->id)->where('status', 1)->sum('amount');
        $userwith = Withdraws::where('user_id', Auth::user()->id)->where('status', 1)->sum('amount');
        $userProfit = Auth::user()->balance - ($userdep - $userwith);
        
        // Apply house edge adjustment for profitable players
        if($userProfit > 0 && rand(1, 100) < 35) {
            // Slightly adjust position for house edge
            $centerPosition = floor($rows / 2);
            if(abs($position - $centerPosition) > 3) {
                $position = $this->adjustPosition($position, $centerPosition, $rows);
                $multiplier = $multipliers[$position];
                $winAmount = $bet * $multiplier;
                $profit = $winAmount - $bet;
            }
        }
        
        // Update balance and wager
        $upd_balance = $balance + $profit;
        
        if($multiplier <= 2.0) {
            $dep_wager -= abs($profit);
        }
        
        if($upd_balance < 1 || $dep_wager < 0) {
            $dep_wager = 0;
        }
        
        User::where('id', $user_id)->update([
            'balance' => $upd_balance,
            'wager' => $dep_wager
        ]);
        // Save game record
        Plinko::create([
            'user_id' => $user_id,
            'bet' => $bet,
            'rows' => $rows,
            'position' => $position,
            'multiplier' => $multiplier,
            'win' => $winAmount
        ]);
        
        
        return response()->json([
            'type' => 'success',
            'balance' => $upd_balance,
            'position' => $position,
            'multiplier' => $multiplier,
            'win' => $winAmount,
            'profit' => $profit,
            'rows' => $rows
        ]);
    }
    
    private function getMultipliers($rows) {
        // Multiplier tables for different row counts
        $multiplierTables = [
            8 => [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
            12 => [10.0, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10.0],
            16 => [16.0, 9.0, 2.0, 1.4, 1.3, 1.1, 1.0, 0.5, 0.3, 0.5, 1.0, 1.1, 1.3, 1.4, 2.0, 9.0, 16.0]
        ];
        
        return $multiplierTables[$rows];
    }
    
    private function simulateDrop($rows) {
        // Use binomial distribution - count number of right moves
        $rightMoves = 0;
        for($i = 0; $i < $rows; $i++) {
            if(rand(0, 1) == 1) {
                $rightMoves++;
            }
        }
        return $rightMoves;
    }
    
    private function adjustPosition($position, $center, $rows) {
        // Move position slightly towards center
        if($position < $center) {
            return min($position + 1, $rows);
        } else {
            return max($position - 1, 0);
        }
    }
}
