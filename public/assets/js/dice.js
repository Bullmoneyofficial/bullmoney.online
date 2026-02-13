$(document).ready(function () {
    $(".play__small").click(function() {
        playDice('min');
    });
    $(".play__big").click(function() {
        playDice('max');
    });
    $(".input__chance").keyup(function() {
        $('.min__prog').html('0 - ' + Math.floor(($('.input__chance').val() / 100) * 999999));
        $('.max__prog').html(999999 - Math.floor(($('.input__chance').val() / 100) * 999999) + ' - 999999');
        var inp = $(".input__chance");
        if (inp.val() > 90) inp.val(90);
        updateWin(((100 / $('.input__chance').val()) * $('.input__bet').val()));
    });
    $(".input__bet").keyup(function() {
        $('.min__prog').html('0 - ' + Math.floor(($('.input__chance').val() / 100) * 999999));
        $('.max__prog').html(999999 - Math.floor(($('.input__chance').val() / 100) * 999999) + ' - 999999');
        var inp = $(".input__chance");
        if (inp.val() > 90) inp.val(90);
        updateWin(((100 / $('.input__chance').val()) * $('.input__bet').val()));
    });
});

function updateWin(win) {
    current_balance = win;
    var init_balance = parseInt($('.dice__possible_win').text().split(' ').join(''));
    $({cur_balance: init_balance}).animate({cur_balance: win}, {
        duration: 350,
        easing: 'swing',
        step: function () {
            $('.dice__possible_win').text(this.cur_balance.toFixed(2));
        },
        complete: function () {
            $('.dice__possible_win').text(win.toFixed(2));
        }
    });
}

function changeBet() {
    $('.min__prog').html('0 - ' + Math.floor(($('.input__chance').val() / 100) * 999999));
    $('.max__prog').html(999999 - Math.floor(($('.input__chance').val() / 100) * 999999) + ' - 999999');
    var inp = $(".input__chance");
    if (inp.val() > 90) inp.val(90);
    updateWin(((100 / $('.input__chance').val()) * $('.input__bet').val()));
}

function changeChance() {
    $('.min__prog').html('0 - ' + Math.floor(($('.input__chance').val() / 100) * 999999));
    $('.max__prog').html(999999 - Math.floor(($('.input__chance').val() / 100) * 999999) + ' - 999999');
    var inp = $(".input__chance");
    if (inp.val() > 90) inp.val(90);
    updateWin(((100 / $('.input__chance').val()) * $('.input__bet').val()));
}

/**
 * Main play function with proper error handling
 */
async function playDice(type) {
    $(".dice__play").attr("disabled", true);
    $(".dice__play").css("opacity", "0.7");
    
    try {
        // Prepare data
        const bet = $('.input__bet').val();
        const percent = $('.input__chance').val();

        // Validate input
        if (!bet || bet <= 0 || !percent || percent <= 0) {
            GameBackend.error.show('❌ Please enter valid bet and chance values');
            $(".dice__play").attr("disabled", false).css("opacity", "1");
            return;
        }

        // Check if GameBackend is available
        if (typeof GameBackend === 'undefined') {
            console.warn('⚠️ GameBackend helper not loaded, falling back to jQuery');
            return playDiceOldWay(bet, percent, type);
        }

        // Make API request using GameBackend helper
        console.log('🎮 [Dice] Playing dice with bet=' + bet + ', chance=' + percent + ', type=' + type);
        
        const response = await GameBackend.post('/dice/bet', {
            bet: bet,
            percent: percent,
            type: type
        });

        // Handle response
        if (!response.success) {
            GameBackend.error.show('❌ ' + response.error);
            $(".dice__play").attr("disabled", false).css("opacity", "1");
            return;
        }

        const result = response.data;

        // Animate dice result
        try {
            if (typeof window.animateDiceResult !== 'undefined' && typeof result.random !== 'undefined') {
                const face = (parseInt(result.random) % 6) + 1;
                window.animateDiceResult(face, parseInt(result.random));
            }
        } catch (err) {
            console.warn('⚠️ Could not animate dice:', err);
        }

        // Show result
        if (result.type === 'success') {
            if (result.out === 'win') {
                $('.dice__result')
                    .css('display', 'block')
                    .removeClass("danger")
                    .addClass("success")
                    .html("Won <b>" + result.cash.toFixed(2) + "</b>");
                if (typeof updateBalance === 'function') {
                    updateBalance(result.balance);
                }
            } else if (result.out === 'lose') {
                $('.dice__result')
                    .css('display', 'block')
                    .removeClass("success")
                    .addClass("danger")
                    .html('Rolled <b>' + result.random + '</b>');
                if (typeof updateBalance === 'function') {
                    updateBalance(result.balance);
                }
            } else {
                $('.dice__result')
                    .css('display', 'block')
                    .removeClass("success")
                    .addClass("danger")
                    .html(result.msg || 'Unknown error');
            }
        } else {
            $('.dice__result')
                .css('display', 'block')
                .removeClass("success")
                .addClass("danger")
                .html(result.msg || 'Error occurred');
        }

    } catch (err) {
        console.error('❌ Dice bet error:', err);
        GameBackend.error.show('❌ Critical error: ' + err.message);
        
    } finally {
        // Re-enable button after delay
        setTimeout(() => {
            $(".dice__play").attr("disabled", false).css("opacity", "1");
        }, 300);
    }
}

/**
 * Fallback for when GameBackend is not loaded
 */
function playDiceOldWay(bet, percent, type) {
    $.post('/dice/bet', {
        _token: $('meta[name="csrf-token"]').attr('content'),
        bet: bet,
        percent: percent,
        type: type
    })
    .then(e => {
        try {
            if (typeof window !== 'undefined' && window.animateDiceResult && typeof e.random !== 'undefined') {
                var face = (parseInt(e.random) % 6) + 1;
                try { window.animateDiceResult(face, parseInt(e.random)); } catch (err) { }
            }
        } catch (err) { }
        if (e.type == 'success')
            if (e.out == 'win') {
                $('.dice__result').css('display', 'block').removeClass("danger").addClass("success").html("Won <b>" + e.cash.toFixed(2) + "</b>");
                if (typeof updateBalance === 'function') {
                    updateBalance(e.balance);
                }
                return false;
            }
        if (e.out == 'lose') {
            $('.dice__result').css('display', 'block').removeClass("success").addClass("danger").html('Rolled <b>' + e.random + '</b>');
            if (typeof updateBalance === 'function') {
                updateBalance(e.balance);
            }
            return false;
        } else {
            $('.dice__result').css('display', 'block').removeClass("success").addClass("danger").html(e.msg || 'Error');
        }
    })
    .catch(err => {
        console.error('❌ Dice bet request failed:', err);
        $('.dice__result').css('display', 'block').removeClass("success").addClass("danger").html('❌ Request failed - Backend unavailable');
    })
    .finally(() => {
        $(".dice__play").attr("disabled", false).css("opacity", "1");
    });
}
