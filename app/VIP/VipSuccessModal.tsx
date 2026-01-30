import React from 'react';
import { motion } from 'framer-motion';
import { Unlock, CheckCircle } from 'lucide-react';

export const VipSuccessModal = ({ onClose }: { onClose: () => void }) => (
    <motion.div
        key="vip-success-modal"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6"
    >
        <div className="w-full max-w-md p-8 border border-white/50 bg-black rounded-3xl text-center shadow-[0_0_80px_rgba(255, 255, 255,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif')] opacity-5 mix-blend-screen bg-cover pointer-events-none" />
            <div className="relative z-10">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="inline-block mb-6">
                    <Unlock className="w-16 h-16 text-white" />
                </motion.div>
                
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">SECRET FOUND</h2>
                <p className="text-white font-mono text-xs tracking-[0.3em] uppercase mb-8">INITIATING SECURE CONTACT</p>
                
                <div className="bg-neutral-900/50 border border-white/30 p-6 rounded-2xl mb-8 flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-none">
                        <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="text-white font-bold text-lg uppercase tracking-tight">DM FOR VIP ACCESS</div>
                        <div className="text-neutral-500 text-xs font-mono mt-1">@bullmoney.shop on Instagram</div>
                    </div>
                </div>

                <a 
                    href="https://ig.me/m/bullmoney.shop" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-white hover:bg-white text-black font-bold uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-[0_0_30px_rgba(255, 255, 255,0.4)] block text-center"
                >
                    AUTO DM @BULLMONEY.SHOP
                </a>
                
                <button 
                    onClick={onClose}
                    className="mt-4 w-full py-2 text-white border border-transparent hover:border-white/50 text-sm font-semibold uppercase tracking-wider rounded-xl transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    </motion.div>
);