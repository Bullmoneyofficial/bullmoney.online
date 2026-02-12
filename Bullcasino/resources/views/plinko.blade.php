@extends('layout')

@section('content')
<div class="plinko__container">
    <div class="games__area">
        <div class="games__sidebar">
            <div class="games__input_wrapper_bet">
                <label class="games__sidebar_label">Bet</label>
                <div class="games__sidebar_wrapper_input">
                    <input type="number" class="games__sidebar_input input__bet" value="0">
                </div>
                <div class="games__sidebar_help_bombs">
                    <button class="games__sidebar_bombs_action" onclick="$('.input__bet').val(+$('.input__bet').val() + 1);">+1</button>
                    <button class="games__sidebar_bombs_action" onclick="$('.input__bet').val(+$('.input__bet').val() + 10);">+10</button>
                    <button class="games__sidebar_bombs_action" onclick="$('.input__bet').val(+$('.input__bet').val() + 100);">+100</button>
                    <button class="games__sidebar_bombs_action" onclick="$('.input__bet').val(1);">Min</button>
                    <button class="games__sidebar_bombs_action" onclick="$('.input__bet').val($('#balance').text());">Max</button>
                </div>
            </div>
            <div class="games__input_wrapper_bombs">
                <label class="games__sidebar_label">Rows</label>
                <div class="games__sidebar_wrapper_input">
                    <select class="games__sidebar_input input__rows">
                        <option value="8">8 Rows</option>
                        <option value="12">12 Rows</option>
                        <option value="16" selected>16 Rows</option>
                    </select>
                </div>
            </div>
            <div class="games__input_wrapper_action">
                <button class="games__sidebar_action play__plinko">Drop Ball</button>
            </div>
        </div>
        <div class="plinko__field">
            <div class="game__plinko_wrapper">
                <div class="plinko__main_area">
                    <div class="plinko__possible_win">0.00</div>
                    <div class="plinko__possible_text">Possible win</div>
                    <div class="plinko__board">
                        <canvas id="plinkoCanvas" width="600" height="800"></canvas>
                    </div>
                    <div class="plinko__multipliers">
                        <!-- Multipliers will be dynamically added here -->
                    </div>
                    <div class="plinko__result">
                        Drop the ball to play!
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script src="/assets/js/plinko.js"></script>
</div>

<style>
.plinko__container {
    width: 100%;
    min-height: 100vh;
    padding: 20px;
}

.plinko__field {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.game__plinko_wrapper {
    width: 100%;
    max-width: 700px;
    background: rgba(0,0,0,0.3);
    border-radius: 12px;
    padding: 20px;
}

.plinko__main_area {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.plinko__possible_win {
    font-size: 48px;
    font-weight: bold;
    color: #FFD700;
    margin-bottom: 5px;
}

.plinko__possible_text {
    font-size: 16px;
    color: #999;
    margin-bottom: 20px;
}

.plinko__board {
    margin: 20px 0;
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    overflow: hidden;
}

#plinkoCanvas {
    display: block;
    max-width: 100%;
    height: auto;
}

.plinko__multipliers {
    display: flex;
    justify-content: space-around;
    width: 100%;
    margin: 15px 0;
    gap: 5px;
}

.multiplier__slot {
    flex: 1;
    text-align: center;
    padding: 8px 4px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 13px;
    min-width: 0;
}

.multiplier__high {
    background: linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%);
    color: white;
}

.multiplier__medium {
    background: linear-gradient(135deg, #F7971E 0%, #FFD200 100%);
    color: #333;
}

.multiplier__low {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.multiplier__center {
    background: linear-gradient(135deg, #434343 0%, #000000 100%);
    color: #999;
}

.plinko__result {
    font-size: 18px;
    color: #fff;
    margin-top: 20px;
    padding: 15px;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
    min-height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.games__sidebar_action {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.games__sidebar_action:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.games__sidebar_action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}
</style>

<script>
// Initialize plinko multipliers
function updateMultipliers() {
    const rows = parseInt($('.input__rows').val());
    const multipliers = getMultipliers(rows);
    const multipliersContainer = $('.plinko__multipliers');
    multipliersContainer.empty();
    
    multipliers.forEach((mult) => {
        let className = 'multiplier__center';
        if(mult >= 5) className = 'multiplier__high';
        else if(mult >= 1.5) className = 'multiplier__medium';
        else if(mult >= 1) className = 'multiplier__low';
        
        multipliersContainer.append(`
            <div class="multiplier__slot ${className}">${mult}x</div>
        `);
    });
}

function getMultipliers(rows) {
    const tables = {
        8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
        12: [10.0, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10.0],
        16: [16.0, 9.0, 2.0, 1.4, 1.3, 1.1, 1.0, 0.5, 0.3, 0.5, 1.0, 1.1, 1.3, 1.4, 2.0, 9.0, 16.0]
    };
    return tables[rows];
}

$(document).ready(function() {
    updateMultipliers();
    
    $('.input__rows').on('change', function() {
        updateMultipliers();
    });
});
</script>
@endsection
