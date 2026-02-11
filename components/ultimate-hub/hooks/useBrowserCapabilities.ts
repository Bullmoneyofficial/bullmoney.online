import { useCallback, useMemo } from 'react';

export interface BrowserCapabilities {
  webgl2: boolean;
  webgpu: boolean;
  serviceWorker: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDb: boolean;
  sharedArrayBuffer: boolean;
  webWorker: boolean;
  webAssembly: boolean;
  audioContext: boolean;
  mediaRecorder: boolean;
  mediaDevices: boolean;
  geolocation: boolean;
  vibration: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  ambientLight: boolean;
  proximity: boolean;
  pushNotification: boolean;
  notifications: boolean;
  camera: boolean;
  microphone: boolean;
  usb: boolean;
  bluetooth: boolean;
  serialPort: boolean;
  fileSystem: boolean;
  clipboardAccess: boolean;
  screenCapture: boolean;
  vr: boolean;
  ar: boolean;
  videoCodecs: string[];
  audioCodecs: string[];
}

export function useBrowserCapabilities(): BrowserCapabilities {
  const computeCapabilities = useCallback((): BrowserCapabilities => {
    const nav = navigator as any;
    
    // Test WebGL versions
    const webgl2 = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
      } catch { return false; }
    })();

    // Test WebGPU
    const webgpu = 'gpu' in navigator;

    // Test storage APIs
    const localStorage = (() => {
      try {
        return typeof window !== 'undefined' && 'localStorage' in window;
      } catch { return false; }
    })();

    const sessionStorage = (() => {
      try {
        return typeof window !== 'undefined' && 'sessionStorage' in window;
      } catch { return false; }
    })();

    const indexedDb = !!window.indexedDB;
    const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    const webWorker = typeof Worker !== 'undefined';
    const webAssembly = typeof WebAssembly !== 'undefined';
    
    // Test audio/media
    const audioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
    const mediaRecorder = typeof MediaRecorder !== 'undefined';
    const mediaDevices = !!nav.mediaDevices;
    
    // Test sensors
    const accelerometer = 'Accelerometer' in window;
    const gyroscope = 'Gyroscope' in window;
    const magnetometer = 'Magnetometer' in window;
    const ambientLight = 'AmbientLightSensor' in window;
    const proximity = 'ProximitySensor' in window;
    
    // Test permissions/APIs
    const geolocation = 'geolocation' in nav;
    const vibration = 'vibrate' in nav;
    const pushNotification = 'serviceWorker' in nav && 'PushManager' in window;
    const notifications = 'Notification' in window;
    const serviceWorker = 'serviceWorker' in nav;
    const usb = 'usb' in nav;
    const bluetooth = 'bluetooth' in nav;
    const serialPort = 'serial' in nav;
    const fileSystem = 'storage' in nav && 'getDirectory' in (nav.storage as any);
    const clipboardAccess = !!(nav.clipboard && nav.clipboard.read);
    const screenCapture = !!(nav.mediaDevices && nav.mediaDevices.getDisplayMedia);
    
    // Test XR capabilities
    const vr = 'xr' in nav && 'isSessionSupported' in (nav.xr as any);
    const ar = vr; // Same XR API for AR
    
    // Detect camera and microphone
    const camera = !!mediaDevices;
    const microphone = !!mediaDevices;

    // Test video and audio codec support
    const video = document.createElement('video');
    const videoCodecs = [];
    const audioCodecs = [];
    
    if (video.canPlayType) {
      if (video.canPlayType('video/mp4; codecs="avc1.42E01E"')) videoCodecs.push('H.264');
      if (video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"')) videoCodecs.push('H.265');
      if (video.canPlayType('video/webm; codecs="vp8, vorbis"')) videoCodecs.push('VP8');
      if (video.canPlayType('video/webm; codecs="vp9"')) videoCodecs.push('VP9');
      if (video.canPlayType('video/mp4; codecs="av01.0.12M.08"')) videoCodecs.push('AV1');
    }

    const audio = document.createElement('audio');
    if (audio.canPlayType) {
      if (audio.canPlayType('audio/mpeg')) audioCodecs.push('MP3');
      if (audio.canPlayType('audio/wav')) audioCodecs.push('WAV');
      if (audio.canPlayType('audio/ogg')) audioCodecs.push('Vorbis');
      if (audio.canPlayType('audio/aac')) audioCodecs.push('AAC');
      if (audio.canPlayType('audio/flac')) audioCodecs.push('FLAC');
      if (audio.canPlayType('audio/webm')) audioCodecs.push('WebM');
    }

    return {
      webgl2,
      webgpu,
      serviceWorker,
      localStorage,
      sessionStorage,
      indexedDb,
      sharedArrayBuffer,
      webWorker,
      webAssembly,
      audioContext,
      mediaRecorder,
      mediaDevices,
      geolocation,
      vibration,
      accelerometer,
      gyroscope,
      magnetometer,
      ambientLight,
      proximity,
      pushNotification,
      notifications,
      camera,
      microphone,
      usb,
      bluetooth,
      serialPort,
      fileSystem,
      clipboardAccess,
      screenCapture,
      vr,
      ar,
      videoCodecs,
      audioCodecs,
    };
  }, []);

  return useMemo(() => computeCapabilities(), [computeCapabilities]);
}
