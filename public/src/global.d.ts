// src/vite-env.d.ts

/// <reference types="vite/client" />

declare module '*.glb' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module 'meshline' {
  import { Material, BufferGeometry } from 'three';
  export class MeshLineGeometry extends BufferGeometry {
    setPoints(points: any[]): void;
  }
  export class MeshLineMaterial extends Material {
    constructor(parameters?: any);
    resolution: any;
    lineWidth: number;
    color: any;
    map: any;
    useMap: boolean;
    repeat: any;
  }
}

// Extends JSX for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: any;
      meshLineMaterial: any;
    }
  }
}
// Add this to your d.ts file
declare module 'meshline' {
  export const MeshLineGeometry: any;
  export const MeshLineMaterial: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: any;
      meshLineMaterial: any;
    }
  }
}