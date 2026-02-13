$(document).ready(function () {
    // Canvas setup for plinko board visualization
    const canvas = document.getElementById('plinkoCanvas');
    const ctx = canvas.getContext('2d');
    let isPlaying = false;

    // Draw plinko board
    function drawBoard(rows) {
        const width = canvas.width;
        const height = canvas.height;
        const pegRadius = 4;
        const spacing = Math.min(width / (rows + 2), height / (rows + 4));
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        
        // Draw pegs
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col <= row; col++) {
                const x = width / 2 + (col - row / 2) * spacing;
                const y = 80 + row * spacing;
                
                ctx.beginPath();
                ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Animate ball drop
    function animateBall(rows, finalPosition, callback) {
        const width = canvas.width;
        const height = canvas.height;
        const spacing = Math.min(width / (rows + 2), height / (rows + 4));
        const ballRadius = 8;
        
        let currentRow = 0;
        let currentCol = 0;
        let targetCol = 0;
        let progress = 0;
        
        // Convert finalPosition to path
        const path = [];
        let pos = 0;
        for (let i = 0; i < rows; i++) {
            if (pos < finalPosition) {
                pos++;
                path.push(1); // right
            } else {
                path.push(0); // left
            }
        }
        
        function animate() {
            if (currentRow >= rows) {
                callback();
                return;
            }
            
            progress += 0.08;
            
            if (progress >= 1) {
                currentRow++;
                currentCol = targetCol;
                if (currentRow < rows) {
                    targetCol += path[currentRow];
                }
                progress = 0;
            }
            
            drawBoard(rows);
            
            // Draw ball
            const fromX = width / 2 + (currentCol - (currentRow - 1) / 2) * spacing;
            const fromY = 80 + (currentRow - 1) * spacing;
            const toX = width / 2 + (targetCol - currentRow / 2) * spacing;
            const toY = 80 + currentRow * spacing;
            
            const ballX = fromX + (toX - fromX) * progress;
            const ballY = fromY + (toY - fromY) * progress;
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
            ctx.fill();
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }

    // Update multipliers display
    function updateMultipliers() {
        const rows = parseInt($('.input__rows').val());
        drawBoard(rows);
    }

    // Play plinko
    $(".play__plinko").click(function() {
        if (isPlaying) return;
        
        isPlaying = true;
        $(".play__plinko").attr("disabled", true);
        $(".play__plinko").css("opacity", "0.7");
        
        const bet = parseFloat($('.input__bet').val());
        const rows = parseInt($('.input__rows').val());
        
        if (!bet || bet < 1) {
            $('.plinko__result').removeClass("success").addClass("danger").html('Please enter a valid bet amount');
            isPlaying = false;
            $(".play__plinko").attr("disabled", false);
            $(".play__plinko").css("opacity", "1");
            return;
        }
        
        $.post('/plinko/play', {
            _token: $('meta[name="csrf-token"]').attr('content'),
            bet: bet,
            rows: rows
        }).then(e => {
            if (e.type == 'success') {
                // Animate ball drop
                animateBall(rows, e.position, function() {
                    // Show result after animation
                    if (e.profit > 0) {
                        $('.plinko__result')
                            .css('display', 'flex')
                            .removeClass("danger")
                            .addClass("success")
                            .html("Won <b>" + e.win.toFixed(2) + "</b> (x" + e.multiplier + ")");
                    } else if (e.profit < 0) {
                        $('.plinko__result')
                            .css('display', 'flex')
                            .removeClass("success")
                            .addClass("danger")
                            .html('Lost <b>' + Math.abs(e.profit).toFixed(2) + '</b> (x' + e.multiplier + ')');
                    } else {
                        $('.plinko__result')
                            .css('display', 'flex')
                            .removeClass("success danger")
                            .html('Break even (x' + e.multiplier + ')');
                    }
                    
                    updateBalance(e.balance);
                    
                    setTimeout(() => {
                        isPlaying = false;
                        $(".play__plinko").attr("disabled", false);
                        $(".play__plinko").css("opacity", "1");
                    }, 500);
                });
            } else {
                $('.plinko__result')
                    .css('display', 'flex')
                    .removeClass("success")
                    .addClass("danger")
                    .html(e.msg);
                
                isPlaying = false;
                $(".play__plinko").attr("disabled", false);
                $(".play__plinko").css("opacity", "1");
            }
        }).fail(function() {
            $('.plinko__result')
                .css('display', 'flex')
                .removeClass("success")
                .addClass("danger")
                .html('Connection error. Please try again.');
            
            isPlaying = false;
            $(".play__plinko").attr("disabled", false);
            $(".play__plinko").css("opacity", "1");
        });
    });

    // Update bet display
    $(".input__bet").keyup(function() {
        updatePossibleWin();
    });

    $(".input__rows").change(function() {
        updateMultipliers();
        updatePossibleWin();
    });

    function updatePossibleWin() {
        const bet = parseFloat($('.input__bet').val()) || 0;
        const rows = parseInt($('.input__rows').val());
        
        // Calculate average multiplier
        const multipliers = getMultipliers(rows);
        const maxMultiplier = Math.max(...multipliers);
        const possibleWin = bet * maxMultiplier;
        
        $('.plinko__possible_win').text(possibleWin.toFixed(2));
    }

    function getMultipliers(rows) {
        const tables = {
            8: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
            12: [10.0, 3.0, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3.0, 10.0],
            16: [16.0, 9.0, 2.0, 1.4, 1.3, 1.1, 1.0, 0.5, 0.3, 0.5, 1.0, 1.1, 1.3, 1.4, 2.0, 9.0, 16.0]
        };
        return tables[rows];
    }

    // Initialize
    updateMultipliers();
    updatePossibleWin();
});

function updateBalance(balance) {
    $('#balance').text(balance.toFixed(2));
}
