"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import DottedMap from "dotted-map";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
    color?: string; // Optional color for this specific line
  }>;
  lineColor?: string;
  showCryptoCoins?: boolean;
}

// Continent label positions (approximate centers)
const CONTINENT_LABELS = [
  { name: 'NORTH AMERICA', lat: 45, lng: -100 },
  { name: 'SOUTH AMERICA', lat: -15, lng: -60 },
  { name: 'EUROPE', lat: 50, lng: 10 },
  { name: 'AFRICA', lat: 0, lng: 20 },
  { name: 'ASIA', lat: 35, lng: 90 },
  { name: 'OCEANIA', lat: -25, lng: 135 },
];

// Hotspot finance/crypto cities — real-world lat/lng (Mercator projection handles the rest)
const HOTSPOT_CITIES = [
  { name: 'New York', title: 'Wall Street & Crypto HQ', lat: 40.7128, lng: -74.006, color: '#00D4FF' },
  { name: 'London', title: 'Global FX Capital', lat: 51.5074, lng: -0.1278, color: '#FF6B35' },
  { name: 'Singapore', title: 'Asia Crypto Gateway', lat: 1.3521, lng: 103.8198, color: '#00FFA3' },
  { name: 'Dubai', title: 'Blockchain Free Zone', lat: 25.2048, lng: 55.2708, color: '#F7931A' },
  { name: 'Tokyo', title: 'Largest BTC Market', lat: 35.6762, lng: 139.6503, color: '#E84142' },
  { name: 'Hong Kong', title: 'Digital Asset Hub', lat: 22.3193, lng: 114.1694, color: '#627EEA' },
  { name: 'Zurich', title: 'Crypto Valley', lat: 47.3769, lng: 8.5417, color: '#F3BA2F' },
];

// Shooting star / meteor data — staggered across the top of the map
const METEORS = [
  { startX: 80, startY: 6, angle: 28, length: 75, delay: 0, dur: 1.0 },
  { startX: 200, startY: 3, angle: 22, length: 95, delay: 2.8, dur: 1.3 },
  { startX: 350, startY: 10, angle: 33, length: 60, delay: 5.2, dur: 0.8 },
  { startX: 460, startY: 2, angle: 18, length: 110, delay: 7.8, dur: 1.5 },
  { startX: 580, startY: 14, angle: 26, length: 70, delay: 10.5, dur: 0.9 },
  { startX: 700, startY: 4, angle: 35, length: 65, delay: 13.0, dur: 1.1 },
  { startX: 150, startY: 8, angle: 30, length: 85, delay: 15.5, dur: 1.2 },
  { startX: 310, startY: 5, angle: 24, length: 100, delay: 18.0, dur: 1.4 },
  { startX: 520, startY: 11, angle: 38, length: 55, delay: 20.5, dur: 0.7 },
  { startX: 670, startY: 7, angle: 20, length: 90, delay: 23.0, dur: 1.3 },
  { startX: 420, startY: 1, angle: 29, length: 78, delay: 26.0, dur: 1.0 },
  { startX: 760, startY: 9, angle: 32, length: 60, delay: 28.5, dur: 0.85 },
];

// Coins that travel along connection paths - each path gets a different coin
const TRAVELING_COINS = [
  { symbol: '₿', label: 'BTC', color: '#F7931A' },
  { symbol: 'Ξ', label: 'ETH', color: '#627EEA' },
  { symbol: '◎', label: 'SOL', color: '#00FFA3' },
  { symbol: '✕', label: 'XRP', color: '#00AAE4' },
  { symbol: '◆', label: 'BNB', color: '#F3BA2F' },
  { symbol: 'Ð', label: 'DOGE', color: '#C2A633' },
  { symbol: '●', label: 'ADA', color: '#0033AD' },
  { symbol: '◈', label: 'AVAX', color: '#E84142' },
];

// Crypto coins data - reduced for performance (6 coins instead of 15)
const CRYPTO_COINS_DATA = [
  // Major coins only - spread across oceans (real lat/lng)
  { symbol: 'BTC', color: '#F7931A', lat: 20, lng: -150, delay: 0 },
  { symbol: 'ETH', color: '#627EEA', lat: -10, lng: -45, delay: 0.3 },
  { symbol: 'SOL', color: '#00FFA3', lat: 30, lng: -35, delay: 0.6 },
  { symbol: 'XRP', color: '#00AAE4', lat: -15, lng: 75, delay: 0.9 },
  { symbol: 'BNB', color: '#F3BA2F', lat: 5, lng: 170, delay: 1.2 },
  { symbol: 'DOGE', color: '#C2A633', lat: -25, lng: 85, delay: 1.5 },
];

// ═══════ MERCATOR PROJECTION — matches DottedMap's EPSG:3857 projection ═══════
const DEG2RAD = Math.PI / 180;
const LAT_MIN = -56;
const LAT_MAX = 71;
const LNG_MIN = -179;
const LNG_MAX = 179;

const mercatorY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * DEG2RAD) / 2));

const MERC_Y_MIN = mercatorY(LAT_MIN);
const MERC_Y_MAX = mercatorY(LAT_MAX);
const MERC_Y_RANGE = MERC_Y_MAX - MERC_Y_MIN;
const MERC_X_MIN = LNG_MIN * DEG2RAD;
const MERC_X_MAX = LNG_MAX * DEG2RAD;
const MERC_X_RANGE = MERC_X_MAX - MERC_X_MIN;

// SVG viewBox matching DottedMap's Mercator aspect ratio
const SVG_H = 400;
const SVG_W = Math.round(SVG_H * MERC_X_RANGE / MERC_Y_RANGE); // ~841

export default function WorldMap({
  dots = [],
  lineColor = "#ffffff",
  showCryptoCoins = true,
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  // Memoize the map to prevent recreation on each render
  const svgMap = useMemo(() => {
    const map = new DottedMap({ height: 100, grid: "diagonal" });
    return map.getSVG({
      radius: 0.22,
      color: "#FFFFFF60",
      shape: "circle",
      backgroundColor: "#000000",
    });
  }, []);

  // Web Mercator projection matching DottedMap's internal EPSG:3857
  const projectPoint = (lat: number, lng: number) => {
    const clampedLat = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
    const x = SVG_W * ((lng * DEG2RAD) - MERC_X_MIN) / MERC_X_RANGE;
    const y = SVG_H * (MERC_Y_MAX - mercatorY(clampedLat)) / MERC_Y_RANGE;
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  return (
    <div 
      className="w-full h-full min-h-[60vh] md:h-screen md:w-screen bg-black relative font-sans overflow-hidden flex items-center justify-center"
    >
      {/* Fake ocean wave overlays */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div
          className="absolute bottom-[18%] left-0 w-[200%] h-[2px] opacity-[0.07] animate-[waveSlide_12s_linear_infinite]"
          style={{
            background: 'repeating-linear-gradient(90deg, transparent 0%, rgba(100,180,255,0.5) 25%, transparent 50%)',
            backgroundSize: '400px 2px',
          }}
        />
        <div
          className="absolute bottom-[30%] left-0 w-[200%] h-[1.5px] opacity-[0.05] animate-[waveSlide_18s_linear_infinite_reverse]"
          style={{
            background: 'repeating-linear-gradient(90deg, transparent 0%, rgba(100,180,255,0.4) 25%, transparent 50%)',
            backgroundSize: '350px 2px',
          }}
        />
        <div
          className="absolute bottom-[45%] left-0 w-[200%] h-[1px] opacity-[0.04] animate-[waveSlide_15s_linear_infinite]"
          style={{
            background: 'repeating-linear-gradient(90deg, transparent 0%, rgba(100,180,255,0.3) 25%, transparent 50%)',
            backgroundSize: '300px 2px',
          }}
        />
      </div>
      <div className="relative w-full h-full max-w-none aspect-[2/1] md:aspect-auto md:h-full">
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          className="absolute inset-0 w-full h-full object-cover [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
          alt="world map"
          draggable={false}
        />
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        >
        {/* Continent Labels - 3D Effect */}
        {CONTINENT_LABELS.map((continent, i) => {
          const pos = projectPoint(continent.lat, continent.lng);
          return (
            <g key={`continent-${i}`}>
              {/* Shadow layer for 3D depth */}
              <motion.text
                x={pos.x + 1}
                y={pos.y + 1}
                textAnchor="middle"
                fill="rgba(0,0,0,0.5)"
                fontSize="14"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.15em"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.15 * i }}
              >
                {continent.name}
              </motion.text>
              {/* Main text layer */}
              <motion.text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                fill="rgba(255,255,255,0.6)"
                fontSize="14"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.15em"
                style={{
                  textShadow: '0 0 10px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.5)',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.15 * i }}
              >
                {continent.name}
              </motion.text>
            </g>
          );
        })}

        {/* Connection paths */}
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          const pathColor = dot.color || lineColor;
          const gradientId = `path-gradient-${i}`;
          return (
            <g key={`path-group-${i}`}>
              {/* Glow effect */}
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke={pathColor}
                strokeWidth="4"
                strokeOpacity="0.2"
                filter="blur(3px)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 1.5,
                  delay: 0.4 * i,
                  ease: "easeOut",
                }}
              />
              {/* Main path */}
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 1.5,
                  delay: 0.4 * i,
                  ease: "easeOut",
                }}
              />
              {/* Traveling crypto coin animation along path - cycles through different coins per path */}
              {(() => {
                const coin = TRAVELING_COINS[i % TRAVELING_COINS.length];
                const totalDuration = 4;
                const baseDelay = 0.5 * i + 1.5;
                const repeatDelay = 8;
                return (
                  <>
                    {/* Moving coin */}
                    <motion.g
                      initial={{ offsetDistance: "0%", opacity: 0, scale: 1 }}
                      animate={{
                        offsetDistance: "100%",
                        opacity: [0, 1, 1, 1, 1],
                        scale: [1, 1, 1, 1.8, 0],
                      }}
                      transition={{
                        duration: totalDuration,
                        delay: baseDelay,
                        repeat: Infinity,
                        repeatDelay: repeatDelay,
                        ease: "linear",
                        scale: {
                          duration: totalDuration,
                          delay: baseDelay,
                          repeat: Infinity,
                          repeatDelay: repeatDelay,
                          times: [0, 0.85, 0.92, 0.97, 1],
                          ease: "easeOut",
                        },
                        opacity: {
                          duration: totalDuration,
                          delay: baseDelay,
                          repeat: Infinity,
                          repeatDelay: repeatDelay,
                          times: [0, 0.05, 0.85, 0.97, 1],
                          ease: "linear",
                        },
                      }}
                      style={{
                        offsetPath: `path("${createCurvedPath(startPoint, endPoint)}")`,
                        offsetRotate: "0deg",
                        transformOrigin: "0px 0px",
                      }}
                    >
                      {/* Coin glow */}
                      <circle
                        cx="0"
                        cy="0"
                        r="8"
                        fill={coin.color}
                        opacity="0.25"
                      />
                      {/* Main coin body */}
                      <circle
                        cx="0"
                        cy="0"
                        r="5.5"
                        fill={coin.color}
                      />
                      {/* Inner ring for 3D depth */}
                      <circle
                        cx="0"
                        cy="0"
                        r="4.5"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="0.4"
                      />
                      {/* Coin symbol */}
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="6"
                        fontWeight="bold"
                        fontFamily="system-ui, sans-serif"
                      >
                        {coin.symbol}
                      </text>
                      {/* Shine highlight */}
                      <ellipse
                        cx="-1.5"
                        cy="-1.5"
                        rx="2"
                        ry="1"
                        fill="rgba(255,255,255,0.35)"
                      />
                    </motion.g>
                    {/* Explosion burst at endpoint */}
                    {[0, 1, 2, 3, 4, 5].map((burstIdx) => {
                      const angle = (burstIdx * 60) * (Math.PI / 180);
                      const burstDist = 18;
                      return (
                        <motion.circle
                          key={`burst-${i}-${burstIdx}`}
                          cx={endPoint.x}
                          cy={endPoint.y}
                          r="2.5"
                          fill={coin.color}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: [0, 0, 0.9, 0],
                            scale: [0, 0, 1, 0],
                            cx: [endPoint.x, endPoint.x, endPoint.x + Math.cos(angle) * burstDist, endPoint.x + Math.cos(angle) * burstDist * 1.5],
                            cy: [endPoint.y, endPoint.y, endPoint.y + Math.sin(angle) * burstDist, endPoint.y + Math.sin(angle) * burstDist * 1.5],
                          }}
                          transition={{
                            duration: totalDuration + 0.6,
                            delay: baseDelay,
                            repeat: Infinity,
                            repeatDelay: repeatDelay - 0.6,
                            times: [0, 0.9, 0.95, 1],
                            ease: "easeOut",
                          }}
                        />
                      );
                    })}
                    {/* Central explosion flash */}
                    <motion.circle
                      cx={endPoint.x}
                      cy={endPoint.y}
                      r="4"
                      fill={coin.color}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 0, 0.8, 0],
                        scale: [0, 0, 3, 0],
                      }}
                      transition={{
                        duration: totalDuration + 0.6,
                        delay: baseDelay,
                        repeat: Infinity,
                        repeatDelay: repeatDelay - 0.6,
                        times: [0, 0.9, 0.95, 1],
                        ease: "easeOut",
                      }}
                    />
                  </>
                );
              })()}
              {/* Gradient definition for this path */}
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={pathColor} stopOpacity="0" />
                  <stop offset="5%" stopColor={pathColor} stopOpacity="1" />
                  <stop offset="95%" stopColor={pathColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={pathColor} stopOpacity="0" />
                </linearGradient>
              </defs>
            </g>
          );
        })}

        {/* Endpoint dots with enhanced animations */}
        {dots.map((dot, i) => {
          const pathColor = dot.color || lineColor;
          return (
            <g key={`points-group-${i}`}>
              <g key={`start-${i}`}>
                {/* Core dot - simplified, no pulse */}
                <circle
                  cx={projectPoint(dot.start.lat, dot.start.lng).x}
                  cy={projectPoint(dot.start.lat, dot.start.lng).y}
                  r="4"
                  fill={pathColor}
                />
                {/* Single subtle pulse ring - slower animation */}
                <circle
                  cx={projectPoint(dot.start.lat, dot.start.lng).x}
                  cy={projectPoint(dot.start.lat, dot.start.lng).y}
                  r="4"
                  fill={pathColor}
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    from="4"
                    to="10"
                    dur="3s"
                    begin={`${i * 0.5}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.4"
                    to="0"
                    dur="3s"
                    begin={`${i * 0.5}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
              <g key={`end-${i}`}>
                {/* Core dot - simplified, no pulse */}
                <circle
                  cx={projectPoint(dot.end.lat, dot.end.lng).x}
                  cy={projectPoint(dot.end.lat, dot.end.lng).y}
                  r="4"
                  fill={pathColor}
                />
                {/* Single subtle pulse ring - slower animation */}
                <circle
                  cx={projectPoint(dot.end.lat, dot.end.lng).x}
                  cy={projectPoint(dot.end.lat, dot.end.lng).y}
                  r="4"
                  fill={pathColor}
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    from="4"
                    to="10"
                    dur="3s"
                    begin={`${i * 0.5 + 0.3}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.4"
                    to="0"
                    dur="3s"
                    begin={`${i * 0.5 + 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </g>
          );
        })}

        {/* Floating Crypto Coins in Ocean Areas - wave drift */}
        {showCryptoCoins && CRYPTO_COINS_DATA.map((coin, i) => {
          const pos = projectPoint(coin.lat, coin.lng);
          const bobDur = 3 + (i * 0.7);
          const swayDur = 6 + (i * 1.2);
          const tiltDur = 4 + (i * 0.9);
          
          return (
            <motion.g
              key={`crypto-${coin.symbol}-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: coin.delay,
                ease: "easeOut"
              }}
            >
              {/* Horizontal drift / sway */}
              <motion.g
                animate={{
                  x: [-8, 8, -8],
                }}
                transition={{
                  duration: swayDur,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Vertical bob (wave up/down) */}
                <motion.g
                  animate={{
                    y: [-5, 5, -5],
                  }}
                  transition={{
                    duration: bobDur,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {/* Tilt / rotation for wave rocking */}
                  <motion.g
                    animate={{
                      rotate: [-6, 6, -6],
                    }}
                    transition={{
                      duration: tiltDur,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                  >
                    {/* Animated shadow that stretches with wave */}
                    <motion.ellipse
                      cx={pos.x}
                      cy={pos.y + 14}
                      fill="rgba(0,0,0,0.2)"
                      animate={{
                        rx: [6, 8, 6],
                        ry: [2, 3, 2],
                        opacity: [0.25, 0.15, 0.25],
                      }}
                      transition={{
                        duration: bobDur,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Water ripple rings around coin */}
                    <circle
                      cx={pos.x}
                      cy={pos.y + 10}
                      r="10"
                      fill="none"
                      stroke="rgba(100,180,255,0.15)"
                      strokeWidth="0.5"
                    >
                      <animate attributeName="r" values="10;18;10" dur={`${bobDur + 1}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0;0.2" dur={`${bobDur + 1}s`} repeatCount="indefinite" />
                    </circle>
                    <circle
                      cx={pos.x}
                      cy={pos.y + 10}
                      r="8"
                      fill="none"
                      stroke="rgba(100,180,255,0.1)"
                      strokeWidth="0.3"
                    >
                      <animate attributeName="r" values="8;14;8" dur={`${bobDur + 2}s`} begin="0.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.15;0;0.15" dur={`${bobDur + 2}s`} begin="0.5s" repeatCount="indefinite" />
                    </circle>

                    {/* Main coin circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="11"
                      fill={coin.color}
                      opacity="0.9"
                    />
                    
                    {/* Coin inner ring (3D effect) */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="9"
                      fill="none"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="0.5"
                    />
                    
                    {/* Coin symbol text */}
                    <text
                      x={pos.x}
                      y={pos.y + 3}
                      textAnchor="middle"
                      fill="#FFF"
                      fontSize="5.5"
                      fontWeight="bold"
                      fontFamily="system-ui, sans-serif"
                    >
                      {coin.symbol}
                    </text>
                    
                    {/* Shine highlight */}
                    <ellipse
                      cx={pos.x - 3}
                      cy={pos.y - 3}
                      rx="3"
                      ry="1.5"
                      fill="rgba(255,255,255,0.35)"
                    />
                  </motion.g>
                </motion.g>
              </motion.g>
            </motion.g>
          );
        })}

        {/* ═══════ BULLMONEY BRAND — South Africa ═══════ */}
        {(() => {
          const saPos = projectPoint(isDesktop ? -50 : -22, 25); // Lower on desktop
          const letters = 'BULLMONEY'.split('');
          return (
            <g>
              {/* Animated underline bar */}
              <motion.line
                x1={saPos.x - 30}
                y1={saPos.y + 5}
                x2={saPos.x + 30}
                y2={saPos.y + 5}
                stroke="rgb(var(--accent-rgb, 0 130 255))"
                strokeWidth="0.8"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 6, repeat: Infinity, repeatType: "loop", times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
              />
              {/* Glow diamond shape behind text */}
              <motion.path
                d={`M ${saPos.x} ${saPos.y - 18} L ${saPos.x + 38} ${saPos.y} L ${saPos.x} ${saPos.y + 8} L ${saPos.x - 38} ${saPos.y} Z`}
                fill="none"
                stroke="rgba(0,130,255,0.2)"
                strokeWidth="0.6"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.8, 1.1, 0.8], opacity: [0, 0.4, 0] }}
                transition={{ duration: 6, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                style={{ transformOrigin: `${saPos.x}px ${saPos.y}px` }}
              />
              {/* Second diamond ring offset */}
              <motion.path
                d={`M ${saPos.x} ${saPos.y - 14} L ${saPos.x + 32} ${saPos.y} L ${saPos.x} ${saPos.y + 6} L ${saPos.x - 32} ${saPos.y} Z`}
                fill="none"
                stroke="rgba(0,130,255,0.15)"
                strokeWidth="0.4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.3, 1], opacity: [0, 0.3, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 0.5 }}
                style={{ transformOrigin: `${saPos.x}px ${saPos.y}px` }}
              />
              {/* Each letter animated individually */}
              {letters.map((letter, li) => {
                const letterX = saPos.x - 24 + li * 6;
                return (
                  <motion.text
                    key={`bm-letter-${li}`}
                    x={letterX}
                    y={saPos.y}
                    textAnchor="middle"
                    fill="rgba(0,130,255,1)"
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="system-ui, sans-serif"
                    letterSpacing="0.1em"
                    initial={{ opacity: 0, y: saPos.y + 10 }}
                    animate={{
                      opacity: [0, 1, 1, 1, 0],
                      y: [saPos.y + 8, saPos.y, saPos.y - 2, saPos.y, saPos.y - 8],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      repeatType: "loop",
                      repeatDelay: 0.5,
                      delay: li * 0.08,
                      times: [0, 0.15, 0.5, 0.85, 1],
                      ease: "easeInOut",
                    }}
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(0,130,255,0.8)) drop-shadow(0 0 10px rgba(0,130,255,0.5)) drop-shadow(0 0 20px rgba(0,130,255,0.3))',
                    }}
                  >
                    {letter}
                  </motion.text>
                );
              })}
              {/* Shadow/reflection text below */}
              <motion.text
                x={saPos.x}
                y={saPos.y + 12}
                textAnchor="middle"
                fill="rgba(0,130,255,0.15)"
                fontSize="10"
                fontWeight="900"
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.1em"
                initial={{ opacity: 0, scaleY: -0.5 }}
                animate={{
                  opacity: [0, 0.15, 0.15, 0],
                  scaleY: [-0.4, -0.5, -0.5, -0.4],
                }}
                transition={{ duration: 6, repeat: Infinity, repeatType: "loop", repeatDelay: 0.5, ease: "easeInOut" }}
                style={{
                  transformOrigin: `${saPos.x}px ${saPos.y + 7}px`,
                }}
              >
                BULLMONEY
              </motion.text>
            </g>
          );
        })()}

        {/* ═══════ HOTSPOT FINANCE CITIES ═══════ */}
        {HOTSPOT_CITIES.map((city, i) => {
          const pos = projectPoint(city.lat, city.lng);
          return (
            <g key={`hotspot-${i}`}>
              {/* Outer pulsing ring 1 */}
              <circle cx={pos.x} cy={pos.y} r="3" fill="none" stroke={city.color} strokeWidth="0.6" opacity="0.5">
                <animate attributeName="r" values="3;12;3" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </circle>
              {/* Outer pulsing ring 2 (offset) */}
              <circle cx={pos.x} cy={pos.y} r="3" fill="none" stroke={city.color} strokeWidth="0.4" opacity="0.3">
                <animate attributeName="r" values="3;16;3" dur="4s" begin={`${i * 0.4 + 1}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" begin={`${i * 0.4 + 1}s`} repeatCount="indefinite" />
              </circle>
              {/* Core glowing dot */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="3"
                fill={city.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              />
              {/* Inner bright dot */}
              <circle cx={pos.x} cy={pos.y} r="1.2" fill="#fff" opacity="0.9" />
            </g>
          );
        })}

        {/* ═══════ ORBITING SATELLITE RINGS (around endpoint cities) ═══════ */}
        {dots.map((dot, i) => {
          const startPos = projectPoint(dot.start.lat, dot.start.lng);
          const endPos = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`satellites-${i}`}>
              {/* Start-point orbit */}
              {[0, 1, 2].map((satIdx) => {
                const orbitR = 12 + satIdx * 3;
                const dur = 4 + satIdx * 1.5;
                const startAngleOffset = satIdx * 120;
                return (
                  <g key={`sat-start-${i}-${satIdx}`}>
                    <circle
                      cx={startPos.x}
                      cy={startPos.y}
                      r={orbitR}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="0.3"
                      strokeDasharray="2 4"
                    />
                    <circle cx={startPos.x} cy={startPos.y} r="1" fill="rgba(255,255,255,0.7)">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`${startAngleOffset} ${startPos.x} ${startPos.y}`}
                        to={`${startAngleOffset + 360} ${startPos.x} ${startPos.y}`}
                        dur={`${dur}s`}
                        repeatCount="indefinite"
                      />
                      <animate attributeName="cx" values={`${startPos.x + orbitR}`} dur="0.01s" fill="freeze" />
                      <animate attributeName="cy" values={`${startPos.y}`} dur="0.01s" fill="freeze" />
                    </circle>
                  </g>
                );
              })}
              {/* End-point orbit */}
              {[0, 1].map((satIdx) => {
                const orbitR = 10 + satIdx * 4;
                const dur = 3.5 + satIdx * 2;
                const startAngleOffset = satIdx * 180;
                return (
                  <g key={`sat-end-${i}-${satIdx}`}>
                    <circle
                      cx={endPos.x}
                      cy={endPos.y}
                      r={orbitR}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="0.3"
                      strokeDasharray="2 4"
                    />
                    <circle cx={endPos.x} cy={endPos.y} r="1" fill="rgba(255,255,255,0.6)">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`${startAngleOffset} ${endPos.x} ${endPos.y}`}
                        to={`${startAngleOffset + 360} ${endPos.x} ${endPos.y}`}
                        dur={`${dur}s`}
                        repeatCount="indefinite"
                      />
                      <animate attributeName="cx" values={`${endPos.x + orbitR}`} dur="0.01s" fill="freeze" />
                      <animate attributeName="cy" values={`${endPos.y}`} dur="0.01s" fill="freeze" />
                    </circle>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* ═══════ RADAR / SONAR SWEEP — Atlantic Ocean ═══════ */}
        {(() => {
          const radarCenter = projectPoint(25, -35); // Mid-Atlantic
          const radarR = 60;
          return (
            <g>
              {/* Radar boundary ring — bright */}
              <circle
                cx={radarCenter.x}
                cy={radarCenter.y}
                r={radarR}
                fill="none"
                stroke="rgba(0,212,255,0.25)"
                strokeWidth="0.8"
              />
              {/* Pulsing outer ring */}
              <circle cx={radarCenter.x} cy={radarCenter.y} r={radarR} fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="1.5">
                <animate attributeName="opacity" values="0.15;0.35;0.15" dur="4s" repeatCount="indefinite" />
              </circle>
              {/* Inner rings — brighter */}
              <circle cx={radarCenter.x} cy={radarCenter.y} r={radarR * 0.66} fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="0.5" />
              <circle cx={radarCenter.x} cy={radarCenter.y} r={radarR * 0.33} fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="0.5" />
              {/* Crosshair lines */}
              <line x1={radarCenter.x - radarR} y1={radarCenter.y} x2={radarCenter.x + radarR} y2={radarCenter.y} stroke="rgba(0,212,255,0.08)" strokeWidth="0.3" />
              <line x1={radarCenter.x} y1={radarCenter.y - radarR} x2={radarCenter.x} y2={radarCenter.y + radarR} stroke="rgba(0,212,255,0.08)" strokeWidth="0.3" />
              {/* Center dot — pulsing */}
              <circle cx={radarCenter.x} cy={radarCenter.y} r="2" fill="rgba(0,212,255,0.6)">
                <animate attributeName="r" values="1.5;3;1.5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Sweep line — a pie-slice wedge that rotates */}
              <g>
                <defs>
                  <linearGradient id="radar-sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(0,212,255,0.55)" />
                    <stop offset="100%" stopColor="rgba(0,212,255,0)" />
                  </linearGradient>
                </defs>
                {/* Sweep wedge path — larger angle, brighter */}
                <path
                  d={`M ${radarCenter.x} ${radarCenter.y} L ${radarCenter.x + radarR} ${radarCenter.y} A ${radarR} ${radarR} 0 0 1 ${radarCenter.x + radarR * Math.cos(Math.PI / 4)} ${radarCenter.y + radarR * Math.sin(Math.PI / 4)} Z`}
                  fill="url(#radar-sweep-grad)"
                  opacity="0.8"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${radarCenter.x} ${radarCenter.y}`}
                    to={`360 ${radarCenter.x} ${radarCenter.y}`}
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </path>
                {/* Sweep leading edge line — brighter */}
                <line
                  x1={radarCenter.x}
                  y1={radarCenter.y}
                  x2={radarCenter.x + radarR}
                  y2={radarCenter.y}
                  stroke="rgba(0,212,255,0.7)"
                  strokeWidth="1"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 ${radarCenter.x} ${radarCenter.y}`}
                    to={`360 ${radarCenter.x} ${radarCenter.y}`}
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </line>
              </g>
              {/* Radar blips — brighter, more prominent */}
              {[
                { x: radarCenter.x + 20, y: radarCenter.y - 15 },
                { x: radarCenter.x - 25, y: radarCenter.y + 10 },
                { x: radarCenter.x + 10, y: radarCenter.y + 30 },
                { x: radarCenter.x - 15, y: radarCenter.y - 25 },
                { x: radarCenter.x + 35, y: radarCenter.y + 5 },
                { x: radarCenter.x - 8, y: radarCenter.y + 40 },
              ].map((blip, bi) => (
                <g key={`radar-blip-${bi}`}>
                  <circle cx={blip.x} cy={blip.y} r="1.8" fill="rgba(0,212,255,0.9)">
                    <animate attributeName="opacity" values="0;1;1;0" dur="6s" begin={`${bi * 1}s`} repeatCount="indefinite" />
                    <animate attributeName="r" values="1;2.5;2.5;1" dur="6s" begin={`${bi * 1}s`} repeatCount="indefinite" />
                  </circle>
                  {/* Blip ring */}
                  <circle cx={blip.x} cy={blip.y} r="2" fill="none" stroke="rgba(0,212,255,0.4)" strokeWidth="0.3">
                    <animate attributeName="r" values="2;6;2" dur="6s" begin={`${bi * 1}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.5;0" dur="6s" begin={`${bi * 1}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}
            </g>
          );
        })()}

        {/* ═══════ SHOOTING STARS / METEORS — random burn-up ═══════ */}
        {METEORS.map((m, i) => {
          const rad = (m.angle * Math.PI) / 180;
          const endX = m.startX + Math.cos(rad) * m.length;
          const endY = m.startY + Math.sin(rad) * m.length;
          const tailLen = m.length * 0.7;
          const tailEndX = m.startX + Math.cos(rad) * tailLen;
          const tailEndY = m.startY + Math.sin(rad) * tailLen;
          // Cycle time = total before the meteor repeats
          const cycleTime = 30;
          const repeatWait = cycleTime - m.dur;
          return (
            <g key={`meteor-${i}`}>
              <defs>
                <linearGradient id={`meteor-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%"
                  gradientTransform={`rotate(${m.angle})`}>
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="20%" stopColor="#FFE4B5" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#FFA500" stopOpacity="0.4" />
                  <stop offset="80%" stopColor="#FF4500" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#8B0000" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Meteor head — shrinks as it burns up */}
              <motion.circle
                fill="#FFFFFF"
                initial={{ cx: m.startX, cy: m.startY, opacity: 0, r: 2 }}
                animate={{
                  cx: [m.startX, endX],
                  cy: [m.startY, endY],
                  opacity: [0, 1, 1, 0.6, 0],
                  r: [2, 1.8, 1.2, 0.4, 0],
                }}
                transition={{
                  duration: m.dur,
                  delay: m.delay,
                  repeat: Infinity,
                  repeatDelay: repeatWait,
                  times: [0, 0.1, 0.6, 0.9, 1],
                  ease: "linear",
                }}
                style={{ filter: 'drop-shadow(0 0 3px #fff) drop-shadow(0 0 6px #FFA500)' }}
              />
              {/* Meteor tail streak — fading burn trail */}
              <motion.line
                stroke={`url(#meteor-grad-${i})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{
                  x1: m.startX,
                  y1: m.startY,
                  x2: m.startX,
                  y2: m.startY,
                  opacity: 0,
                }}
                animate={{
                  x1: [m.startX, tailEndX, endX],
                  y1: [m.startY, tailEndY, endY],
                  x2: [m.startX, m.startX + Math.cos(rad) * 5, endX - Math.cos(rad) * tailLen],
                  y2: [m.startY, m.startY + Math.sin(rad) * 5, endY - Math.sin(rad) * tailLen],
                  opacity: [0, 0.9, 0],
                }}
                transition={{
                  duration: m.dur,
                  delay: m.delay,
                  repeat: Infinity,
                  repeatDelay: repeatWait,
                  ease: "linear",
                }}
              />
              {/* Burn-up ember sparks — scatter sideways as meteor disintegrates */}
              {[0, 1, 2, 3, 4].map((sIdx) => {
                const sparkDelay = m.dur * (0.5 + sIdx * 0.1);
                const spreadAngle = rad + ((sIdx - 2) * 0.4);
                const sparkDist = 8 + sIdx * 3;
                const midPt = 0.5 + sIdx * 0.1;
                const sparkX = m.startX + Math.cos(rad) * m.length * midPt;
                const sparkY = m.startY + Math.sin(rad) * m.length * midPt;
                return (
                  <motion.circle
                    key={`ember-${i}-${sIdx}`}
                    r="0.8"
                    fill={sIdx % 2 === 0 ? '#FFA500' : '#FF6347'}
                    initial={{ cx: sparkX, cy: sparkY, opacity: 0 }}
                    animate={{
                      cx: [sparkX, sparkX + Math.cos(spreadAngle) * sparkDist],
                      cy: [sparkY, sparkY + Math.sin(spreadAngle) * sparkDist + 4],
                      opacity: [0, 0.8, 0],
                      r: [0.8, 0.3, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      delay: m.delay + sparkDelay,
                      repeat: Infinity,
                      repeatDelay: repeatWait + m.dur - 0.5,
                      ease: "easeOut",
                    }}
                  />
                );
              })}
              {/* Final burn-up flash at end point */}
              <motion.circle
                cx={endX}
                cy={endY}
                r="1"
                fill="#FF4500"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0, 0.9, 0],
                  r: [0, 0, 4, 0],
                }}
                transition={{
                  duration: m.dur,
                  delay: m.delay,
                  repeat: Infinity,
                  repeatDelay: repeatWait,
                  times: [0, 0.85, 0.95, 1],
                  ease: "easeOut",
                }}
              />
              {/* Debris scatter at burn-up point */}
              {[0, 1, 2].map((pIdx) => {
                const pOff = (pIdx + 1) * 0.12;
                const pAngle = rad + (Math.PI / 2) * (pIdx - 1) * 0.6;
                return (
                  <motion.circle
                    key={`meteor-debris-${i}-${pIdx}`}
                    r="0.5"
                    fill="#FFA500"
                    initial={{ cx: endX, cy: endY, opacity: 0 }}
                    animate={{
                      cx: [endX, endX + Math.cos(pAngle) * 10],
                      cy: [endY, endY + Math.sin(pAngle) * 10 + 3],
                      opacity: [0, 0, 0.6, 0],
                      r: [0.5, 0.5, 0.3, 0],
                    }}
                    transition={{
                      duration: m.dur + 0.4,
                      delay: m.delay,
                      repeat: Infinity,
                      repeatDelay: repeatWait - 0.4,
                      times: [0, 0.85, 0.95, 1],
                      ease: "easeOut",
                    }}
                  />
                );
              })}
            </g>
          );
        })}

      </svg>
      </div>
    </div>
  );
}
