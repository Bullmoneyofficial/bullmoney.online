<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        \Illuminate\Support\Facades\DB::table('settings')->insert([
            'id' => 1,
            'min_withdraw' => 100,
            'min_payment' => 10,
            'max_payment' => 100000,
            'tech_work' => 0,
            'dice_enabled' => 1,
            'mines_enabled' => 1,
            'wheel_enabled' => 1,
            'jackpot_enabled' => 1,
            'crash_enabled' => 1,
            'coin_enabled' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Seed initial Wheel game
        \Illuminate\Support\Facades\DB::table('wheel')->insert([
            'status' => 0,
            'winner_color' => '',
            'price' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Seed initial Crash game
        $hash = substr(str_shuffle('abcdefghijklmnopqrstuvwxyz1234567890'), 0, 32);
        \Illuminate\Support\Facades\DB::table('crash')->insert([
            'hash' => $hash,
            'status' => 0,
            'multiplier' => 0,
            'profit' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Seed initial Jackpot game
        \Illuminate\Support\Facades\DB::table('jackpot')->insert([
            'game_id' => 1,
            'status' => 0,
            'hash' => md5(rand()),
            'price' => 0,
            'winner_id' => 0,
            'winner_ticket' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
