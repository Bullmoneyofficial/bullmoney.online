'use client';

export function showGameNotification(text: string, type: 'win' | 'lose' | 'info') {
  if (typeof window === 'undefined') return;
  let container = document.getElementById('game-notifications');
  if (!container) {
    container = document.createElement('div');
    container.id = 'game-notifications';
    container.className = 'game-notification-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `game-toast ${type}`;
  toast.textContent = text;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
