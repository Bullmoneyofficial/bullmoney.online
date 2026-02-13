/**
 * ============================================================================
 * FLAPPY BIRD - FULL END-TO-END SVG CANVAS GAME
 * ============================================================================
 * A complete flappy bird implementation with betting, scoring, and animations
 * Built with SVG for smooth rendering and following BullCasino patterns
 * ============================================================================
 */

// ============================================================================
// GAME STATE & CONFIGURATION
// ============================================================================

var FlappyBird = (function() {
    'use strict';

    // Game constants
    const CONFIG = {
        // Canvas dimensions (matching Plinko sizing)
        CANVAS_WIDTH: 400,
        CANVAS_HEIGHT: 600,
        
        // Bird physics
        BIRD_WIDTH: 40,
        BIRD_HEIGHT: 30,
        BIRD_X: 80,
        BIRD_START_Y: 250,
        GRAVITY: 0.42,
        JUMP_VELOCITY: -8.8,
        MAX_FALL_SPEED: 10,
        ROTATION_SPEED: 3,
        MAX_ROTATION: 25,
        
        // Pipe settings
        PIPE_WIDTH: 70,
        PIPE_GAP: 180,
        PIPE_SPEED: 3,
        PIPE_SPAWN_INTERVAL: 1800, // milliseconds
        PIPE_MIN_HEIGHT: 80,
        PIPE_MAX_HEIGHT: 400,
        
        // Game mechanics
        SCORE_PER_PIPE: 1,
        MIN_BET: 1,
        MAX_BET: 10000,
        MULTIPLIER_BASE: 0.1, // Multiplier per pipe passed
        PIPES_PER_LEVEL: 5,
        START_PIPE_GAP: 260,
        MIN_PIPE_GAP: 135,
        PIPE_GAP_REDUCTION_PER_LEVEL: 8,
        START_PIPE_SPEED: 2.0,
        MAX_PIPE_SPEED: 3.8,
        PIPE_SPEED_INCREASE_PER_LEVEL: 0.1,
        START_PIPE_SPAWN_INTERVAL: 2200,
        MIN_PIPE_SPAWN_INTERVAL: 1350,
        PIPE_SPAWN_REDUCTION_PER_LEVEL: 60,
        
        // Colors
        COLORS: {
            SKY_TOP: '#87CEEB',
            SKY_BOTTOM: '#E0F6FF',
            BIRD: '#FFD700',
            BIRD_WING: '#FFA500',
            BIRD_BEAK: '#FF6347',
            BIRD_EYE: '#000000',
            PIPE_BODY: '#5CB85C',
            PIPE_HIGHLIGHT: '#6FCF6F',
            PIPE_SHADOW: '#4A9D4A',
            PIPE_CAP: '#4A9D4A',
            GROUND: '#DEB887',
            GROUND_DARK: '#BF9B6F',
            CLOUD: '#FFFFFF',
            TEXT_MAIN: '#FFFFFF',
            TEXT_SHADOW: '#000000',
            BUTTON_BG: '#4CAF50',
            BUTTON_HOVER: '#45a049',
            BUTTON_DISABLED: '#CCCCCC',
            OVERLAY: 'rgba(0, 0, 0, 0.7)'
        },
        
        // Animation
        ANIMATION_FPS: 60,
        FLAP_ANIMATION_DURATION: 150
    };

    // Game state variables
    var gameState = {
        phase: 'READY', // READY, PLAYING, GAME_OVER, BETTING
        bird: null,
        pipes: [],
        score: 0,
        highScore: 0,
        currentBet: 0,
        currentMultiplier: 1.0,
        potentialWin: 0,
        animationId: null,
        lastPipeSpawn: 0,
        gameStartTime: 0,
        isFlapping: false,
        clouds: [],
        particles: []
    };

    // SVG namespace
    const SVG_NS = 'http://www.w3.org/2000/svg';

    // DOM elements
    var elements = {
        canvas: null,
        svg: null,
        birdGroup: null,
        pipesGroup: null,
        cloudsGroup: null,
        particlesGroup: null,
        groundGroup: null,
        uiGroup: null,
        scoreText: null,
        statusText: null,
        betInput: null,
        playButton: null,
        cashoutButton: null,
        resultDisplay: null,
        multiplierDisplay: null,
        potentialWinDisplay: null
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function init() {
        console.log('[FlappyBird] Initializing game...');
        
        // Load high score
        loadHighScore();
        
        // Setup DOM references
        setupDOMReferences();
        
        // Create SVG canvas
        createSVGCanvas();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize game objects
        initializeGameObjects();
        
        // Start render loop
        startRenderLoop();
        
        console.log('[FlappyBird] Game initialized successfully');
    }

    function setupDOMReferences() {
        elements.canvas = document.getElementById('flappy-canvas');
        elements.betInput = document.querySelector('.flappy_bet');
        elements.playButton = document.querySelector('.flappy__play');
        elements.cashoutButton = document.querySelector('.flappy__cashout');
        elements.resultDisplay = document.querySelector('.flappy__result');
        elements.multiplierDisplay = document.querySelector('.flappy__multiplier');
        elements.potentialWinDisplay = document.querySelector('.flappy__potential_win');
        
        // Set initial values
        if (elements.betInput) {
            elements.betInput.value = CONFIG.MIN_BET;
        }
    }

    function createSVGCanvas() {
        if (!elements.canvas) {
            console.error('[FlappyBird] Canvas container not found');
            return;
        }

        // Create main SVG element
        elements.svg = createSVGElement('svg', {
            width: CONFIG.CANVAS_WIDTH,
            height: CONFIG.CANVAS_HEIGHT,
            viewBox: `0 0 ${CONFIG.CANVAS_WIDTH} ${CONFIG.CANVAS_HEIGHT}`,
            class: 'flappy-svg-canvas'
        });

        // Create gradient definitions
        createGradients();

        // Create layer groups (back to front)
        elements.cloudsGroup = createSVGElement('g', { id: 'clouds-layer' });
        elements.pipesGroup = createSVGElement('g', { id: 'pipes-layer' });
        elements.birdGroup = createSVGElement('g', { id: 'bird-layer' });
        elements.particlesGroup = createSVGElement('g', { id: 'particles-layer' });
        elements.groundGroup = createSVGElement('g', { id: 'ground-layer' });
        elements.uiGroup = createSVGElement('g', { id: 'ui-layer' });

        // Append groups to SVG
        elements.svg.appendChild(elements.cloudsGroup);
        elements.svg.appendChild(elements.pipesGroup);
        elements.svg.appendChild(elements.birdGroup);
        elements.svg.appendChild(elements.particlesGroup);
        elements.svg.appendChild(elements.groundGroup);
        elements.svg.appendChild(elements.uiGroup);

        // Append SVG to container
        elements.canvas.innerHTML = '';
        elements.canvas.appendChild(elements.svg);

        // Draw sky background
        drawSky();
        
        // Draw initial ground
        drawGround();
        
        // Create clouds
        createClouds();
        
        // Draw UI elements
        drawUI();
    }

    function createGradients() {
        const defs = createSVGElement('defs');
        
        // Sky gradient
        const skyGradient = createSVGElement('linearGradient', {
            id: 'skyGradient',
            x1: '0%',
            y1: '0%',
            x2: '0%',
            y2: '100%'
        });
        skyGradient.innerHTML = `
            <stop offset="0%" style="stop-color:${CONFIG.COLORS.SKY_TOP};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${CONFIG.COLORS.SKY_BOTTOM};stop-opacity:1" />
        `;
        defs.appendChild(skyGradient);

        // Pipe gradient
        const pipeGradient = createSVGElement('linearGradient', {
            id: 'pipeGradient',
            x1: '0%',
            y1: '0%',
            x2: '100%',
            y2: '0%'
        });
        pipeGradient.innerHTML = `
            <stop offset="0%" style="stop-color:${CONFIG.COLORS.PIPE_SHADOW};stop-opacity:1" />
            <stop offset="40%" style="stop-color:${CONFIG.COLORS.PIPE_BODY};stop-opacity:1" />
            <stop offset="60%" style="stop-color:${CONFIG.COLORS.PIPE_HIGHLIGHT};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${CONFIG.COLORS.PIPE_BODY};stop-opacity:1" />
        `;
        defs.appendChild(pipeGradient);

        elements.svg.appendChild(defs);
    }

    function createSVGElement(type, attributes = {}) {
        const element = document.createElementNS(SVG_NS, type);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        return element;
    }

    // ============================================================================
    // GAME OBJECTS INITIALIZATION
    // ============================================================================

    function initializeGameObjects() {
        // Initialize bird
        gameState.bird = {
            x: CONFIG.BIRD_X,
            y: CONFIG.BIRD_START_Y,
            velocity: 0,
            rotation: 0,
            isAlive: true,
            flapTimer: 0
        };

        // Clear pipes
        gameState.pipes = [];
        
        // Reset score
        gameState.score = 0;
        
        // Reset particles
        gameState.particles = [];

        // Reset progression state
        resetDifficultyState();

        // Draw bird
        drawBird();
    }

    function createClouds() {
        gameState.clouds = [];
        for (let i = 0; i < 5; i++) {
            gameState.clouds.push({
                x: Math.random() * CONFIG.CANVAS_WIDTH,
                y: Math.random() * (CONFIG.CANVAS_HEIGHT * 0.4),
                scale: 0.5 + Math.random() * 0.8,
                speed: 0.2 + Math.random() * 0.5
            });
        }
        renderClouds();
    }

    // ============================================================================
    // DRAWING FUNCTIONS
    // ============================================================================

    function drawSky() {
        const sky = createSVGElement('rect', {
            x: 0,
            y: 0,
            width: CONFIG.CANVAS_WIDTH,
            height: CONFIG.CANVAS_HEIGHT,
            fill: 'url(#skyGradient)'
        });
        elements.svg.insertBefore(sky, elements.cloudsGroup);
    }

    function drawGround() {
        elements.groundGroup.innerHTML = '';
        
        const groundHeight = 60;
        const groundY = CONFIG.CANVAS_HEIGHT - groundHeight;
        
        // Ground base
        const ground = createSVGElement('rect', {
            x: 0,
            y: groundY,
            width: CONFIG.CANVAS_WIDTH,
            height: groundHeight,
            fill: CONFIG.COLORS.GROUND
        });
        elements.groundGroup.appendChild(ground);
        
        // Ground pattern
        for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 20) {
            const patch = createSVGElement('rect', {
                x: x,
                y: groundY + 10,
                width: 18,
                height: 8,
                fill: CONFIG.COLORS.GROUND_DARK,
                opacity: 0.3
            });
            elements.groundGroup.appendChild(patch);
        }
        
        // Grass blades
        for (let x = 5; x < CONFIG.CANVAS_WIDTH; x += 15) {
            const blade = createSVGElement('polygon', {
                points: `${x},${groundY} ${x + 2},${groundY - 8} ${x + 4},${groundY}`,
                fill: '#2D5016',
                opacity: 0.6
            });
            elements.groundGroup.appendChild(blade);
        }
    }

    function drawBird() {
        elements.birdGroup.innerHTML = '';
        
        const bird = gameState.bird;
        if (!bird) return;

        // Bird body (ellipse)
        const body = createSVGElement('ellipse', {
            cx: bird.x,
            cy: bird.y,
            rx: CONFIG.BIRD_WIDTH / 2,
            ry: CONFIG.BIRD_HEIGHT / 2,
            fill: CONFIG.COLORS.BIRD,
            stroke: '#FFA500',
            'stroke-width': 2
        });
        
        // Wing
        const wingOffset = Math.sin(bird.flapTimer * 0.3) * 5;
        const wing = createSVGElement('ellipse', {
            cx: bird.x - 5,
            cy: bird.y + wingOffset,
            rx: 15,
            ry: 12,
            fill: CONFIG.COLORS.BIRD_WING,
            opacity: 0.8
        });
        
        // Eye white
        const eyeWhite = createSVGElement('circle', {
            cx: bird.x + 8,
            cy: bird.y - 5,
            r: 5,
            fill: '#FFFFFF'
        });
        
        // Eye pupil
        const eyePupil = createSVGElement('circle', {
            cx: bird.x + 10,
            cy: bird.y - 5,
            r: 3,
            fill: CONFIG.COLORS.BIRD_EYE
        });
        
        // Beak
        const beak = createSVGElement('polygon', {
            points: `${bird.x + 15},${bird.y - 3} ${bird.x + 25},${bird.y} ${bird.x + 15},${bird.y + 3}`,
            fill: CONFIG.COLORS.BIRD_BEAK
        });

        // Group all bird parts
        const birdContainer = createSVGElement('g', {
            transform: `rotate(${bird.rotation}, ${bird.x}, ${bird.y})`
        });
        
        birdContainer.appendChild(wing);
        birdContainer.appendChild(body);
        birdContainer.appendChild(eyeWhite);
        birdContainer.appendChild(eyePupil);
        birdContainer.appendChild(beak);
        
        elements.birdGroup.appendChild(birdContainer);
    }

    function drawPipes() {
        elements.pipesGroup.innerHTML = '';
        
        gameState.pipes.forEach(pipe => {
            // Top pipe
            drawPipe(pipe.x, 0, CONFIG.PIPE_WIDTH, pipe.topHeight, true);
            
            // Bottom pipe
            const bottomY = pipe.topHeight + pipe.gap;
            const bottomHeight = CONFIG.CANVAS_HEIGHT - bottomY - 60; // 60 = ground height
            drawPipe(pipe.x, bottomY, CONFIG.PIPE_WIDTH, bottomHeight, false);
            
            // Score marker (invisible, for collision detection)
            if (!pipe.scored) {
                const marker = createSVGElement('line', {
                    x1: pipe.x + CONFIG.PIPE_WIDTH / 2,
                    y1: 0,
                    x2: pipe.x + CONFIG.PIPE_WIDTH / 2,
                    y2: CONFIG.CANVAS_HEIGHT,
                    stroke: 'transparent',
                    'stroke-width': 2,
                    'data-pipe-id': pipe.id
                });
                elements.pipesGroup.appendChild(marker);
            }
        });
    }

    function drawPipe(x, y, width, height, isTop) {
        const capHeight = 30;
        const capWidth = width + 10;
        const capOffset = (capWidth - width) / 2;
        
        // Pipe body
        const body = createSVGElement('rect', {
            x: x,
            y: isTop ? y + (height - capHeight) : y + capHeight,
            width: width,
            height: height - capHeight,
            fill: 'url(#pipeGradient)',
            stroke: CONFIG.COLORS.PIPE_SHADOW,
            'stroke-width': 2
        });
        elements.pipesGroup.appendChild(body);
        
        // Pipe cap
        const cap = createSVGElement('rect', {
            x: x - capOffset,
            y: isTop ? y + (height - capHeight) : y,
            width: capWidth,
            height: capHeight,
            fill: CONFIG.COLORS.PIPE_CAP,
            stroke: CONFIG.COLORS.PIPE_SHADOW,
            'stroke-width': 2,
            rx: 5
        });
        elements.pipesGroup.appendChild(cap);
        
        // Pipe highlight
        const highlight = createSVGElement('rect', {
            x: x + 5,
            y: isTop ? y + (height - capHeight) + 5 : y + capHeight + 5,
            width: 4,
            height: height - capHeight - 10,
            fill: CONFIG.COLORS.PIPE_HIGHLIGHT,
            opacity: 0.3
        });
        elements.pipesGroup.appendChild(highlight);
    }

    function renderClouds() {
        elements.cloudsGroup.innerHTML = '';
        
        gameState.clouds.forEach(cloud => {
            const cloudGroup = createSVGElement('g', {
                transform: `translate(${cloud.x}, ${cloud.y}) scale(${cloud.scale})`
            });
            
            // Cloud circles
            const circles = [
                { cx: 0, cy: 0, r: 15 },
                { cx: 15, cy: -5, r: 18 },
                { cx: 30, cy: 0, r: 15 },
                { cx: 15, cy: 8, r: 12 }
            ];
            
            circles.forEach(c => {
                const circle = createSVGElement('circle', {
                    cx: c.cx,
                    cy: c.cy,
                    r: c.r,
                    fill: CONFIG.COLORS.CLOUD,
                    opacity: 0.6
                });
                cloudGroup.appendChild(circle);
            });
            
            elements.cloudsGroup.appendChild(cloudGroup);
        });
    }

    function drawUI() {
        elements.uiGroup.innerHTML = '';
        
        // Score display
        drawText(
            CONFIG.CANVAS_WIDTH / 2,
            50,
            `Score: ${gameState.score}`,
            {
                fontSize: 32,
                fontWeight: 'bold',
                fill: CONFIG.COLORS.TEXT_MAIN,
                stroke: CONFIG.COLORS.TEXT_SHADOW,
                'stroke-width': 4,
                'text-anchor': 'middle',
                'paint-order': 'stroke'
            }
        );
        
        // High score
        if (gameState.highScore > 0) {
            drawText(
                CONFIG.CANVAS_WIDTH / 2,
                85,
                `Best: ${gameState.highScore}`,
                {
                    fontSize: 18,
                    fill: '#FFD700',
                    stroke: CONFIG.COLORS.TEXT_SHADOW,
                    'stroke-width': 2,
                    'text-anchor': 'middle',
                    'paint-order': 'stroke'
                }
            );
        }

        drawText(
            CONFIG.CANVAS_WIDTH / 2,
            110,
            `Level ${gameState.level}`,
            {
                fontSize: 18,
                fontWeight: 'bold',
                fill: '#A5F3FC',
                stroke: CONFIG.COLORS.TEXT_SHADOW,
                'stroke-width': 2,
                'text-anchor': 'middle',
                'paint-order': 'stroke'
            }
        );
        
        // Multiplier display (when playing)
        if (gameState.phase === 'PLAYING' && gameState.currentBet > 0) {
            drawText(
                CONFIG.CANVAS_WIDTH / 2,
                120,
                `${gameState.currentMultiplier.toFixed(2)}x`,
                {
                    fontSize: 28,
                    fontWeight: 'bold',
                    fill: '#00FF00',
                    stroke: CONFIG.COLORS.TEXT_SHADOW,
                    'stroke-width': 3,
                    'text-anchor': 'middle',
                    'paint-order': 'stroke'
                }
            );
            
            const potentialWin = (gameState.currentBet * gameState.currentMultiplier).toFixed(2);
            drawText(
                CONFIG.CANVAS_WIDTH / 2,
                145,
                `Win: ${potentialWin}`,
                {
                    fontSize: 16,
                    fill: '#FFFFFF',
                    stroke: CONFIG.COLORS.TEXT_SHADOW,
                    'stroke-width': 2,
                    'text-anchor': 'middle',
                    'paint-order': 'stroke'
                }
            );
        }
        
        // Instructions (when ready)
        if (gameState.phase === 'READY') {
            drawText(
                CONFIG.CANVAS_WIDTH / 2,
                CONFIG.CANVAS_HEIGHT / 2,
                'Click or Press Space to Flap!',
                {
                    fontSize: 20,
                    fill: CONFIG.COLORS.TEXT_MAIN,
                    stroke: CONFIG.COLORS.TEXT_SHADOW,
                    'stroke-width': 3,
                    'text-anchor': 'middle',
                    'paint-order': 'stroke'
                }
            );
        }
        
        // Game over message
        if (gameState.phase === 'GAME_OVER') {
            // Semi-transparent overlay
            const overlay = createSVGElement('rect', {
                x: 0,
                y: 0,
                width: CONFIG.CANVAS_WIDTH,
                height: CONFIG.CANVAS_HEIGHT,
                fill: CONFIG.COLORS.OVERLAY,
                opacity: 0.7
            });
            elements.uiGroup.appendChild(overlay);

            const panelX = 30;
            const panelY = 120;
            const panelWidth = CONFIG.CANVAS_WIDTH - 60;
            const panelHeight = 330;
            const finalWin = gameState.currentBet * gameState.currentMultiplier;
            const isWin = gameState.currentMultiplier > 1;
            const currentBalance = getCurrentBalanceDisplay();

            const panel = createSVGElement('rect', {
                x: panelX,
                y: panelY,
                width: panelWidth,
                height: panelHeight,
                rx: 16,
                fill: '#111827',
                opacity: 0.94,
                stroke: '#374151',
                'stroke-width': 2
            });
            elements.uiGroup.appendChild(panel);

            drawText(
                CONFIG.CANVAS_WIDTH / 2,
                panelY + 50,
                'GAME OVER',
                {
                    fontSize: 38,
                    fontWeight: 'bold',
                    fill: '#FF4D4D',
                    stroke: CONFIG.COLORS.TEXT_SHADOW,
                    'stroke-width': 4,
                    'text-anchor': 'middle',
                    'paint-order': 'stroke'
                }
            );

            drawText(CONFIG.CANVAS_WIDTH / 2, panelY + 92, `Score: ${gameState.score}`, {
                fontSize: 22,
                fill: CONFIG.COLORS.TEXT_MAIN,
                'text-anchor': 'middle'
            });

            drawText(CONFIG.CANVAS_WIDTH / 2, panelY + 126, `Bet: ${gameState.currentBet.toFixed(2)}`, {
                fontSize: 18,
                fill: '#D1D5DB',
                'text-anchor': 'middle'
            });

            drawText(CONFIG.CANVAS_WIDTH / 2, panelY + 154, `Multiplier: ${gameState.currentMultiplier.toFixed(2)}x`, {
                fontSize: 18,
                fill: '#A7F3D0',
                'text-anchor': 'middle'
            });

            drawText(CONFIG.CANVAS_WIDTH / 2, panelY + 182, `Payout: ${finalWin.toFixed(2)}`, {
                fontSize: 20,
                fontWeight: 'bold',
                fill: isWin ? '#34D399' : '#FB7185',
                'text-anchor': 'middle'
            });

            drawText(CONFIG.CANVAS_WIDTH / 2, panelY + 212, `Balance: ${currentBalance}`, {
                fontSize: 17,
                fill: '#93C5FD',
                'text-anchor': 'middle'
            });

            drawText(
                CONFIG.CANVAS_WIDTH / 2,
                panelY + 242,
                isWin ? 'Nice run! Cashflow increased.' : 'Try again for a better multiplier.',
                {
                    fontSize: 15,
                    fill: '#E5E7EB',
                    'text-anchor': 'middle'
                }
            );

            drawGameOverButton(
                CONFIG.CANVAS_WIDTH / 2 - 90,
                panelY + 265,
                180,
                44,
                'PLAY AGAIN',
                startGame
            );
        }
    }

    function drawGameOverButton(x, y, width, height, label, onClick) {
        const buttonGroup = createSVGElement('g', {
            style: 'cursor:pointer;'
        });
        let lastActivationTime = 0;

        const buttonRect = createSVGElement('rect', {
            x: x,
            y: y,
            width: width,
            height: height,
            rx: 22,
            fill: '#22C55E',
            stroke: '#16A34A',
            'stroke-width': 2
        });

        const buttonText = createSVGElement('text', {
            x: x + width / 2,
            y: y + 29,
            'text-anchor': 'middle',
            fontSize: 16,
            fontWeight: 'bold',
            fill: '#FFFFFF',
            'letter-spacing': '0.04em'
        });
        buttonText.textContent = label;

        buttonGroup.appendChild(buttonRect);
        buttonGroup.appendChild(buttonText);

        const activateButton = function(evt) {
            const now = Date.now();
            if (now - lastActivationTime < 250) {
                return;
            }
            lastActivationTime = now;

            evt.preventDefault();
            evt.stopPropagation();
            onClick();
        };

        buttonGroup.addEventListener('pointerdown', activateButton, { passive: false });
        buttonGroup.addEventListener('touchstart', activateButton, { passive: false });
        buttonGroup.addEventListener('mousedown', activateButton, { passive: false });

        elements.uiGroup.appendChild(buttonGroup);
    }

    function getCurrentBalanceDisplay() {
        const balanceEl = document.getElementById('user-balance');
        const balanceText = balanceEl ? balanceEl.textContent : '';
        const parsed = parseFloat(balanceText || '0');

        if (Number.isFinite(parsed)) {
            return parsed.toFixed(2);
        }

        return '0.00';
    }

    function drawText(x, y, text, attributes = {}) {
        const textElement = createSVGElement('text', {
            x: x,
            y: y,
            ...attributes
        });
        textElement.textContent = text;
        elements.uiGroup.appendChild(textElement);
    }

    function drawParticles() {
        elements.particlesGroup.innerHTML = '';
        
        gameState.particles.forEach(particle => {
            const circle = createSVGElement('circle', {
                cx: particle.x,
                cy: particle.y,
                r: particle.size,
                fill: particle.color,
                opacity: particle.opacity
            });
            elements.particlesGroup.appendChild(circle);
        });
    }

    // ============================================================================
    // GAME LOGIC
    // ============================================================================

    function startGame() {
        console.log('[FlappyBird] Starting game...');
        
        // Validate bet
        const betValue = parseFloat(elements.betInput?.value || CONFIG.MIN_BET);
        if (isNaN(betValue) || betValue < CONFIG.MIN_BET || betValue > CONFIG.MAX_BET) {
            showNotification('Invalid bet amount!', 'error');
            return;
        }

        const hasBackend = isBackendAvailable();

        if (!hasBackend) {
            startGameLocally(betValue);
            return;
        }
        
        // Call backend to deduct bet using GameBackend helper
        if (typeof GameBackend !== 'undefined') {
            GameBackend.post('/flappybird/start', { bet: betValue }).then(response => {
                if (!response.success) {
                    console.warn('[FlappyBird] Backend error:', response.error);
                    if (isDemoMode()) {
                        startGameLocally(betValue);
                        return;
                    }
                    showNotification(response.error || 'Failed to start game', 'error');
                    return;
                }

                const result = response.data;
                if (result.error) {
                    showNotification(result.msg || result.error, 'error');
                    return;
                }

                if (typeof updateBalance === 'function') {
                    updateBalance(result.balance);
                }

                beginRun(betValue);
                console.log('[FlappyBird] Game started with bet:', betValue);
            }).catch(error => {
                console.error('[FlappyBird] Failed to start game:', error.message);
                if (isDemoMode()) {
                    console.warn('[FlappyBird] Backend unavailable, starting in demo mode');
                    startGameLocally(betValue);
                    return;
                }
                showNotification('Failed to start game. Please try again.', 'error');
            });
        } else {
            // Fallback to jQuery
            $.post('/flappybird/start', {
                _token: $('meta[name="csrf-token"]').attr('content'),
                bet: betValue
            }).then(response => {
                if (response.error) {
                    showNotification(response.msg, 'error');
                    return;
                }

                if (typeof updateBalance === 'function') {
                    updateBalance(response.balance);
                }

                beginRun(betValue);
                console.log('[FlappyBird] Game started with bet:', betValue);
            }).catch(error => {
                if (isDemoMode()) {
                    console.warn('[FlappyBird] Backend unavailable, starting in demo mode:', error);
                    startGameLocally(betValue);
                    return;
                }

                console.error('[FlappyBird] Failed to start game:', error);
                showNotification('Failed to start game. Please try again.', 'error');
            });
        }
    }

    function startGameLocally(betValue) {
        beginRun(betValue);

        console.log('[FlappyBird] Game started in demo mode with bet:', betValue);
    }

    function beginRun(betValue) {
        gameState.phase = 'PLAYING';
        gameState.currentBet = betValue;
        gameState.currentMultiplier = 1.0;
        gameState.score = 0;
        gameState.lastPipeSpawn = Date.now();
        gameState.gameStartTime = Date.now();

        resetDifficultyState();

        gameState.bird = {
            x: CONFIG.BIRD_X,
            y: CONFIG.BIRD_START_Y,
            velocity: 0,
            rotation: 0,
            isAlive: true,
            flapTimer: 0
        };

        gameState.pipes = [];

        updateBettingUI(true);
        updateExternalUI();
        birdJump();
    }

    function resetDifficultyState() {
        gameState.level = 1;
        gameState.currentPipeGap = CONFIG.START_PIPE_GAP;
        gameState.currentPipeSpeed = CONFIG.START_PIPE_SPEED;
        gameState.currentPipeSpawnInterval = CONFIG.START_PIPE_SPAWN_INTERVAL;
    }

    function updateDifficultyProgression() {
        const nextLevel = Math.floor(gameState.score / CONFIG.PIPES_PER_LEVEL) + 1;
        gameState.level = Math.max(1, nextLevel);

        gameState.currentPipeGap = Math.max(
            CONFIG.MIN_PIPE_GAP,
            CONFIG.START_PIPE_GAP - ((gameState.level - 1) * CONFIG.PIPE_GAP_REDUCTION_PER_LEVEL)
        );

        gameState.currentPipeSpeed = Math.min(
            CONFIG.MAX_PIPE_SPEED,
            CONFIG.START_PIPE_SPEED + ((gameState.level - 1) * CONFIG.PIPE_SPEED_INCREASE_PER_LEVEL)
        );

        gameState.currentPipeSpawnInterval = Math.max(
            CONFIG.MIN_PIPE_SPAWN_INTERVAL,
            CONFIG.START_PIPE_SPAWN_INTERVAL - ((gameState.level - 1) * CONFIG.PIPE_SPAWN_REDUCTION_PER_LEVEL)
        );
    }

    function isBackendAvailable() {
        return !!$('meta[name="csrf-token"]').attr('content');
    }

    function isDemoMode() {
        return window.FLAPPYBIRD_DEMO_MODE !== false;
    }

    function updateGameLogic() {
        if (gameState.phase !== 'PLAYING' || !gameState.bird.isAlive) {
            return;
        }

        const bird = gameState.bird;
        
        // Update bird physics
        bird.velocity += CONFIG.GRAVITY;
        bird.velocity = Math.min(bird.velocity, CONFIG.MAX_FALL_SPEED);
        bird.y += bird.velocity;
        
        // Update bird rotation
        if (bird.velocity < 0) {
            bird.rotation = Math.max(-CONFIG.MAX_ROTATION, bird.velocity * CONFIG.ROTATION_SPEED);
        } else {
            bird.rotation = Math.min(CONFIG.MAX_ROTATION, bird.velocity * CONFIG.ROTATION_SPEED);
        }
        
        // Update flap animation
        bird.flapTimer = (bird.flapTimer + 1) % 100;
        
        // Check ground collision with accurate bird radius
        const birdRadius = Math.min(CONFIG.BIRD_WIDTH, CONFIG.BIRD_HEIGHT) / 2.5;
        if (bird.y + birdRadius >= CONFIG.CANVAS_HEIGHT - 60) {
            gameOver('hit ground');
            return;
        }
        
        // Check ceiling collision
        if (bird.y - birdRadius <= 0) {
            bird.y = birdRadius;
            bird.velocity = 0;
        }
        
        // Update pipes
        updatePipes();
        
        // Spawn new pipes
        const now = Date.now();
        if (now - gameState.lastPipeSpawn > gameState.currentPipeSpawnInterval) {
            spawnPipe();
            gameState.lastPipeSpawn = now;
        }
        
        // Update clouds
        updateClouds();
        
        // Update particles
        updateParticles();
    }

    function updatePipes() {
        for (let i = gameState.pipes.length - 1; i >= 0; i--) {
            const pipe = gameState.pipes[i];
            
            // Move pipe
            pipe.x -= pipe.speed;
            
            // Check if pipe is off screen
            if (pipe.x + CONFIG.PIPE_WIDTH < 0) {
                gameState.pipes.splice(i, 1);
                continue;
            }
            
            // Check collision
            if (checkCollision(pipe)) {
                gameOver('hit pipe');
                return;
            }
            
            // Check if bird passed pipe (score)
            if (!pipe.scored && pipe.x + CONFIG.PIPE_WIDTH < gameState.bird.x - CONFIG.BIRD_WIDTH / 2) {
                pipe.scored = true;
                gameState.score += CONFIG.SCORE_PER_PIPE;
                gameState.currentMultiplier = 1.0 + (gameState.score * CONFIG.MULTIPLIER_BASE);
                updateDifficultyProgression();
                
                // Update high score
                if (gameState.score > gameState.highScore) {
                    gameState.highScore = gameState.score;
                    saveHighScore();
                }
                
                // Create particles
                createScoreParticles();
                
                // Update UI displays
                updateExternalUI();
            }
        }
    }

    function spawnPipe() {
        const gap = gameState.currentPipeGap;
        const groundHeight = 60;
        const minTopHeight = CONFIG.PIPE_MIN_HEIGHT;
        
        // Calculate max top height ensuring gap + bottom pipe + ground all fit
        const maxTopHeight = CONFIG.CANVAS_HEIGHT - groundHeight - gap - CONFIG.PIPE_MIN_HEIGHT;
        
        // Ensure we have a valid range
        const safeMaxTopHeight = Math.max(minTopHeight + 30, maxTopHeight);
        
        // Random height for top pipe
        const topHeight = minTopHeight + Math.random() * (safeMaxTopHeight - minTopHeight);
        
        gameState.pipes.push({
            id: Date.now() + Math.random(),
            x: CONFIG.CANVAS_WIDTH,
            topHeight: topHeight,
            gap: gap,
            speed: gameState.currentPipeSpeed,
            scored: false
        });
    }

    function checkCollision(pipe) {
        const bird = gameState.bird;
        
        // Use circular hitbox for more accurate collision (bird is drawn as ellipse)
        // Reduce effective size slightly for better feel
        const birdRadius = Math.min(CONFIG.BIRD_WIDTH, CONFIG.BIRD_HEIGHT) / 2.5;
        const birdLeft = bird.x - birdRadius;
        const birdRight = bird.x + birdRadius;
        const birdTop = bird.y - birdRadius;
        const birdBottom = bird.y + birdRadius;
        
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + CONFIG.PIPE_WIDTH;
        const topPipeBottom = pipe.topHeight;
        const bottomPipeTop = pipe.topHeight + pipe.gap;
        
        // Only check collision if bird is actually within pipe's x range
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
            // Check collision with top pipe - bird hits the bottom edge of top pipe
            if (birdTop < topPipeBottom) {
                return true;
            }
            
            // Check collision with bottom pipe - bird hits the top edge of bottom pipe
            if (birdBottom > bottomPipeTop) {
                return true;
            }
        }
        
        return false;
    }

    function birdJump() {
        if (gameState.phase === 'READY') {
            // Start game on first jump
            startGame();
        } else if (gameState.phase === 'PLAYING' && gameState.bird.isAlive) {
            gameState.bird.velocity = CONFIG.JUMP_VELOCITY;
            gameState.bird.flapTimer = 0;
            gameState.isFlapping = true;
            
            // Reset flapping state after animation
            setTimeout(() => {
                gameState.isFlapping = false;
            }, CONFIG.FLAP_ANIMATION_DURATION);
        }
    }

    function updateClouds() {
        gameState.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            
            // Wrap around
            if (cloud.x < -50) {
                cloud.x = CONFIG.CANVAS_WIDTH + 50;
                cloud.y = Math.random() * (CONFIG.CANVAS_HEIGHT * 0.4);
            }
        });
    }

    function updateParticles() {
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const p = gameState.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3;
            p.opacity -= 0.02;
            p.life--;
            
            if (p.life <= 0 || p.opacity <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
    }

    function createScoreParticles() {
        const colors = ['#FFD700', '#FFA500', '#FF6347', '#00FF00'];
        
        for (let i = 0; i < 10; i++) {
            gameState.particles.push({
                x: gameState.bird.x,
                y: gameState.bird.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 2,
                size: 3 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1,
                life: 60
            });
        }
    }

    function createExplosionParticles(x, y) {
        const colors = ['#FF0000', '#FF6347', '#FFA500', '#FFD700'];
        
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 2 + Math.random() * 4;
            
            gameState.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1,
                life: 40
            });
        }
    }

    function gameOver(reason) {
        console.log('[FlappyBird] Game over:', reason);
        
        gameState.phase = 'GAME_OVER';
        gameState.bird.isAlive = false;
        
        // Create explosion particles
        createExplosionParticles(gameState.bird.x, gameState.bird.y);
        
        // Calculate final win
        const finalWin = gameState.currentBet * gameState.currentMultiplier;
        const isWin = gameState.currentMultiplier > 1;
        
        // Send result to server (if backend is connected)
        if (gameState.currentBet > 0) {
            submitGameResult(isWin, finalWin);
        }
        
        // Update UI
        updateBettingUI(false);
        
        // Show result notification
        setTimeout(() => {
            if (isWin) {
                showNotification(`You won ${finalWin.toFixed(2)}!`, 'success');
            } else {
                showNotification('Better luck next time!', 'error');
            }
        }, 500);
    }

    function cashOut() {
        if (gameState.phase !== 'PLAYING') {
            return;
        }
        
        console.log('[FlappyBird] Cashing out...');
        
        const finalWin = gameState.currentBet * gameState.currentMultiplier;
        
        // End game
        gameState.phase = 'GAME_OVER';
        gameState.bird.isAlive = false;
        
        // Submit result
        submitGameResult(true, finalWin);
        
        // Update UI
        updateBettingUI(false);
        
        // Show notification
        showNotification(`Cashed out: ${finalWin.toFixed(2)}!`, 'success');
    }

    // ============================================================================
    // RENDER LOOP
    // ============================================================================

    function startRenderLoop() {
        function gameLoop() {
            updateGameLogic();
            render();
            gameState.animationId = requestAnimationFrame(gameLoop);
        }
        gameLoop();
    }

    function render() {
        // Render all game elements
        drawBird();
        drawPipes();
        renderClouds();
        drawParticles();
        drawUI();
    }

    // ============================================================================
    // EVENT LISTENERS
    // ============================================================================

    function setupEventListeners() {
        // Play button
        if (elements.playButton) {
            elements.playButton.addEventListener('click', handlePlayButtonClick);
        }
        
        // Cashout button
        if (elements.cashoutButton) {
            elements.cashoutButton.addEventListener('click', cashOut);
        }
        
        // Canvas click (jump)
        if (elements.canvas) {
            elements.canvas.addEventListener('click', birdJump);
        }
        
        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        
        // Bet input validation
        if (elements.betInput) {
            elements.betInput.addEventListener('input', validateBetInput);
        }
    }

    function handlePlayButtonClick(e) {
        e.preventDefault();
        
        if (gameState.phase === 'GAME_OVER' || gameState.phase === 'READY') {
            initializeGameObjects();
            gameState.phase = 'READY';
            gameState.currentBet = 0;
            gameState.currentMultiplier = 1.0;
        }
    }

    function handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            birdJump();
        }
    }

    function validateBetInput() {
        const input = elements.betInput;
        if (!input) return;
        
        let value = parseFloat(input.value);
        
        if (isNaN(value) || value < CONFIG.MIN_BET) {
            value = CONFIG.MIN_BET;
        } else if (value > CONFIG.MAX_BET) {
            value = CONFIG.MAX_BET;
        }
        
        input.value = value;
    }

    // ============================================================================
    // UI UPDATES
    // ============================================================================

    function updateBettingUI(isPlaying) {
        if (elements.playButton) {
            elements.playButton.disabled = isPlaying;
            elements.playButton.style.opacity = isPlaying ? '0.5' : '1';
        }
        
        if (elements.cashoutButton) {
            elements.cashoutButton.style.display = isPlaying ? 'inline-block' : 'none';
        }
        
        if (elements.betInput) {
            elements.betInput.disabled = isPlaying;
        }
    }

    function updateExternalUI() {
        if (elements.multiplierDisplay) {
            elements.multiplierDisplay.textContent = `${gameState.currentMultiplier.toFixed(2)}x`;
        }
        
        if (elements.potentialWinDisplay && gameState.currentBet > 0) {
            const potentialWin = (gameState.currentBet * gameState.currentMultiplier).toFixed(2);
            elements.potentialWinDisplay.textContent = potentialWin;
        }
    }

    // ============================================================================
    // BACKEND INTEGRATION
    // ============================================================================

    function submitGameResult(won, amount) {
        // This integrates with the Laravel backend API

        if (!isBackendAvailable()) {
            if (isDemoMode()) {
                console.log('[FlappyBird] Demo mode: skipping backend result submission');
            }
            return;
        }
        
        // Use GameBackend helper if available, fallback to jQuery
        if (typeof GameBackend !== 'undefined') {
            GameBackend.post('/flappybird/result', {
                bet: gameState.currentBet,
                multiplier: gameState.currentMultiplier,
                score: gameState.score,
                won: won,
                amount: amount
            }).then(response => {
                if (!response.success) {
                    console.error('[FlappyBird] Error submitting result:', response.error);
                    if (!isDemoMode()) {
                        showNotification(response.error || 'Failed to submit result', 'error');
                    }
                    return;
                }

                const result = response.data;
                if (result.error) {
                    console.error('[FlappyBird] Error submitting result:', result.msg);
                    if (!isDemoMode()) {
                        showNotification(result.msg, 'error');
                    }
                    return;
                }

                if (typeof updateBalance === 'function') {
                    updateBalance(result.balance);
                }

                console.log('[FlappyBird] Result submitted successfully');
            }).catch(error => {
                if (isDemoMode()) {
                    console.warn('[FlappyBird] Demo mode: result submission failed:', error.message);
                    return;
                }

                console.error('[FlappyBird] Network error:', error);
                showNotification('Connection error. Please try again.', 'error');
            });
        } else {
            // Fallback to jQuery
            $.post('/flappybird/result', {
                _token: $('meta[name="csrf-token"]').attr('content'),
                bet: gameState.currentBet,
                multiplier: gameState.currentMultiplier,
                score: gameState.score,
                won: won,
                amount: amount
            }).then(response => {
                if (response.error) {
                    console.error('[FlappyBird] Error submitting result:', response.msg);
                    showNotification(response.msg, 'error');
                    return;
                }

                if (typeof updateBalance === 'function') {
                    updateBalance(response.balance);
                }

                console.log('[FlappyBird] Result submitted successfully');
            }).catch(error => {
                if (isDemoMode()) {
                    console.warn('[FlappyBird] Demo mode: result submission failed, continuing locally:', error);
                    return;
                }

                console.error('[FlappyBird] Network error:', error);
                showNotification('Connection error. Please try again.', 'error');
            });
        }
    }
    // ============================================================================

    function loadHighScore() {
        try {
            const saved = localStorage.getItem('flappybird_highscore');
            if (saved) {
                gameState.highScore = parseInt(saved) || 0;
            }
        } catch (e) {
            console.warn('[FlappyBird] Could not load high score:', e);
        }
    }

    function saveHighScore() {
        try {
            localStorage.setItem('flappybird_highscore', gameState.highScore.toString());
        } catch (e) {
            console.warn('[FlappyBird] Could not save high score:', e);
        }
    }

    // ============================================================================
    // NOTIFICATIONS
    // ============================================================================

    function showNotification(message, type) {
        if (elements.resultDisplay) {
            elements.resultDisplay.textContent = message;
            elements.resultDisplay.className = `flappy__result ${type === 'success' ? 'success' : 'danger'}`;
            elements.resultDisplay.style.display = 'block';
            
            setTimeout(() => {
                elements.resultDisplay.style.display = 'none';
            }, 3000);
        }
        
        // Also use noty if available
        if (typeof noty === 'function') {
            noty(message, type === 'success' ? 'success' : 'error');
        }
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        init: init,
        start: startGame,
        jump: birdJump,
        cashOut: cashOut,
        getState: () => gameState,
        getConfig: () => CONFIG
    };
})();

// ============================================================================
// AUTO-INITIALIZE ON DOM READY
// ============================================================================

$(document).ready(function() {
    console.log('[FlappyBird] DOM ready, initializing...');
    FlappyBird.init();
});
