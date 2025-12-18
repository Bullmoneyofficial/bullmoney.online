"use client";
import Spline from '@splinetool/react-spline';
import { useRef } from 'react';

interface Props {
  onUnlock: () => void;
}

export default function SplineBackground({ onUnlock }: Props) {
  const splineRef = useRef<any>(null);

  function onLoad(spline: any) {
    splineRef.current = spline;
  }

  function onSplineMouseDown(e: any) {
    // 1. Log the name of the object you clicked (check your browser console)
    console.log('Clicked object name:', e.target.name);

    // 2. CHECK: If the object name is "Start", unlock the site.
    // You can change "Start" to whatever your 3D button is named in Spline.
    if (e.target.name === 'Start') {
      onUnlock();
    }
    
    // Optional: Unlock on ANY object click (Uncomment below if you prefer this)
    // onUnlock(); 
  }

  return (
    <div className="w-full h-full">
      <Spline 
        scene="/scene.splinecode"
        onLoad={onLoad}
        onMouseDown={onSplineMouseDown}
      />
    </div>
  );
}