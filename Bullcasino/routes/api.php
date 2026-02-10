<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CrashController;
use App\Http\Controllers\JackpotController;
use App\Http\Controllers\WheelController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Crash game API (called by Node.js socket server)
Route::post('/crash/init', [CrashController::class, 'init']);
Route::post('/crash/slider', [CrashController::class, 'startSlider']);
Route::post('/crash/newGame', [CrashController::class, 'newGame']);

// Jackpot game API (called by Node.js socket server)
Route::post('/jackpot/getSlider', [JackpotController::class, 'getSlider']);
Route::post('/jackpot/newGame', [JackpotController::class, 'newGame']);
Route::post('/jackpot/getStatus', [JackpotController::class, 'getStatus']);
Route::post('/jackpot/setStatus', [JackpotController::class, 'setStatus']);

// Wheel game API (called by Node.js socket server)
Route::post('/wheel/close', [WheelController::class, 'close']);
Route::post('/wheel/end', [WheelController::class, 'end']);
Route::post('/wheel/open', function () {
    return response()->json(['success' => true]);
});
Route::post('/wheel/start', function () {
    return response()->json(['success' => true]);
});
