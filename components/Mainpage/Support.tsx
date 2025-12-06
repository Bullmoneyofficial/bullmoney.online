import React, { useState, useEffect } from 'react';
import { MessageCircle, HelpCircle, Phone, Mail } from 'lucide-react';

// --- STYLES FOR ANIMATION ---
// We inject a simple style tag for the custom "shimmer" animation
// since we can't modify your tailwind.config.js directly.
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-150%) skewX(-12deg); }
    100% { transform: translateX(150%) skewX(-12deg); }
  }
  .animate-shimmer {
    animation: shimmer 3s infinite;
  }
`;

// --- THE AESTHETIC SUPPORT WIDGET ---
const SupportWidget = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const telegramLink = "https://t.me/+dlP_A0ebMXs3NTg0";

  return (
    <>
      <style>{shimmerStyles}</style>
      
      <div 
        className={`fixed bottom-6 right-6 z-[9999] transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tooltip Label (Dark Tech Style) */}
        <div 
          className={`absolute bottom-full right-0 mb-4 whitespace-nowrap px-4 py-2 bg-slate-900 border border-blue-500/30 text-blue-50 text-sm font-medium rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] backdrop-blur-md transition-all duration-300 origin-bottom-right ${
            isHovered ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          Chat on Telegram
          {/* Tiny triangle pointer */}
          <div className="absolute top-full right-6 -mt-1.5 w-3 h-3 bg-slate-900 border-r border-b border-blue-500/30 rotate-45"></div>
        </div>

        {/* The Button Container */}
        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact Support"
          className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:-translate-y-1 hover:scale-105"
        >
          {/* 1. OUTER GLOW (Static + Hover intensity) */}
          <div className="absolute inset-0 rounded-full bg-blue-500 blur-md opacity-40 group-hover:opacity-75 group-hover:blur-lg transition-all duration-500"></div>

          {/* 2. MAIN BUTTON BACKGROUND (Gradient) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden">
            
            {/* 3. SHIMMER EFFECT (The light beam) */}
            <div className="absolute top-0 left-0 w-full h-full animate-shimmer">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm"></div>
            </div>
            
            {/* 4. INNER SHADOW for depth */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"></div>
          </div>

          {/* 5. PULSE RING (Subtle Ripple) */}
          <span className="absolute inline-flex h-full w-full rounded-full border border-blue-400 opacity-0 group-hover:animate-ping duration-[1.5s]"></span>
          
          {/* Icon Layer */}
          <div className="relative z-10 drop-shadow-md">
            <MessageCircle 
              className={`w-7 h-7 text-white transition-transform duration-500 ease-out ${
                isHovered ? 'rotate-[-10deg] scale-110' : 'rotate-0'
              }`} 
              fill="currentColor"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            
            {/* Notification Dot (Glowing Red/Pink for contrast) */}
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-r from-red-500 to-pink-600 border border-white shadow-sm"></span>
            </span>
          </div>
        </a>
      </div>
    </>
  );
};

// --- DEMO PAGE CONTENT ---
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
      
      {/* The Aesthetic Widget */}
      <SupportWidget />

      {/* Mock Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-700 tracking-tight">
                BULLMONEY
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Markets</a>
              <a href="#" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Exchange</a>
              <a href="#" className="text-slate-500 hover:text-blue-600 font-medium transition-colors">Learn</a>
              <button className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-20 px-4 sm:px-6">
              <h1 className="text-4xl tracking-tighter font-extrabold text-slate-900 sm:text-5xl md:text-6xl mb-6">
                <span className="block">Next Gen</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Crypto Support
                </span>
              </h1>
              <p className="mt-3 text-base text-slate-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Experience the new aesthetic support button in the bottom right. It features a continuous "shimmer" animation, a neon glow effect, and a premium glassmorphic tooltip.
              </p>
              <div className="mt-8 sm:flex sm:justify-start">
                <div className="rounded-full shadow-lg shadow-blue-500/30">
                  <a href="#" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-full text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 md:py-4 md:text-lg md:px-10 transition-all">
                    Start Trading
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dummy Content */}
        <div className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:border-blue-100 transition-colors">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                    {item === 1 ? <HelpCircle /> : item === 2 ? <Phone /> : <Mail />}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">24/7 Support</h3>
                  <p className="text-slate-500 leading-relaxed">
                    Our Telegram widget ensures you never miss a client query. The glowing aesthetic builds trust and suggests high technical competence.
                  </p>
                </div>
              ))}
            </div>
            
            <div className="h-64"></div> 
          </div>
        </div>
      </main>
    </div>
  );
}