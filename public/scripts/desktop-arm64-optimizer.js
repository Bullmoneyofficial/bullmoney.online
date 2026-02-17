// ═════════════════════════════════════════════════════════════════
// DESKTOP ARM64 OPTIMIZER — Apple Silicon (M1/M2/M3) Optimizations
// Leverages unified memory, Metal API, 8-core architecture
// Detects and optimizes for ARM64 Darwin (macOS) systems
// ═════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  if (typeof window === 'undefined') return;
  if (navigator.userAgent.match(/mobile|android|iphone/i)) return; // Desktop only

  var w = window;
  var doc = document;

  // Wait for orchestrator
  var DESKTOP = w.__BM_DESKTOP__;
  if (!DESKTOP) {
    w.addEventListener('bm-desktop:ready', init);
    return;
  }

  function init() {
    console.log('[ARM64_OPT] Initializing Apple Silicon optimizations...');

    // ═══════════════════════════════════════════════════════════════════
    // 1. APPLE SILICON DETECTION — Detect M1/M2/M3 chips
    // ═══════════════════════════════════════════════════════════════════
    var isAppleSilicon = false;
    var chipGeneration = 0; // 1=M1, 2=M2, 3=M3
    var coreCount = navigator.hardwareConcurrency || 8;
    var memoryGB = navigator.deviceMemory || 16;

    function detectAppleSilicon() {
      var ua = navigator.userAgent.toLowerCase();
      var platform = navigator.platform?.toLowerCase() || '';
      var vendor = navigator.vendor?.toLowerCase() || '';

      // Check for macOS ARM64
      var isMac = ua.includes('mac') || platform.includes('mac') || vendor.includes('apple');
      var isARM = platform.includes('arm') || ua.includes('arm64');
      
      // Alternative detection: Check for WebGL renderer string
      var canvas = doc.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      var renderer = '';
      
      if (gl) {
        var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_GL).toLowerCase();
        }
      }

      // Apple Silicon indicators
      var hasAppleGPU = renderer.includes('apple') || renderer.includes('m1') || renderer.includes('m2') || renderer.includes('m3');
      
      isAppleSilicon = (isMac && isARM) || hasAppleGPU;

      // Estimate chip generation based on cores and memory
      if (isAppleSilicon) {
        if (coreCount >= 10 && memoryGB >= 32) {
          chipGeneration = 3; // Likely M3 Pro/Max
        } else if (coreCount >= 10 || memoryGB >= 16) {
          chipGeneration = 2; // Likely M2 Pro or M3 base
        } else {
          chipGeneration = 1; // Likely M1 or M2 base
        }
      }

      return isAppleSilicon;
    }

    if (!detectAppleSilicon()) {
      console.log('[ARM64_OPT] Not Apple Silicon, skipping ARM optimizations');
      return;
    }

    console.log('[ARM64_OPT] ✓ Apple Silicon detected: M' + chipGeneration + ', ' + coreCount + ' cores, ' + memoryGB + 'GB');

    var state = {
      isAppleSilicon: true,
      chipGeneration: chipGeneration,
      cores: coreCount,
      memoryGB: memoryGB,
      unifiedMemory: true,
      metalSupported: true,
      optimalTier: 3 // Default to tier 3 for Apple Silicon
    };

    // ═══════════════════════════════════════════════════════════════════
    // 2. UNIFIED MEMORY OPTIMIZATION — Leverage CPU/GPU shared memory
    // ═══════════════════════════════════════════════════════════════════
    function optimizeUnifiedMemory() {
      console.log('[ARM64_OPT] Optimizing for unified memory architecture...');

      // Unified memory means textures/buffers are shared between CPU and GPU
      // No need for expensive data transfers - optimize accordingly
      
      // Set globals for other scripts to detect
      w.__BM_UNIFIED_MEMORY__ = true;
      w.__BM_GPU_MEMORY_GB__ = memoryGB; // Full system memory available to GPU
      
      // Tell orchestrator we have abundant GPU memory
      DESKTOP.setState('gpu-memory', memoryGB * 1024); // MB
      DESKTOP.setState('unified-memory', true);
      
      // Enable higher quality settings due to memory abundance
      DESKTOP.setFeature('high-res-textures', true);
      DESKTOP.setFeature('gpu-particles', true);
      DESKTOP.setFeature('advanced-shaders', true);

      console.log('[ARM64_OPT] ✓ Unified memory optimizations active');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. MULTI-CORE OPTIMIZATION — Efficient use of 8 cores (4P + 4E)
    // ═══════════════════════════════════════════════════════════════════
    function optimizeMultiCore() {
      console.log('[ARM64_OPT] Optimizing for ' + coreCount + '-core architecture...');

      // Apple Silicon uses hybrid architecture: Performance + Efficiency cores
      // Assume 50/50 split for M1/M2 (4P + 4E)
      var performanceCores = Math.ceil(coreCount / 2);
      var efficiencyCores = Math.floor(coreCount / 2);

      w.__BM_PERFORMANCE_CORES__ = performanceCores;
      w.__BM_EFFICIENCY_CORES__ = efficiencyCores;

      // Enable parallel operations for multi-core utilization
      DESKTOP.setFeature('parallel-image-decode', true);
      DESKTOP.setFeature('web-workers', true);
      DESKTOP.setFeature('offscreen-canvas', true);

      // Set optimal worker count (use efficiency cores for background tasks)
      w.__BM_OPTIMAL_WORKERS__ = efficiencyCores;

      console.log('[ARM64_OPT] ✓ Multi-core optimizations: ' + performanceCores + 'P + ' + efficiencyCores + 'E cores');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. METAL API OPTIMIZATION — Leverage Metal for GPU acceleration
    // ═══════════════════════════════════════════════════════════════════
    function optimizeMetal() {
      console.log('[ARM64_OPT] Configuring for Metal API (WebGL/WebGPU)...');

      // Metal is macOS GPU API - WebGL/WebGPU use it under the hood
      // Optimize for Metal characteristics
      
      var canvas = doc.createElement('canvas');
      var gl = canvas.getContext('webgl2', {
        powerPreference: 'high-performance',
        antialias: true,
        depth: true,
        stencil: true,
        alpha: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false
      }) || canvas.getContext('webgl', {
        powerPreference: 'high-performance',
        antialias: true,
        depth: true,
        stencil: true,
        alpha: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false
      });

      if (!gl) {
        console.warn('[ARM64_OPT] WebGL not available');
        return;
      }

      // Check for WebGL extensions that Metal supports well
      var extensions = {
        anisotropic: gl.getExtension('EXT_texture_filter_anisotropic'),
        floatTextures: gl.getExtension('OES_texture_float'),
        drawBuffers: gl.getExtension('WEBGL_draw_buffers'),
        instancedArrays: gl.getExtension('ANGLE_instanced_arrays'),
        vao: gl.getExtension('OES_vertex_array_object')
      };

      // Metal excels at instancing and draw calls
      if (extensions.instancedArrays) {
        w.__BM_INSTANCING_SUPPORTED__ = true;
        DESKTOP.setFeature('gpu-instancing', true);
      }

      // Metal handles high anisotropic filtering well
      if (extensions.anisotropic) {
        var maxAniso = gl.getParameter(extensions.anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        w.__BM_MAX_ANISOTROPY__ = maxAniso;
        console.log('[ARM64_OPT] Max anisotropic filtering: ' + maxAniso + 'x');
      }

      // Enable advanced rendering features
      DESKTOP.setFeature('metal-optimized', true);
      DESKTOP.setFeature('gpu-compute', true);

      console.log('[ARM64_OPT] ✓ Metal API optimizations active');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. PERFORMANCE TIER UPGRADE — Set tier 3+ for Apple Silicon
    // ═══════════════════════════════════════════════════════════════════
    function upgradeTier() {
      // Apple Silicon should always be tier 3 or higher
      var currentTier = w.__BM_PERFORMANCE_TIER__ || 1;
      
      // Upgrade tier based on chip generation
      var newTier = 3; // Minimum tier 3
      
      if (chipGeneration >= 2 && memoryGB >= 16) {
        newTier = 4; // M2+ with 16GB+ = tier 4
      }
      
      if (chipGeneration >= 3 || (chipGeneration >= 2 && memoryGB >= 32)) {
        newTier = 5; // M3 or M2 Pro/Max = tier 5 (max)
      }

      if (newTier > currentTier) {
        w.__BM_PERFORMANCE_TIER__ = newTier;
        console.log('[ARM64_OPT] ✓ Tier upgraded: ' + currentTier + ' → ' + newTier);
        
        DESKTOP.emit('tier-changed', { 
          tier: newTier, 
          reason: 'apple-silicon',
          oldTier: currentTier 
        });
      }

      state.optimalTier = newTier;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. SPLINE/3D OPTIMIZATION — Maximize graphics performance
    // ═══════════════════════════════════════════════════════════════════
    function optimize3DRendering() {
      console.log('[ARM64_OPT] Optimizing 3D rendering for Apple GPU...');

      // Apple GPUs excel at high-quality rendering with unified memory
      w.__BM_3D_QUALITY__ = 'ultra';
      w.__BM_SPLINE_QUALITY__ = 'high';
      w.__BM_ANTIALIASING__ = 4; // 4x MSAA is efficient on Apple Silicon

      // Enable all 3D features
      DESKTOP.setFeature('spline-enabled', true);
      DESKTOP.setFeature('realtime-shadows', true);
      DESKTOP.setFeature('post-processing', true);
      DESKTOP.setFeature('hdr-rendering', true);

      // Set render scale based on tier
      var renderScale = 1.0;
      if (state.optimalTier >= 4) {
        renderScale = 1.5; // Supersampling for ultra quality
      }
      w.__BM_RENDER_SCALE__ = renderScale;

      // Apple GPU can handle more concurrent draw calls
      w.__BM_MAX_DRAW_CALLS__ = 10000;

      console.log('[ARM64_OPT] ✓ 3D rendering: quality=' + w.__BM_3D_QUALITY__ + ', scale=' + renderScale);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. MEMORY MANAGEMENT — Optimize for 16GB unified memory
    // ═══════════════════════════════════════════════════════════════════
    function optimizeMemoryUsage() {
      console.log('[ARM64_OPT] Optimizing memory for ' + memoryGB + 'GB unified memory...');

      // With 16GB+, we can be more aggressive with caching
      w.__BM_CACHE_SIZE_MB__ = Math.min(memoryGB * 128, 2048); // Up to 2GB cache
      w.__BM_IMAGE_CACHE_MB__ = Math.min(memoryGB * 64, 1024); // Up to 1GB image cache
      w.__BM_SPLINE_CACHE_SCENES__ = memoryGB >= 16 ? 7 : 3; // Cache all scenes if 16GB+

      // Increase memory thresholds (we have more headroom)
      w.__BM_MEMORY_WARNING_THRESHOLD__ = 85; // Alert at 85% (vs 75% default)
      w.__BM_MEMORY_CRITICAL_THRESHOLD__ = 95; // Critical at 95% (vs 85% default)

      // Enable advanced caching strategies
      DESKTOP.setFeature('aggressive-prefetch', true);
      DESKTOP.setFeature('smart-cache', true);
      DESKTOP.setFeature('memory-pool', true);

      console.log('[ARM64_OPT] ✓ Memory optimizations: cache=' + w.__BM_CACHE_SIZE_MB__ + 'MB');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. SCROLL & INTERACTION OPTIMIZATION — 120Hz ProMotion support
    // ═══════════════════════════════════════════════════════════════════
    function optimizeInteractions() {
      console.log('[ARM64_OPT] Optimizing for ProMotion (up to 120Hz)...');

      // Detect actual refresh rate (ProMotion adapts 10-120Hz)
      var refreshRate = 60; // Default
      
      if (w.__BM_DETECTED_REFRESH_RATE__) {
        refreshRate = w.__BM_DETECTED_REFRESH_RATE__;
      }

      // Enable high-FPS rendering for 120Hz displays
      if (refreshRate >= 120) {
        w.__BM_TARGET_FPS__ = 120;
        DESKTOP.setFeature('high-fps-mode', true);
        console.log('[ARM64_OPT] ✓ 120Hz ProMotion detected');
      } else {
        w.__BM_TARGET_FPS__ = 60;
      }

      // Enable smooth scrolling optimizations
      DESKTOP.setFeature('smooth-scroll', true);
      DESKTOP.setFeature('scroll-prediction', true);
      DESKTOP.setFeature('momentum-scroll', true);

      // Optimize for trackpad/Magic Mouse gestures
      DESKTOP.setFeature('precision-scroll', true);
      DESKTOP.setFeature('gesture-acceleration', true);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 9. TURBOPACK COMPATIBILITY — Optimize for Next.js 16 + Turbopack
    // ═══════════════════════════════════════════════════════════════════
    function optimizeTurbopack() {
      console.log('[ARM64_OPT] Optimizing for Turbopack fast refresh...');

      // Turbopack uses fast HMR - ensure our scripts handle it
      w.__BM_TURBOPACK_MODE__ = true;
      w.__BM_FAST_REFRESH__ = true;

      // Cache bust more aggressively with Turbopack (rebuilds are instant)
      DESKTOP.setFeature('fast-refresh-compat', true);
      
      // Enable module preloading hints for Turbopack
      DESKTOP.setFeature('module-preload', true);

      console.log('[ARM64_OPT] ✓ Turbopack optimizations active');
    }

    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════
    var api = {
      getState: function() { return state; },
      isAppleSilicon: function() { return isAppleSilicon; },
      getChipGeneration: function() { return chipGeneration; },
      getCoreCount: function() { return coreCount; },
      getTier: function() { return state.optimalTier; },
      debug: function() {
        console.group('[ARM64_OPT] Apple Silicon Status');
        console.log('Chip: M' + chipGeneration);
        console.log('Cores: ' + coreCount);
        console.log('Memory: ' + memoryGB + 'GB (unified)');
        console.log('Tier: ' + state.optimalTier);
        console.log('Features:', {
          unifiedMemory: state.unifiedMemory,
          metalSupported: state.metalSupported,
          highQuality3D: w.__BM_3D_QUALITY__,
          targetFPS: w.__BM_TARGET_FPS__
        });
        console.groupEnd();
      }
    };

    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZE ALL OPTIMIZATIONS
    // ═══════════════════════════════════════════════════════════════════
    function runOptimizations() {
      console.log('[ARM64_OPT] Running Apple Silicon optimizations...');

      upgradeTier();              // P0: Set high performance tier
      optimizeUnifiedMemory();    // P1: Leverage shared CPU/GPU memory
      optimizeMultiCore();        // P2: Utilize 8-core architecture
      optimizeMetal();            // P3: Configure for Metal API
      optimize3DRendering();      // P4: Max graphics quality
      optimizeMemoryUsage();      // P5: Optimize for 16GB
      optimizeInteractions();     // P6: 120Hz ProMotion support
      optimizeTurbopack();        // P7: Next.js 16 compatibility

      // Register with orchestrator
      DESKTOP.register('arm64-optimizer', api, 95);
      console.log('[ARM64_OPT] ✓ Registered with orchestrator');

      // Global debug access
      w.__ARM64_OPT__ = api;

      // Emit ready event
      try {
        w.dispatchEvent(new CustomEvent('bm-arm64:optimized', {
          detail: { 
            tier: state.optimalTier,
            chip: 'M' + chipGeneration,
            cores: coreCount,
            memory: memoryGB
          }
        }));
      } catch (e) {}

      console.log('[ARM64_OPT] ✓ All optimizations complete - Tier ' + state.optimalTier + ' active');
    }

    runOptimizations();
  }

  // If orchestrator is already ready, init immediately
  if (DESKTOP && DESKTOP.ready) {
    init();
  }
})();
