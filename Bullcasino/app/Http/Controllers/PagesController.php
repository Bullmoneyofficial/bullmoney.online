<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Yajra\DataTables\Datatables;
use App\Models\Withdraws;
use App\Models\Payments;
use App\Models\Settings;
use App\Models\Wheel;
use App\Models\Slots;
use App\Models\WheelBets;

class PagesController extends Controller
{
    public function __construct(Request $r)
    {
        $this->settings = Settings::where('id', 1)->first();
    }
    public function index() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        return view('index');
    }

    public function slots() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        return view('slots');
    }   

    public function bonus() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        return view('bonus');
    }

    public function mines() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        if($this->settings->mines_enabled != 1) return redirect('/')->with('error', 'This game mode is currently unavailable!');
        return view('mines');
    }

    public function dice() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        if($this->settings->dice_enabled != 1) return redirect('/')->with('error', 'This game mode is currently unavailable!');
        return view('dice');
    }

    public function plinko() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        if($this->settings->plinko_enabled != 1) return redirect('/')->with('error', 'This game mode is currently unavailable!');
        return view('plinko');
    }

    public function deposit() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        return view('deposit');
    }

    public function withdraw() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        return view('withdraw');
    }

    public function history(Request $r) {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        return view('history');
    }

    public function referrals() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        $settings = $this->settings;
        return view('referrals', compact('settings'));
    }

    public function wheel() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        $bets = $this->getBets();
        $bank = [$this->getBankForGame('black'), $this->getBankForGame('yellow'), $this->getBankForGame('red'), $this->getBankForGame('green')];
        $history = $this->getHistory();
        if($this->settings->wheel_enabled != 1) return redirect('/')->with('error', 'This game mode is currently unavailable!');
        return view('wheel', compact('bets', 'bank', 'history'));
    }

    public function rules() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        return view('rules');
    }

    public function privacy() {
        if($this->settings->tech_work == 1) return response()->view('errors.techworks', [], 404);
        return view('privacy');
    }

    private function getBets() {
        $game = Wheel::orderBy('id', 'desc')->first();
        if (!$game) {
            return collect();
        }
        $bets = WheelBets::where('wheel_bets.game_id', $game->id)
            ->select('wheel_bets.user_id', DB::raw('SUM(wheel_bets.price) as sum'), 'users.username', 'users.avatar', 'wheel_bets.color', 'wheel_bets.balance')
            ->join('users', 'users.id', '=', 'wheel_bets.user_id')
            ->groupBy('wheel_bets.user_id', 'wheel_bets.color', 'wheel_bets.balance')
            ->orderBy('sum', 'desc')
            ->get();
        return $bets;
    }

    public function getHistory() {
        $query = Wheel::where('status', 2)->select('winner_color', 'id')->orderBy('id','desc')->limit(112)->get();
        return $query;
    }

    public function getBankForGame($color) {
        $game = Wheel::orderBy('id', 'desc')->first();
        if (!$game) {
            return number_format(0, 2, '.', '');
        }
        $bank = WheelBets::where('game_id', $game->id)->where('color', $color)->sum('price');
        return number_format(round($bank, 2), 2, '.', '');
    }
}
