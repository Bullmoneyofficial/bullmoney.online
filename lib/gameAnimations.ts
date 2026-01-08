/**
 * Game & Cinematic Animation System
 * Transforms the website into an immersive, game-like experience
 */

// ===== ANIMATION CONFIGURATIONS =====

export const GAME_ANIMATIONS = {
  // Page transitions
  pageTransition: {
    enter: 'transform transition-all duration-700 ease-out',
    enterFrom: 'opacity-0 translate-x-full scale-95',
    enterTo: 'opacity-100 translate-x-0 scale-100',
    leave: 'transform transition-all duration-500 ease-in',
    leaveFrom: 'opacity-100 translate-x-0 scale-100',
    leaveTo: 'opacity-0 -translate-x-full scale-95',
  },

  // Sliding transitions
  slideIn: {
    fromLeft: 'animate-slideInLeft',
    fromRight: 'animate-slideInRight',
    fromTop: 'animate-slideInTop',
    fromBottom: 'animate-slideInBottom',
  },

  // Hover effects
  hover: {
    pulse: 'hover:animate-pulse hover:scale-105 transition-all duration-300',
    glow: 'hover:shadow-glow hover:brightness-110 transition-all duration-300',
    lift: 'hover:-translate-y-2 hover:shadow-2xl transition-all duration-300',
    flip: 'hover:rotate-y-180 transition-transform duration-500 preserve-3d',
    bounce: 'hover:animate-bounce',
    shake: 'hover:animate-shake',
  },

  // Button interactions
  button: {
    press: 'active:scale-95 transition-transform duration-100',
    ripple: 'relative overflow-hidden before:absolute before:inset-0 before:bg-white/20 before:scale-0 active:before:scale-100 before:transition-transform before:duration-500 before:rounded-full',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] transition-shadow duration-300',
  },

  // Card animations
  card: {
    float: 'animate-float',
    tilt: 'hover:rotate-3 hover:scale-105 transition-all duration-300',
    reveal: 'perspective-1000 hover:rotate-y-6 hover:rotate-x-6 transition-all duration-500',
  },

  // Game-like effects
  game: {
    levelUp: 'animate-levelUp',
    coinDrop: 'animate-coinDrop',
    achievement: 'animate-achievement',
    xpGain: 'animate-xpGain',
    powerUp: 'animate-powerUp',
  },

  // Cinematic effects
  cinematic: {
    zoomIn: 'animate-cinematicZoom',
    panLeft: 'animate-panLeft',
    panRight: 'animate-panRight',
    dollyIn: 'animate-dollyIn',
    reveal: 'animate-cinematicReveal',
  },

  // Loading states
  loading: {
    spinner: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    progress: 'animate-progress',
    skeleton: 'animate-skeleton',
  },

  // Text effects
  text: {
    typewriter: 'animate-typewriter overflow-hidden whitespace-nowrap',
    glitch: 'animate-glitch',
    neon: 'animate-neon',
    fade: 'animate-fadeIn',
  },
};

// ===== PARTICLE SYSTEM =====

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'coin' | 'star' | 'sparkle' | 'confetti' | 'smoke';
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId = 0;

  createBurst(x: number, y: number, count: number = 20, type: Particle['type'] = 'sparkle') {
    const colors = {
      coin: ['#FFD700', '#FFA500', '#FF8C00'],
      star: ['#FFFF00', '#FFD700', '#FFF8DC'],
      sparkle: ['#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#f59e0b'],
      confetti: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
      smoke: ['rgba(255,255,255,0.5)', 'rgba(200,200,200,0.3)', 'rgba(150,150,150,0.2)'],
    };

    const particleColors = colors[type];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 2 + Math.random() * 3;

      this.particles.push({
        id: this.nextId++,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2, // Initial upward bias
        size: 4 + Math.random() * 4,
        color: particleColors[Math.floor(Math.random() * particleColors.length)] || '#FFFFFF',
        life: 1,
        maxLife: 60 + Math.random() * 60,
        type,
      });
    }
  }

  update() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      p.vx *= 0.99; // Air resistance
      p.life++;
      return p.life < p.maxLife;
    });
  }

  getParticles() {
    return this.particles;
  }

  clear() {
    this.particles = [];
  }
}

// ===== SOUND EFFECTS =====

export class SoundEffectManager {
  private context: AudioContext | null = null;
  private enabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Audio context not supported');
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.1) {
    if (!this.enabled || !this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  playClick() {
    this.playTone(800, 0.05, 'square', 0.05);
  }

  playHover() {
    this.playTone(600, 0.03, 'sine', 0.03);
  }

  playSwipe() {
    if (!this.context) return;
    const now = this.context.currentTime;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  playSuccess() {
    // Ascending chord
    setTimeout(() => this.playTone(523.25, 0.1, 'sine', 0.08), 0); // C
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.08), 50); // E
    setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.08), 100); // G
  }

  playCoin() {
    this.playTone(1000, 0.1, 'square', 0.06);
    setTimeout(() => this.playTone(1500, 0.1, 'square', 0.04), 50);
  }

  playLevelUp() {
    // Rising fanfare
    const notes = [261.63, 329.63, 392, 523.25]; // C, E, G, C
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.1), i * 100);
    });
  }

  playError() {
    this.playTone(200, 0.3, 'sawtooth', 0.08);
  }
}

// ===== HAPTIC FEEDBACK =====

export class HapticManager {
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  vibrate(pattern: number | number[]) {
    if (!this.enabled || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  }

  light() {
    this.vibrate(10);
  }

  medium() {
    this.vibrate(20);
  }

  heavy() {
    this.vibrate(30);
  }

  success() {
    this.vibrate([10, 50, 10]);
  }

  error() {
    this.vibrate([20, 100, 20, 100, 20]);
  }

  impact() {
    this.vibrate([5, 10, 5]);
  }
}

// ===== PROGRESS & ACHIEVEMENT SYSTEM =====

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private listeners: Array<(achievement: Achievement) => void> = [];

  registerAchievement(achievement: Achievement) {
    this.achievements.set(achievement.id, achievement);
  }

  updateProgress(id: string, progress: number) {
    const achievement = this.achievements.get(id);
    if (!achievement) return;

    achievement.progress = progress;

    if (achievement.maxProgress && progress >= achievement.maxProgress && !achievement.unlocked) {
      this.unlock(id);
    }
  }

  unlock(id: string) {
    const achievement = this.achievements.get(id);
    if (!achievement || achievement.unlocked) return;

    achievement.unlocked = true;
    achievement.unlockedAt = new Date();

    this.listeners.forEach(listener => listener(achievement));
  }

  onUnlock(listener: (achievement: Achievement) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  getAchievements() {
    return Array.from(this.achievements.values());
  }

  getUnlocked() {
    return this.getAchievements().filter(a => a.unlocked);
  }
}

// ===== CAMERA SYSTEM =====

export interface CameraPosition {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export class CameraController {
  private current: CameraPosition = { x: 0, y: 0, zoom: 1, rotation: 0 };
  private target: CameraPosition = { x: 0, y: 0, zoom: 1, rotation: 0 };
  private speed = 0.1;

  setTarget(position: Partial<CameraPosition>) {
    this.target = { ...this.target, ...position };
  }

  update() {
    this.current.x += (this.target.x - this.current.x) * this.speed;
    this.current.y += (this.target.y - this.current.y) * this.speed;
    this.current.zoom += (this.target.zoom - this.current.zoom) * this.speed;
    this.current.rotation += (this.target.rotation - this.current.rotation) * this.speed;
  }

  getCurrent() {
    return this.current;
  }

  shake(intensity: number = 10, duration: number = 300) {
    const startTime = Date.now();
    const originalX = this.current.x;
    const originalY = this.current.y;

    const shakeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        clearInterval(shakeInterval);
        this.current.x = originalX;
        this.current.y = originalY;
        return;
      }

      const progress = 1 - elapsed / duration;
      const currentIntensity = intensity * progress;

      this.current.x = originalX + (Math.random() - 0.5) * currentIntensity;
      this.current.y = originalY + (Math.random() - 0.5) * currentIntensity;
    }, 16);
  }

  cinematicPan(from: CameraPosition, to: CameraPosition, duration: number = 2000) {
    this.current = from;
    this.target = to;

    const oldSpeed = this.speed;
    this.speed = 0.02; // Slower for cinematic effect

    setTimeout(() => {
      this.speed = oldSpeed;
    }, duration);
  }
}

// ===== EXPORT SINGLETON INSTANCES =====

export const particleSystem = new ParticleSystem();
export const soundManager = new SoundEffectManager();
export const hapticManager = new HapticManager();
export const achievementSystem = new AchievementSystem();
export const cameraController = new CameraController();

// ===== UTILITY FUNCTIONS =====

export function createRipple(event: React.MouseEvent<HTMLElement>) {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const ripple = button.getElementsByClassName('ripple')[0];
  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

export function triggerConfetti(x: number, y: number) {
  particleSystem.createBurst(x, y, 30, 'confetti');
  soundManager.playSuccess();
  hapticManager.success();
}

export function triggerCoinDrop(x: number, y: number, amount: number = 5) {
  for (let i = 0; i < amount; i++) {
    setTimeout(() => {
      particleSystem.createBurst(x, y + i * 10, 3, 'coin');
      soundManager.playCoin();
    }, i * 100);
  }
  hapticManager.light();
}

export function triggerLevelUp() {
  soundManager.playLevelUp();
  hapticManager.success();
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  particleSystem.createBurst(centerX, centerY, 50, 'star');
}

export function createFloatingText(text: string, x: number, y: number, color: string = '#FFD700') {
  const element = document.createElement('div');
  element.textContent = text;
  element.style.position = 'fixed';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.color = color;
  element.style.fontSize = '24px';
  element.style.fontWeight = 'bold';
  element.style.pointerEvents = 'none';
  element.style.zIndex = '999999';
  element.style.textShadow = '0 0 10px rgba(0,0,0,0.8)';
  element.className = 'animate-floatUp';

  document.body.appendChild(element);
  setTimeout(() => element.remove(), 2000);
}
