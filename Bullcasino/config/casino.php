<?php

return [
    
    /*
    |--------------------------------------------------------------------------
    | Demo Mode (CRITICAL - KEEP TRUE FOR LEGAL COMPLIANCE)
    |--------------------------------------------------------------------------
    |
    | IMPORTANT: This MUST remain true unless you have a valid gambling license.
    | Demo mode ensures no real money gambling occurs, making this legal worldwide.
    |
    */
    
    'demo_mode' => env('CASINO_DEMO_MODE', true),
    
    /*
    |--------------------------------------------------------------------------
    | Real Money Features (DISABLED FOR LEGAL COMPLIANCE)
    |--------------------------------------------------------------------------
    |
    | These must remain FALSE until you obtain proper gambling licenses
    | (Curacao, Malta, etc.). Operating without a license is illegal.
    |
    */
    
    'allow_deposits' => false,  // NO real money deposits
    'allow_withdrawals' => false,  // NO real money withdrawals
    'real_money_enabled' => false,  // Demo currency only
    
    /*
    |--------------------------------------------------------------------------
    | Starting Balance (Demo Currency)
    |--------------------------------------------------------------------------
    |
    | Free demo credits given to all new users. This has NO real-world value.
    |
    */
    
    'starting_balance' => env('CASINO_STARTING_BALANCE', 10000),
    
    /*
    |--------------------------------------------------------------------------
    | Bonus Settings (Demo Currency Only)
    |--------------------------------------------------------------------------
    |
    | Bonuses are in demo currency and have NO cash value.
    |
    */
    
    'daily_bonus' => 100,
    'telegram_bonus' => 500,
    'bonus_cooldown' => 300, // 5 minutes
    
    /*
    |--------------------------------------------------------------------------
    | Available Games
    |--------------------------------------------------------------------------
    |
    | All games use demo currency only. No real gambling occurs.
    |
    */
    
    'games' => [
        'dice' => [
            'name' => 'Dice',
            'enabled' => true,
            'min_bet' => 10,
            'max_bet' => 1000,
        ],
        'mines' => [
            'name' => 'Mines',
            'enabled' => true,
            'min_bet' => 10,
            'max_bet' => 500,
        ],
        'wheel' => [
            'name' => 'Roulette Wheel',
            'enabled' => true,
            'min_bet' => 10,
            'max_bet' => 1000,
        ],
        'crash' => [
            'name' => 'Crash',
            'enabled' => true,
            'min_bet' => 10,
            'max_bet' => 1000,
        ],
        'jackpot' => [
            'name' => 'Jackpot',
            'enabled' => true,
            'min_bet' => 50,
            'max_bet' => 2000,
        ],
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Legal Compliance
    |--------------------------------------------------------------------------
    |
    | Disclaimers and age restrictions for legal compliance.
    |
    */
    
    'age_restriction' => 18,
    'legal_disclaimer' => 'Demo games only. No real money gambling. Entertainment purposes only. 18+ only.',
    'restricted_countries' => [], // Add country codes if needed
    
    /*
    |--------------------------------------------------------------------------
    | Site Information
    |--------------------------------------------------------------------------
    |
    */
    
    'site_name' => 'BullMoney Games',
    'site_url' => env('APP_URL', 'https://bullmoney.shop'),
    'support_email' => env('SUPPORT_EMAIL', 'support@bullmoney.shop'),

];
