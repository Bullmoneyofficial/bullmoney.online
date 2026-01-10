// components/AudioPlayer.jsx
"use client";
import React, { useEffect, useRef } from 'react';

// Import the mapping from your constant files
import { THEME_SOUNDTRACKS } from '@/app/FixedThemeConfigurator'; 

// Component props: themeId (to find the track), isMuted (to mute/unmute)
const AudioPlayer = ({ themeId, isMuted }) => {
    const audioRef = useRef(null);
    const themeTrackUrl = THEME_SOUNDTRACKS[themeId];

    // --- EFFECT 1: Handle Muting/Unmuting ---
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // --- EFFECT 2: Handle Theme Change (Source Change) ---
    useEffect(() => {
        const audio = audioRef.current;
        
        if (!themeTrackUrl || !audio) {
            console.warn(`No track found for theme: ${themeId}`);
            return;
        }
        
        // 1. Pause current track
        audio.pause(); 
        
        // 2. Set new source
        audio.src = themeTrackUrl;
        
        // 3. Load new track
        audio.load();

        // 4. Play the new track, but only if we are unmuted
        if (!isMuted) {
             // Play() returns a Promise, handle potential errors (like auto-play restrictions)
             audio.play().catch(error => {
                 console.log("Autoplay prevented. User interaction required:", error);
                 // Inform the user if necessary, e.g., show a 'Play' button
             });
        }
        
        // Cleanup function for when the component unmounts or themeId changes
        return () => {
            audio.pause();
        };
    }, [themeId, themeTrackUrl, isMuted]); // Dependency on isMuted is important for starting playback on unmute

    return (
        // The audio element is hidden. We use 'loop' and 'preload="auto"' for continuous background music.
        <audio 
            ref={audioRef} 
            loop 
            preload="auto" 
            muted={isMuted}
            style={{ display: 'none' }}
        />
    );
};

export default AudioPlayer;