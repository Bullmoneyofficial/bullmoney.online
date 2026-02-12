@extends('layout')

@section('title', 'Flappy Bird - BullCasino')

@section('content')
<link rel="stylesheet" href="{{ asset('games/bullcasino/css/flappybird.css') }}">

<div class="flappy-container">
    <!-- Game Header -->
    <div class="flappy-header">
        <h1 class="bull-logo">
            Flappy<span class="accent">Bird</span>
        </h1>
        <p style="color: var(--text-secondary); margin-top: 8px;">
            Fly through pipes and maximize your multiplier!
        </p>
    </div>

    <!-- Main Game Layout -->
    <div class="flappy-game">
        <!-- Canvas Area -->
        <div class="flappy-canvas-wrapper">
            <!-- Game Status -->
            <div class="flappy-status ready">
                <span class="flappy-status-dot"></span>
                <span>Ready to Play</span>
            </div>

            <!-- SVG Canvas Container -->
            <div id="flappy-canvas"></div>

            <!-- Instructions -->
            <div class="flappy-instructions">
                <h3 class="flappy-instructions__title">How to Play</h3>
                <ul class="flappy-instructions__list">
                    <li class="flappy-instructions__item">Click or press SPACE to make the bird flap</li>
                    <li class="flappy-instructions__item">Navigate through the green pipes</li>
                    <li class="flappy-instructions__item">Each pipe passed increases your multiplier</li>
                    <li class="flappy-instructions__item">Cash out anytime or crash and lose your bet</li>
                    <li class="flappy-instructions__item">Avoid hitting pipes or the ground!</li>
                </ul>
            </div>

            <!-- Footer Stats -->
            <div class="flappy-footer-stats">
                <div class="flappy-footer-stat">
                    <div class="flappy-footer-stat__value" id="flappy-current-score">0</div>
                    <div class="flappy-footer-stat__label">Current Score</div>
                </div>
                <div class="flappy-footer-stat">
                    <div class="flappy-footer-stat__value" id="flappy-high-score">0</div>
                    <div class="flappy-footer-stat__label">High Score</div>
                </div>
                <div class="flappy-footer-stat">
                    <div class="flappy-footer-stat__value" id="flappy-games-played">0</div>
                    <div class="flappy-footer-stat__label">Games Played</div>
                </div>
            </div>
        </div>

        <!-- Sidebar Controls -->
        <div class="flappy-sidebar">
            <h2 class="flappy-sidebar__title">Place Your Bet</h2>

            <!-- Bet Input Section -->
            <div class="flappy-sidebar__section">
                <label class="flappy-sidebar__label" for="bet-input">Bet Amount</label>
                <div class="flappy-input-group">
                    <input 
                        type="number" 
                        id="bet-input" 
                        class="flappy_bet" 
                        placeholder="Enter bet amount"
                        min="1" 
                        max="10000" 
                        value="10"
                        step="0.01"
                    >
                    <div style="display: flex; gap: 8px;">
                        <button class="quick-bet-btn" data-amount="10">10</button>
                        <button class="quick-bet-btn" data-amount="50">50</button>
                        <button class="quick-bet-btn" data-amount="100">100</button>
                        <button class="quick-bet-btn" data-amount="500">500</button>
                    </div>
                </div>
            </div>

            <!-- Stats Display -->
            <div class="flappy-stats">
                <div class="flappy-stat-card">
                    <span class="flappy-stat-label">Multiplier</span>
                    <span class="flappy-stat-value flappy__multiplier highlight">1.00x</span>
                </div>
                <div class="flappy-stat-card">
                    <span class="flappy-stat-label">Potential Win</span>
                    <span class="flappy-stat-value flappy__potential_win highlight">0.00</span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flappy-sidebar__section">
                <button class="flappy__play" id="play-btn">
                    Start Game
                </button>
                <button class="flappy__cashout" id="cashout-btn">
                    Cash Out
                </button>
            </div>

            <!-- Result Display -->
            <div class="flappy__result"></div>

            <!-- Info Section -->
            <div class="flappy-sidebar__section" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                <div style="font-size: 12px; color: var(--text-tertiary); line-height: 1.6;">
                    <p style="margin-bottom: 8px;">
                        <strong style="color: var(--text-secondary);">💡 Pro Tip:</strong> 
                        Each pipe you pass increases your multiplier by 0.1x. The longer you survive, the bigger your potential win!
                    </p>
                    <p>
                        <strong style="color: var(--text-secondary);">🎮 Controls:</strong> 
                        Click anywhere on the game canvas or press SPACE to flap.
                    </p>
                </div>
            </div>

            <!-- Balance Display -->
            <div class="flappy-sidebar__section" style="margin-top: auto;">
                <div class="flappy-stat-card" style="width: 100%;">
                    <span class="flappy-stat-label">Your Balance</span>
                    <span class="flappy-stat-value" id="user-balance">{{ number_format(Auth::user()->balance ?? 0, 2) }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Leaderboard Section -->
    <div class="flappy-leaderboard">
        <h3 class="flappy-leaderboard__title">🏆 Top Players Today</h3>
        <div class="flappy-leaderboard__list" id="leaderboard-list">
            <div class="flappy-leaderboard__item">
                <span class="flappy-leaderboard__rank">#1</span>
                <span class="flappy-leaderboard__player">Loading...</span>
                <span class="flappy-leaderboard__score">-</span>
            </div>
        </div>
    </div>
</div>

<script src="{{ asset('games/bullcasino/js/flappybird.js') }}"></script>

<script>
    // Quick bet buttons
    $(document).ready(function() {
        $('.quick-bet-btn').on('click', function() {
            const amount = $(this).data('amount');
            $('#bet-input').val(amount);
        });

        // Update balance from Laravel
        function updateBalance(newBalance) {
            $('#user-balance').text(parseFloat(newBalance).toFixed(2));
        }

        // Make updateBalance available globally
        window.updateBalance = updateBalance;

        // Load leaderboard
        function loadLeaderboard() {
            $.get('/flappybird/leaderboard').then(function(data) {
                if (data && data.leaderboard && data.leaderboard.length > 0) {
                    const html = data.leaderboard.map((entry, index) => `
                        <div class="flappy-leaderboard__item">
                            <span class="flappy-leaderboard__rank">#${index + 1}</span>
                            <span class="flappy-leaderboard__player">${entry.username}</span>
                            <span class="flappy-leaderboard__score">${entry.score}</span>
                        </div>
                    `).join('');
                    $('#leaderboard-list').html(html);
                } else {
                    $('#leaderboard-list').html(`
                        <div style="text-align: center; padding: 20px; color: var(--text-tertiary);">
                            No games played today. Be the first!
                        </div>
                    `);
                }
            }).catch(function() {
                console.error('Failed to load leaderboard');
            });
        }

        // Load leaderboard on page load
        loadLeaderboard();

        // Refresh leaderboard every 30 seconds
        setInterval(loadLeaderboard, 30000);
    });
</script>

<style>
    /* Quick bet buttons styling */
    .quick-bet-btn {
        flex: 1;
        background: var(--input-bg);
        border: 1.5px solid var(--border-color);
        border-radius: 6px;
        padding: 10px;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s var(--transition-smooth);
    }

    .quick-bet-btn:hover {
        border-color: var(--main-color);
        background: var(--color-inner);
        transform: translateY(-1px);
    }

    .quick-bet-btn:active {
        transform: translateY(0);
    }

    /* Header styling */
    .flappy-header {
        text-align: center;
        padding: 20px 0;
    }

    .flappy-header h1 {
        font-size: 48px;
        font-weight: 700;
        letter-spacing: -0.03em;
    }
</style>
@endsection
