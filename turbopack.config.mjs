/**
 * ═════════════════════════════════════════════════════════════════
 * TURBOPACK ARM64 CONFIGURATION
 * Optimizes Turbopack compilation for Apple Silicon
 * Automatically loaded by Next.js when present
 * ═════════════════════════════════════════════════════════════════
 */

import os from 'os';

const platform = os.platform();
const arch = os.arch();
const cpus = os.cpus().length;

const isAppleSilicon = platform === 'darwin' && arch === 'arm64';

// Only export config if on Apple Silicon
export default isAppleSilicon ? {
  // Use performance cores for parallel compilation
  workers: Math.ceil(cpus / 2), // 4 P-cores on M1/M2 (8-core)
  
  // Optimize memory usage with unified architecture
  memoryLimit: os.totalmem() / (1024 ** 2) * 0.5, // 50% of total RAM in MB
  
  // Enable native ARM64 optimizations
  optimization: {
    // Use native SWC ARM64 binary
    swc: {
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
            development: process.env.NODE_ENV === 'development',
            refresh: process.env.NODE_ENV === 'development',
          },
        },
        // Optimize for ARM64 SIMD instructions
        minify: {
          compress: {
            passes: 2,
            ecma: 2020,
          },
          mangle: {
            safari10: true, // macOS Safari compatibility
          },
        },
      },
    },
    
    // Parallel module processing
    moduleIds: 'deterministic',
    
    // Aggressive tree shaking
    usedExports: true,
    sideEffects: true,
    
    // Split chunks for better caching
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk for stable hashing
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Common chunk for shared code
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },
  },
  
  // Module resolution optimizations
  resolve: {
    // Skip symlink resolution (faster)
    symlinks: false,
    
    // Cache module resolution
    cache: true,
    
    // Common extensions (reduces lookup time)
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    
    // Prefer ES modules
    mainFields: ['module', 'main'],
    
    // Alias for faster resolution
    alias: {
      // Optimize React for production
      'react/jsx-runtime': 'react/jsx-runtime.js',
      'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
    },
  },
  
  // Cache configuration for SSD optimization
  cache: {
    type: 'filesystem',
    
    // Optimize for Apple SSD (no compression needed, fast reads/writes)
    compression: false,
    
    // Store cache in .next/cache directory
    cacheDirectory: '.next/cache',
    
    // Cache build artifacts for 7 days
    maxAge: 1000 * 60 * 60 * 24 * 7,
    
    // Keep more generations in memory (unified memory benefit)
    maxMemoryGenerations: 10,
    
    // Build dependencies for cache invalidation
    buildDependencies: {
      config: ['next.config.mjs', 'turbopack.config.mjs'],
    },
  },
  
  // Performance hints (relaxed for 16GB RAM)
  performance: {
    maxEntrypointSize: 1024 * 1024, // 1MB
    maxAssetSize: 1024 * 1024, // 1MB
    hints: 'warning',
  },
  
  // Loader configuration
  module: {
    rules: [
      // TypeScript/JavaScript - use SWC native ARM binary
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              target: 'es2022',
            },
          },
        },
      },
      
      // CSS modules (optimized)
      {
        test: /\.module\.css$/,
        use: [
          {
            loader: 'css-loader',
            options: {
              modules: {
                mode: 'local',
                localIdentName: '[hash:base64:8]',
              },
            },
          },
        ],
      },
    ],
  },
  
  // External packages (don't bundle)
  externals: {
    // Keep native modules external
    'canvas': 'commonjs canvas',
    'sharp': 'commonjs sharp',
  },
  
  // Stats for better debugging
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: true,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: true,
    errorDetails: true,
    warnings: true,
    publicPath: false,
  },
} : {};
