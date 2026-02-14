"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation"; // Used for navigation
import Orb from "@/components/Mainpage/Vorb"; // Adjust import if your Orb is elsewhere
import { SparklesCore } from "@/components/Mainpage/sparkles"; // Added missing import

export default function RecruitPage() {
  const [open, setOpen] = useState(false);
  const [isLive, setIsLive] = useState(false); // Track if live or not
  const router = useRouter(); // Hook for navigation

  const handleVIPAccessClick = () => {
    // Navigate to the main shop page
    router.push("/shop");
  };

  const handleLiveStreamClick = () => {
    // Navigate to the YouTube live stream
    window.open("https://youtube.com/bullmoney.online", "_blank");
  };

  const handleMentorshipClick = () => {
    // Navigate to the About page
    router.push("/about");
  };

  // Simulate checking if live or not
  useEffect(() => {
    const checkLiveStatus = async () => {
      // Simulate being live for testing purposes
      setIsLive(true); 
    };
    checkLiveStatus();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "850px",
        position: "relative",
        background: "radial-gradient(circle at center, #051131ff 0%, #000 100%)",
        overflow: "hidden",
      }}
    >
      {/* SPARKLES BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <SparklesCore
          id="tsparticlesrecruit"
          background="transparent"
          minSize={1.6}
          maxSize={3.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Main Content Wrapper (z-10 to stay above sparkles) */}
      <div className="relative z-10 w-full h-full">
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
          onButtonClick={() => setOpen(true)}
          buttonLabel="BULLMONEY LIVESTREAMS"
        />

        {/* === ⚡ Slide-Up Modal === */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-2xl"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(8,10,20,0.9), rgba(0,0,0,0.85))",
              }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                key="modal"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 25,
                }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full sm:w-[92%] sm:max-w-3xl rounded-t-3xl sm:rounded-3xl overflow-hidden p-[2px]"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(255, 255, 255,0.6), rgba(255, 255, 255,0.4))",
                  boxShadow:
                    "0 0 50px rgba(255, 255, 255,0.3), inset 0 0 40px rgba(255, 255, 255,0.2)",
                  maxHeight: "90vh",
                }}
              >
                <div
                  className="relative z-10 rounded-t-3xl sm:rounded-3xl"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,12,25,0.95) 0%, rgba(3,6,15,0.9) 100%)",
                    maxHeight: "88vh",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {/* Hide scrollbars (WebKit) */}
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>

                  <div className="p-6 sm:p-10">
                    {/* Floating Glow Ribbons */}
                    <motion.div
                      className="absolute -top-32 -left-20 w-[300px] h-[300px] rounded-full bg-sky-500/20 blur-[120px]"
                      animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 6 }}
                    />
                    <motion.div
                      className="absolute bottom-0 right-0 w-[280px] h-[280px] rounded-full bg-indigo-600/20 blur-[100px]"
                      animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 7 }}
                    />

                    {/* Header */}
                    <div className="relative z-10 text-center mb-8">
                      <h2 className="text-3xl sm:text-5xl font-extrabold bg-linear-to-r from-sky-400 via-white to-indigo-400 bg-clip-text text-transparent">
                        BULLMONEY VIP
                      </h2>
                      <p className="mt-3 text-neutral-400 text-sm sm:text-base">
                        Join us for exclusive trading tips, live analysis, and real-time market updates. Don't miss out!
                      </p>
                    </div>

                    {/* Product Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      
                      {/* VIP Access Card */}
                      <div
                        className="relative p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                        style={{
                          background:
                            "linear-gradient(145deg, #ffffff, #ffffff)",
                          boxShadow:
                            "0 12px 24px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      >
                        <h3 className="text-2xl text-white font-bold bg-linear-to-r from-white to-indigo-600 bg-clip-text text-transparent">
                          VIP Access
                        </h3>
                        <p className="text-sm text-white mt-2">
                          Get access to real-time trading analysis, exclusive tips, and more.
                        </p>
                        <button
                          onClick={handleVIPAccessClick}
                          className="mt-4 px-6 py-2 bg-linear-to-r from-white to-indigo-600 text-white rounded-full hover:opacity-80 transition-all"
                        >
                          Access Now
                        </button>
                      </div>

                      {/* Live Streams Card */}
                      <div
                        className="relative p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                        style={{
                          background:
                            "linear-gradient(145deg, #ffffff, #ffffff)",
                          boxShadow:
                            "0 12px 24px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      >
                        <h3 className="text-2xl text-white font-bold bg-linear-to-r from-white to-indigo-600 bg-clip-text text-transparent">
                          Live Streams
                        </h3>
                        <p className="text-sm text-white mt-2">
                          Join live streams for expert market analysis and trade insights.
                        </p>

                        {/* YouTube Preview */}
                        <div className="mt-4 relative w-full h-48 bg-black rounded-lg overflow-hidden">
                          {isLive ? (
                            <iframe
                              width="100%"
                              height="100%"
                              src="https://www.youtube.com/embed/LIVE_STREAM_ID?autoplay=1"
                              title="YouTube live stream"
                              frameBorder="0"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                            />
                          ) : (
                            <iframe
                              width="100%"
                              height="100%"
                              src="https://www.youtube.com/embed/FALLBACK_VIDEO_ID"
                              title="YouTube video"
                              frameBorder="0"
                              allow="encrypted-media"
                              allowFullScreen
                            />
                          )}
                        </div>

                        <button
                          onClick={handleLiveStreamClick}
                          className="mt-4 px-6 py-2 bg-linear-to-r from-white to-indigo-600 text-white rounded-full hover:opacity-80 transition-all"
                        >
                          Watch Now
                        </button>
                      </div>

                      {/* Mentorship Card */}
                      <div
                        className="relative p-6 rounded-lg shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105"
                        style={{
                          background:
                            "linear-gradient(145deg, #ffffff, #ffffff)",
                          boxShadow:
                            "0 12px 24px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      >
                        <h3 className="text-2xl text-white font-bold bg-linear-to-r from-white to-indigo-600 bg-clip-text text-transparent">
                          Mentorship
                        </h3>
                        <p className="text-sm text-white mt-2">
                          Get one-on-one mentorship from seasoned traders and learn the ropes.
                        </p>
                        <button
                          onClick={handleMentorshipClick}
                          className="mt-4 px-6 py-2 bg-linear-to-r from-white to-indigo-600 text-white rounded-full hover:opacity-80 transition-all"
                        >
                          Join Now
                        </button>
                      </div>

                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setOpen(false)}
                      className="absolute top-3 right-5 text-sky-300/80 hover:text-sky-400 text-xl font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}