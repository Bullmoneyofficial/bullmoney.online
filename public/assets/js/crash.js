document.render = [];
$(document).ready(function() {
    var button_enabled = true;

    this.chart = null;
    this.counter = 0;
    this.socket = io.connect(':8443');

    this.interpolate_coefs = [
        1.37536023,
        1.90518962,
        2.66248257,
        3.78019802,
        5.48563218,
        8.22844828,
        13.0753425,
        23.2804878,
        54.5428571
    ];

    this.resetPlot = () => {
        $.plot($('#chart'), [[0,1]], {
            xaxis : {
                max : Math.max(1, 5000/2000),
                min : 1,
                color: "rgba(47, 69, 83, 0.8)",
                ticks : {
                    show : false
                }
            },
            yaxis : {
                max : Math.max(1.003004504503377*1, 2),
                min : 1,
                color: "rgba(47, 69, 83, 0.8)"
            },
            series: {
                lines: { fill: true},
            },
            grid: {
                borderColor: "rgba(47, 69, 83, 0.8)",
                borderWidth: {
                    top: 0,
                    right: 0,
                    left: 2,
                    bottom: 2
                },
                backgroundColor: '#1a2c38'
            },
            colors : ['#00e701']
        });
    }

    this.resetPlot();

    this.socket.on('crash', async res => {
        if(res.type == 'bet') this.publishBet(res);
        if(res.type == 'timer') this.publishTime(res);
        if(res.type == 'slider') this.parseSlider(res);
        if(res.type == 'game') this.reset(res);
    });

    this.publishTime = (res) => {
        $('.chart-info').text(res.value + ' c.');
        if (game_active){
            $('.crash__play').prop('disabled', true);
        }
        else{
            if (button_enabled)
                $('.crash__play').prop('disabled', false);
        }
    }

    this.publishBet = (res) => {
        let html = '';
        for(var i in res.bets)
        {
            let bet = res.bets[i];
            html += '<div class="crash__bet">\
                        <div class="crash__bet_user_wr">\
                            <div class="crash__bet_user_image_wr">\
                                <img src="' + bet.user.avatar + '" class="crash__bet_user_image" style="border-color: #333" alt="">\
                                <img src="/assets/images/ranks/' + bet.user.rank + '.png" class="crash__bet_user_rank">\
                            </div>\
                            <div class="crash__bet_username_wr">\
                                <div class="crash__bet_username">' + bet.user.username + '</div>\
                            </div>\
                        </div>\
                        <div class="crash__bet_values">\
                            <div class="crash__bet_value crash__bet_sum"> ' + bet.price + '</div>';
            

            if (bet.status == 1) {
                html += '<div class="crash__bet_value crash__bet_coef">' + bet.withdraw + 'x</div>\
                        <div class="crash__bet_value crash__bet_win"> ' + bet.won + '</div>';
            }
            if (bet.status == 0){
                html += '<div class="crash__bet__value crash__bet_coef">In game</div>\
                        <div class="crash__bet__value crash__bet_win crash__bet_win_hidden"></div>';
            }   
            html += '</div></div>';
        }
        $('.crash__bets').html(html);
    }

    this.reset = (res) => {
        $('.crash__bets').html('');
        $('.chart-info').css('color', '#00e701').text('Loading');
        $('.crash__play').prop('disabled', false).text('Play');
        game_active = false;
        isCashout = undefined;
        withdraw = undefined;
        bet = undefined;
        unlockControls();
        this.resetPlot();
        // displayFairDataOnModal(res.server_seed, res.client_seed, res.salt, res.current_server_seed, res.current_client_seed, fairCarousel);
        let html = '';
        for(var i in res.history) html += '<div class="game__crash_coef"> <div class="crash__coef" style="color: '+res.history[i].color+'; border-color: '+res.history[i].color+';">'+res.history[i].multiplier.toFixed(2)+'x </div> </div>';
        $('.game__crash_coefs').html(html);
        try{
            if(typeof window !== 'undefined' && window.resetCrashAnimation) {
                try{ window.resetCrashAnimation(); }catch(err){}
            }
        }catch(err){}
    }

    this.parseSlider = (res) => {
        $.plot($('#chart'), [res.data], res.options);
        $('.chart-info').text(((res.crashed) ? 'Crashed at ' : '') + 'x' + res.float.toFixed(2));
        try{
            if(typeof window !== 'undefined' && window.animateCrashFrame) {
                try{ window.animateCrashFrame(res.float, !!res.crashed); }catch(err){}
            }
        }catch(err){}
        if(res.crashed) 
        {
            $('.chart-info').css({
                'transition' : 'color 200ms ease',
                'color' : '#ed4245'
            });
            
            if (game_active){
                $('.crash__play').prop('disabled', true).text('Cash out');
            }
        } else {
            if (game_active && bet) {
                var to_withdraw = (bet * parseFloat(res.float.toFixed(2))).toFixed(2);
                $('.crash__play').text('Cash out ' + to_withdraw + '₽');
        
                if (res.float < 1.02) {
                    $('.crash__play').prop('disabled', true);
                }
                else{
                    if (button_enabled)
                        $('.crash__play').prop('disabled', false);
                }
            }
            else{
                $('.crash__play').prop('disabled', true);
            }

            if(game_active && res.float >= withdraw) 
            {
                game_active = false;
                isCashout = true;
                cashout();
            }
        }
    }

    function createBet(){
        $('.crash__play').prop('disabled', true);
        button_enabled = false;
        // if (!validateField('#amount') || !validateFieldFloat('#crash-auto')) {
        //     $('.crash-play').prop('disabled', false);
        //     return;
        // }
        var wt      = parseFloat($('.crash_auto').val());
        var amount  = $('.crash_bet').val();
        $.ajax({
            url : '/crash/addBet',
            type : 'post',
            data : {
                bet : amount,
                withdraw : wt
            },
            success : function(res) {
                $.notify({
                    position : 'bottom-right',
                    type: res.success ? 'success' : 'error',
                    message: res.msg
                });
                if(res.success == true) 
                {
                    updateBalance(res.balance);
                    lockControls();

                    bet = res.bet;
                    withdraw = wt;
                    isCashout = false;
                    game_active = true;
                    $('.crash__play').text('Cash out ' + bet);
                }
                $('.crash__play').prop('disabled', false);
                button_enabled = true;
            }, 
            error : function() {
                $.notify({
                    position : 'bottom-right',
                    type: 'error',
                    message: 'An error occurred while sending data'
                });
                $('.crash__play').prop('disabled', false);
                button_enabled = true;
            }
        });
    }

    function cashout(){
        $('.crash__play').prop('disabled', true);
        button_enabled = false;
        $.ajax({
            url : '/crash/cashout',
            type : 'post',
            success : function(res) {
                if(res.success == true) 
                {
                    $('.crash__play').text('Play');
                    updateBalance(res.balance);
                    game_active = false;
                    isCashout = true;
                    unlockControls();
                }
                else{
                    $.notify({
                        position : 'bottom-right',
                        type: res.success ? 'success' : 'error',
                        message: res.msg
                    });
                }
                $('.crash__play').prop('disabled', false);
                button_enabled = true;
            },
            error : function(res) {
                $.notify({
                    position : 'bottom-right',
                    type: 'error',
                    message: 'An error occurred while sending data'
                });
                $('.crash__play').prop('disabled', false);
                button_enabled = true;
            }
        })
    }

    function unlockControls(){
        $('.games__sidebar_help_bombs').prop('disabled', false);
        $('.games__sidebar_bombs_action').prop('disabled', false); 
        $('.crash_auto').prop('disabled', false);
        $('.crash_bet').prop('disabled', false);
    }

    function lockControls(){
        $('.games__sidebar_help_bombs').prop('disabled', true);
        $('.games__sidebar_bombs_action').prop('disabled', true); 
        $('.crash_auto').prop('disabled', true);
        $('.crash_bet').prop('disabled', true);
    }

    $('.crash__play').on('click', function() {
        if (!game_active){
            createBet();
        }
        else{
            cashout();
        }
    });
});