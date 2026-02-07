// iPhone Glass Styles - Black and White Theme
export const GLASS_STYLES = `
  html, body, #__next {
    background: #000000;
  }

  .page-surface {
    background: #000000;
  }

  @keyframes glass-shimmer {
    0%, 100% { 
      opacity: 0.95;
    }
    50% { 
      opacity: 1;
    }
  }

  .glass-text {
    color: #ffffff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .glass-text-dark {
    color: #1a1a1a;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.1);
  }

  .glass-text-gray {
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  .glass-border {
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }

  .glass-button {
    background: rgba(255, 255, 255, 0.9);
    color: #000000;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .glass-button:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
`;
