# 🎮 Flappy Bird - Laravel Backend Integration Guide

## 📁 PHP/Laravel Files Created

### 1. **FlappyBirdController.php**
Location: `/Bullcasino/app/Http/Controllers/FlappyBirdController.php`

**Methods:**
- `result()` - Submit game result, calculate winnings, update balance
- `leaderboard()` - Get today's top 10 players
- `stats()` - Get user statistics
- `history()` - Get user's recent games
- `start()` - Start new game, deduct bet
- `index()` - Display game page

**Features:**
- Anti-minus system (house edge protection)
- Wager tracking
- Balance management
- Score validation
- Multiplier verification

### 2. **FlappyBird.php Model**
Location: `/Bullcasino/app/Models/FlappyBird.php`

**Database Fields:**
- `user_id` - Foreign key to users table
- `bet` - Bet amount (decimal 10,2)
- `multiplier` - Final multiplier (decimal 10,2)
- `score` - Number of pipes passed
- `won` - Boolean win/loss flag
- `win_amount` - Actual winnings (decimal 10,2)
- `status` - Game status (playing/win/loss)
- `timestamps` - Created/updated timestamps

### 3. **Migration File**
Location: `/Bullcasino/database/migrations/2024_02_12_000001_create_flappy_bird_table.php`

**Creates:**
- `flappy_bird` table with proper indexes
- `flappybird_enabled` column in settings table

**Indexes:**
- user_id
- created_at
- user_id + score (for leaderboards)
- user_id + won (for statistics)

### 4. **Routes**
Location: `/Bullcasino/routes/web.php`

**Added Routes:**
```php
// Page route
Route::get('/flappybird', [FlappyBirdController::class, 'index'])->name('flappybird');

// API routes
Route::group(['prefix' => '/flappybird'], function () {
    Route::post('/start', [FlappyBirdController::class, 'start']);
    Route::post('/result', [FlappyBirdController::class, 'result']);
    Route::get('/leaderboard', [FlappyBirdController::class, 'leaderboard']);
    Route::get('/stats', [FlappyBirdController::class, 'stats']);
    Route::get('/history', [FlappyBirdController::class, 'history']);
});
```

## 🔄 Integration Flow

### Game Start Flow
```
1. User clicks "Start Game"
2. JS validates bet amount
3. POST /flappybird/start
   - Controller deducts bet from balance
   - Returns new balance
4. JS updates UI and starts game
5. Bird starts flying
```

### Gameplay Flow
```
1. User taps to flap
2. Bird navigates through pipes
3. Each pipe passed:
   - Score +1
   - Multiplier +0.1x
   - Potential win calculated
```

### Game End Flow (Crash)
```
1. Bird hits pipe or ground
2. JS calculates final stats
3. POST /flappybird/result
   - bet: original bet amount
   - multiplier: final multiplier
   - score: pipes passed
   - won: false
   - amount: 0
4. Controller validates & records
5. Updates wager tracking
6. Returns new balance
```

### Cash Out Flow (Win)
```
1. User clicks "Cash Out"
2. JS calculates winnings
3. POST /flappybird/result
   - bet: original bet amount
   - multiplier: current multiplier
   - score: pipes passed
   - won: true
   - amount: bet × multiplier
4. Controller validates:
   - Score vs multiplier check
   - Amount calculation verification
   - Anti-minus system application
5. Credits account
6. Records game
7. Returns new balance
```

## 🛡️ Security Features

### Anti-Minus System
The controller implements house edge protection similar to other games:

```php
// Calculate player profit
$profit = ($userdep - $userwith) - $user->balance;

// Determine house edge chance
$houseChance = 10; // Base 10%

// Increase chance if player is winning too much
if (withdrawals + balance > deposits * 1.2) {
    $houseChance = 15;
}

// Force loss for high scores/multipliers
if ($score >= 20 && $multiplier >= 3.0) {
    $shouldLose = rand(0, 100) < $houseChance;
}
```

### Score Validation
```php
// Expected multiplier: 1.0 + (score × 0.1)
$expectedMultiplier = 1.0 + ($score * 0.1);
$tolerance = 0.2; // Allow rounding

if (abs($multiplier - $expectedMultiplier) > $tolerance) {
    return error('Invalid multiplier for score');
}
```

### Amount Verification
```php
$expectedAmount = round($bet * $multiplier, 2);
if (abs($amount - $expectedAmount) > 0.1) {
    return error('Invalid win amount');
}
```

## 📊 Database Schema

```sql
CREATE TABLE `flappy_bird` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `bet` decimal(10,2) NOT NULL,
  `multiplier` decimal(10,2) DEFAULT '1.00',
  `score` int NOT NULL DEFAULT '0',
  `won` tinyint(1) DEFAULT '0',
  `win_amount` decimal(10,2) DEFAULT '0.00',
  `status` varchar(20) DEFAULT 'playing',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `flappy_bird_user_id_index` (`user_id`),
  KEY `flappy_bird_created_at_index` (`created_at`),
  KEY `flappy_bird_user_id_score_index` (`user_id`,`score`),
  KEY `flappy_bird_user_id_won_index` (`user_id`,`won`),
  CONSTRAINT `flappy_bird_user_id_foreign` 
    FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) 
    ON DELETE CASCADE
);

ALTER TABLE `settings` 
ADD COLUMN `flappybird_enabled` tinyint(1) DEFAULT '1';
```

## 🚀 Installation Steps

### Step 1: Run Migration
```bash
cd Bullcasino
php artisan migrate
```

This creates the `flappy_bird` table and adds settings column.

### Step 2: Enable Game in Settings
```sql
UPDATE settings SET flappybird_enabled = 1 WHERE id = 1;
```

Or through admin panel if available.

### Step 3: Clear Caches
```bash
php artisan cache:clear
php artisan route:clear
php artisan config:clear
php artisan view:clear
```

### Step 4: Verify Routes
```bash
php artisan route:list | grep flappy
```

Should show:
```
GET|HEAD  flappybird ........... flappybird › FlappyBirdController@index
POST      flappybird/start ..... › FlappyBirdController@start
POST      flappybird/result .... › FlappyBirdController@result
GET|HEAD  flappybird/leaderboard › FlappyBirdController@leaderboard
GET|HEAD  flappybird/stats ..... › FlappyBirdController@stats
GET|HEAD  flappybird/history ... › FlappyBirdController@history
```

## 🔧 Configuration

### Adjust Settings in Controller

**House Edge:**
```php
// In FlappyBirdController.php, result() method
$houseChance = 10; // Base 10%
```

**Score Restrictions:**
```php
// Prevent excessive wins
if ($score >= 20 && $multiplier >= 3.0) {
    // Apply house edge
}
```

**Validation Tolerance:**
```php
$tolerance = 0.2; // Multiplier validation tolerance
```

### Database Settings

Add to `settings` table via admin:
- `flappybird_enabled` (boolean) - Enable/disable game
- `flappybird_min_bet` (decimal) - Minimum bet
- `flappybird_max_bet` (decimal) - Maximum bet
- `flappybird_max_multiplier` (decimal) - Cap multiplier

## 📡 API Documentation

### POST /flappybird/start
**Request:**
```json
{
  "bet": 10.00
}
```

**Response (Success):**
```json
{
  "error": false,
  "msg": "Game started! Good luck!",
  "balance": 990.00
}
```

**Response (Error):**
```json
{
  "error": true,
  "msg": "Insufficient funds"
}
```

### POST /flappybird/result
**Request:**
```json
{
  "bet": 10.00,
  "multiplier": 2.5,
  "score": 15,
  "won": true,
  "amount": 25.00
}
```

**Response (Success):**
```json
{
  "error": false,
  "msg": "You won 25.00!",
  "balance": 1015.00,
  "won": true,
  "amount": 25.00
}
```

### GET /flappybird/leaderboard
**Response:**
```json
{
  "leaderboard": [
    {
      "username": "Player1",
      "score": 45,
      "best_multiplier": 5.5
    },
    {
      "username": "Player2",
      "score": 38,
      "best_multiplier": 4.8
    }
  ]
}
```

### GET /flappybird/stats
**Response:**
```json
{
  "total_games": 100,
  "total_wins": 45,
  "total_losses": 55,
  "highest_score": 52,
  "highest_multiplier": 6.2,
  "total_wagered": 1000.00,
  "total_won": 1250.00,
  "win_rate": 45.00
}
```

## 🧪 Testing

### Manual Testing
```bash
# Test game start
curl -X POST http://localhost/flappybird/start \
  -H "Content-Type: application/json" \
  -d '{"bet": 10}'

# Test game result (win)
curl -X POST http://localhost/flappybird/result \
  -H "Content-Type: application/json" \
  -d '{
    "bet": 10,
    "multiplier": 2.5,
    "score": 15,
    "won": true,
    "amount": 25
  }'

# Test leaderboard
curl http://localhost/flappybird/leaderboard

# Test stats
curl http://localhost/flappybird/stats
```

### Unit Tests (Optional)
Create `tests/Feature/FlappyBirdTest.php`:

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class FlappyBirdTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_start_game()
    {
        $user = User::factory()->create(['balance' => 100]);
        
        $response = $this->actingAs($user)
            ->post('/flappybird/start', ['bet' => 10]);

        $response->assertJson(['error' => false]);
        $this->assertEquals(90, $user->fresh()->balance);
    }

    public function test_can_submit_win()
    {
        $user = User::factory()->create(['balance' => 100]);
        
        $response = $this->actingAs($user)
            ->post('/flappybird/result', [
                'bet' => 10,
                'multiplier' => 2.0,
                'score' => 10,
                'won' => true,
                'amount' => 20
            ]);

        $response->assertJson(['error' => false, 'won' => true]);
    }
}
```

## 🐛 Troubleshooting

### Issue: Routes not found
```bash
php artisan route:cache
php artisan route:clear
```

### Issue: Class not found
```bash
composer dump-autoload
```

### Issue: Table doesn't exist
```bash
php artisan migrate:fresh
# Or specific migration:
php artisan migrate --path=/database/migrations/2024_02_12_000001_create_flappy_bird_table.php
```

### Issue: Settings column missing
```sql
ALTER TABLE settings ADD COLUMN flappybird_enabled TINYINT(1) DEFAULT 1;
```

### Issue: CSRF token mismatch
Ensure your blade template includes:
```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

## 📈 Performance Optimization

### Database Indexes
Already included in migration:
- `user_id` for user lookups
- `created_at` for date filters
- Composite indexes for leaderboards

### Query Optimization
```php
// Use select to limit columns
FlappyBird::select('id', 'score', 'multiplier')
    ->where('user_id', $userId)
    ->get();

// Use pagination for history
FlappyBird::where('user_id', $userId)
    ->paginate(20);
```

### Caching Leaderboard
```php
Cache::remember('flappybird_leaderboard', 300, function () {
    return FlappyBirdController::leaderboard();
});
```

## 🔒 Admin Controls

### Disable Game
```php
// In admin panel
Settings::where('id', 1)->update(['flappybird_enabled' => 0]);
```

### View All Games
```php
$games = FlappyBird::with('user')
    ->orderBy('created_at', 'desc')
    ->paginate(50);
```

### Check Suspicious Activity
```php
// High scores
$suspicious = FlappyBird::where('score', '>', 100)->get();

// High wins
$bigWins = FlappyBird::where('win_amount', '>', 1000)->get();
```

## 📝 Notes

- All monetary values use decimal(10,2) for precision
- CSRF protection is active on all POST routes
- Foreign key cascade ensures data integrity
- Timestamps track game history
- Status field allows for future game states
- Leaderboard resets daily (uses `whereDate`)

## 🎯 Next Steps

1. Run migration: `php artisan migrate`
2. Enable in settings table
3. Test with Postman/curl
4. Integrate with frontend
5. Monitor logs for errors
6. Adjust house edge as needed

---

**Total Backend Files**: 4 files (Controller, Model, Migration, Routes)
**Database Tables**: 1 (flappy_bird + settings column)
**API Endpoints**: 6 routes
**Status**: Ready for production ✅
