"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as FabricNS from "fabric";
import type {
  Canvas as FabricCanvas,
  Rect as FabricRect,
  FabricObject,
  IText as FabricIText,
  Image as FabricImage,
} from "fabric";
import FallbackCanvas from "./FallbackCanvas";
import KonvaEditor from "./KonvaEditor";
import DrawingCanvas from "./DrawingCanvas";
import PaperEditor from "./PaperEditor";
import P5Editor from "./P5Editor";
import TwoEditor from "./TwoEditor";
import ThreeEditor from "./ThreeEditor";
import PixiEditor from "./PixiEditor";
import ExcalidrawEditor from "./ExcalidrawEditor";
import TLDrawEditor from "./TLDrawEditor";

const ARTBOARD = { width: 1200, height: 800 };
const ZOOM_LIMITS = { min: 0.1, max: 3 };

type EditorType =
  | "fabric"
  | "konva"
  | "paper"
  | "p5"
  | "two"
  | "three"
  | "pixi"
  | "excalidraw"
  | "tldraw"
  | "drawing"
  | "html5";

type LayerItem = {
  id: string;
  label: string;
  type: string;
};

type HistoryState = {
  stack: string[];
  index: number;
  applying: boolean;
};

const DEFAULT_FILL = "#007aff";
const DEFAULT_STROKE = "#1d1d1f";

const EDITOR_META: Record<
  EditorType,
  { icon: string; label: string; badge: string; subtitle: string; badgeClass: "success" | "fallback" }
> = {
  fabric: {
    icon: "🎨",
    label: "Fabric",
    badge: "Fabric.js",
    subtitle: "Professional design with Fabric.js",
    badgeClass: "success",
  },
  konva: {
    icon: "⚡",
    label: "Konva",
    badge: "Konva.js",
    subtitle: "High-performance 2D canvas framework",
    badgeClass: "success",
  },
  paper: {
    icon: "📄",
    label: "Paper",
    badge: "Paper.js",
    subtitle: "Vector graphics scripting engine",
    badgeClass: "success",
  },
  p5: {
    icon: "🎛️",
    label: "P5",
    badge: "P5.js",
    subtitle: "Creative coding and interactive art",
    badgeClass: "success",
  },
  two: {
    icon: "✨",
    label: "Two",
    badge: "Two.js",
    subtitle: "Minimal 2D drawing API",
    badgeClass: "success",
  },
  three: {
    icon: "🧊",
    label: "Three",
    badge: "Three.js",
    subtitle: "3D graphics and WebGL scenes",
    badgeClass: "success",
  },
  pixi: {
    icon: "🪄",
    label: "Pixi",
    badge: "PixiJS",
    subtitle: "Ultra-fast 2D WebGL renderer",
    badgeClass: "success",
  },
  excalidraw: {
    icon: "🧩",
    label: "Excalidraw",
    badge: "Excalidraw",
    subtitle: "Collaborative whiteboard canvas",
    badgeClass: "success",
  },
  tldraw: {
    icon: "✍️",
    label: "TLDraw",
    badge: "TLDraw",
    subtitle: "Infinite canvas whiteboard",
    badgeClass: "success",
  },
  drawing: {
    icon: "✏️",
    label: "Draw",
    badge: "Drawing",
    subtitle: "Simple drawing mode - No dependencies",
    badgeClass: "fallback",
  },
  html5: {
    icon: "💾",
    label: "HTML5",
    badge: "HTML5",
    subtitle: "Lightweight fallback mode",
    badgeClass: "fallback",
  },
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

export default function DesignStudio() {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const artboardRef = useRef<FabricRect | null>(null);
  const fabricRef = useRef<FabricNS | null>(null);
  const historyRef = useRef<HistoryState>({ stack: [], index: -1, applying: false });
  const objectIdRef = useRef(1);
  const lastClickRef = useRef<{ button: string; time: number } | null>(null);

  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [fill, setFill] = useState(DEFAULT_FILL);
  const [stroke, setStroke] = useState(DEFAULT_STROKE);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [angle, setAngle] = useState(0);
  const [fontSize, setFontSize] = useState(56);
  const [zoom, setZoom] = useState(1);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(0);
  const [collapsedTools, setCollapsedTools] = useState(typeof window !== 'undefined' && window.innerWidth <= 1024);
  const [collapsedProperties, setCollapsedProperties] = useState(typeof window !== 'undefined' && window.innerWidth <= 1024);
  const [collapsedLayers, setCollapsedLayers] = useState(typeof window !== 'undefined' && window.innerWidth <= 1024);
  const [collapsedHistory, setCollapsedHistory] = useState(typeof window !== 'undefined' && window.innerWidth <= 1024);
  const [fabricLoading, setFabricLoading] = useState(true);
  const [fabricError, setFabricError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [editorType, setEditorType] = useState<EditorType>('excalidraw');
  const [showEditorMenu, setShowEditorMenu] = useState(false);

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  const editorMeta = EDITOR_META[editorType];

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ action: string; editorType?: EditorType | string }>;
      const detail = custom.detail || { action: '' };

      if (detail.action === 'switch-engine' && detail.editorType) {
        const next = String(detail.editorType) as EditorType;
        if (EDITOR_META[next]) {
          setEditorType(next);
          setUseFallback(next === 'drawing' || next === 'html5');
          setShowEditorMenu(false);
        }
      }

      if (detail.action === 'open') {
        // For now, "open" is a no-op since the studio
        // is already visible on the /design page, but
        // we keep the hook so future behaviors can be added.
      }
    };

    window.addEventListener('design_studio_control', handler as EventListener);
    return () => window.removeEventListener('design_studio_control', handler as EventListener);
  }, []);

  const setActiveObject = useCallback((object: FabricObject | null) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
          artboardRef.current = instance as Rect;
    if (!object) {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setSelectedObject(null);
      return;
    }

    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    setSelectedObject(object);
  }, []);

  const ensureObjectMeta = useCallback((object: FabricObject) => {
    if (!object.get("objectId")) {
      object.set("objectId", `object-${objectIdRef.current++}`);
    }

    if (!object.get("studioLabel")) {
      let label = "Layer";
      if (object.type === "i-text") {
        label = "Text";
      } else if (object.type === "rect") {
        label = "Rectangle";
      } else if (object.type === "circle") {
        label = "Circle";
      } else if (object.type === "triangle") {
        label = "Triangle";
      } else if (object.type === "line") {
        label = "Line";
      } else if (object.type === "image") {
        label = "Image";
      }

      object.set("studioLabel", label);
    }
  }, []);

  const syncLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const items: LayerItem[] = canvas
      .getObjects()
      .filter((object) => object.get("objectId") !== "artboard")
      .map((object) => ({
        id: String(object.get("objectId")),
        label: String(object.get("studioLabel") || "Layer"),
        type: String(object.type),
      }))
      .reverse();

    setLayers(items);
  }, []);

  // Declare applyHistory early for use in handleButtonClick
  const applyHistory = useCallback((nextIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const json = historyRef.current.stack[nextIndex];
    if (!json) {
      return;
    }

    historyRef.current.applying = true;
    canvas.loadFromJSON(
      json,
      () => {
        canvas.renderAll();
        historyRef.current.applying = false;
        historyRef.current.index = nextIndex;
        setHistoryIndex(nextIndex);
        setHistoryLength(historyRef.current.stack.length);
        canvas.discardActiveObject();
        setSelectedObject(null);
        syncLayers();
      },
      (_object, instance) => {
        if (!instance) {
          return;
        }

        if (instance.get("objectId") === "artboard") {
          instance.set({ selectable: false, evented: false });
          artboardRef.current = instance as FabricRect;
        }
      }
    );
  }, [syncLayers]);

  // Double-click undo handler
  const handleButtonClick = useCallback((buttonId: string, action: () => void) => {
    const now = Date.now();
    const lastClick = lastClickRef.current;
    
    // Check if this is a double-click (within 400ms of last click on same button)
    if (lastClick && lastClick.button === buttonId && now - lastClick.time < 400) {
      // Double-click detected - undo instead
      if (canUndo) {
        applyHistory(historyRef.current.index - 1);
      }
      lastClickRef.current = null; // Reset to prevent triple-click issues
    } else {
      // Single click - perform the action
      action();
      lastClickRef.current = { button: buttonId, time: now };
    }
  }, [canUndo, applyHistory]);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (historyRef.current.applying) {
      return;
    }

    const json = JSON.stringify(canvas.toJSON(["objectId", "studioLabel"]));
    const { stack, index } = historyRef.current;
    const last = stack[index];

    if (json === last) {
      return;
    }

    const nextStack = stack.slice(0, index + 1);
    nextStack.push(json);
    historyRef.current.stack = nextStack;
    historyRef.current.index = nextStack.length - 1;
    setHistoryIndex(historyRef.current.index);
    setHistoryLength(nextStack.length);
  }, []);

  const updateSelectionState = useCallback((object: FabricObject | null) => {
    if (!object || object.get("objectId") === "artboard") {
      setSelectedObject(null);
      return;
    }

    setSelectedObject(object);
  }, []);

  const syncSelectionControls = useCallback((object: FabricObject | null) => {
    if (!object) {
      return;
    }

    setOpacity(typeof object.opacity === "number" ? object.opacity : 1);
    setAngle(typeof object.angle === "number" ? object.angle : 0);

    if (typeof object.strokeWidth === "number") {
      setStrokeWidth(object.strokeWidth);
    }

    const nextFill = typeof object.fill === "string" ? object.fill : DEFAULT_FILL;
    setFill(nextFill);

    const nextStroke = typeof object.stroke === "string" ? object.stroke : DEFAULT_STROKE;
    setStroke(nextStroke);

    if (object.type === "i-text") {
      const text = object as FabricIText;
      setFontSize(typeof text.fontSize === "number" ? text.fontSize : 56);
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const { width, height } = container.getBoundingClientRect();
    canvas.setWidth(width);
    canvas.setHeight(height);

    const scale = Math.min(
      width / (ARTBOARD.width + 240),
      height / (ARTBOARD.height + 240),
      1
    );

    const safeZoom = Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, scale));
    setZoom(safeZoom);

    const offsetX = (width - ARTBOARD.width * safeZoom) / 2;
    const offsetY = (height - ARTBOARD.height * safeZoom) / 2;
    canvas.setViewportTransform([safeZoom, 0, 0, safeZoom, offsetX, offsetY]);
    canvas.requestRenderAll();
  }, []);

  const addShape = useCallback(
    (shape: "rect" | "circle" | "triangle" | "line") => {
      const canvas = canvasRef.current;
      const artboard = artboardRef.current;
      if (!canvas || !artboard) {
        return;
      }

      const left = artboard.left ?? 0;
      const top = artboard.top ?? 0;
      const fabricModule = fabricRef.current;
      if (!fabricModule) {
        return;
      }

      const { Rect, Circle, Triangle, Line } = fabricModule;
      let object: FabricObject | null = null;

      if (shape === "rect") {
        object = new Rect({
          left: left + 120,
          top: top + 120,
          width: 220,
          height: 140,
          fill,
          stroke,
          strokeWidth,
          rx: 12,
          ry: 12,
        });
      }

      if (shape === "circle") {
        object = new Circle({
          left: left + 160,
          top: top + 160,
          radius: 90,
          fill,
          stroke,
          strokeWidth,
        });
      }

      if (shape === "triangle") {
        object = new Triangle({
          left: left + 140,
          top: top + 160,
          width: 200,
          height: 200,
          fill,
          stroke,
          strokeWidth,
        });
      }

      if (shape === "line") {
        object = new Line([0, 0, 260, 0], {
          left: left + 160,
          top: top + 200,
          stroke,
          strokeWidth: Math.max(2, strokeWidth),
        });
      }

      if (!object) {
        return;
      }

      ensureObjectMeta(object);
      canvas.add(object);
      setActiveObject(object);
      syncLayers();
      pushHistory();
    },
    [ensureObjectMeta, fill, stroke, strokeWidth, pushHistory, setActiveObject, syncLayers]
  );

  const addText = useCallback(() => {
    const canvas = canvasRef.current;
    const artboard = artboardRef.current;
    if (!canvas || !artboard) {
      return;
    }

    const fabricModule = fabricRef.current;
    if (!fabricModule) {
      return;
    }

    const { IText } = fabricModule;
    const text = new IText("Double-click to edit", {
      left: (artboard.left ?? 0) + 140,
      top: (artboard.top ?? 0) + 160,
      fill: "#1d1d1f",
      fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, sans-serif",
      fontSize,
      fontWeight: 600,
    });

    ensureObjectMeta(text);
    canvas.add(text);
    setActiveObject(text);
    syncLayers();
    pushHistory();
  }, [ensureObjectMeta, fill, fontSize, pushHistory, setActiveObject, syncLayers]);

  const addImageFromFile = useCallback((file: File) => {
    const canvas = canvasRef.current;
    const artboard = artboardRef.current;
    if (!canvas || !artboard) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fabricModule = fabricRef.current;
      if (!fabricModule) {
        return;
      }

      const { Image } = fabricModule;
      Image.fromURL(String(reader.result), (image) => {
        const maxWidth = ARTBOARD.width * 0.7;
        const maxHeight = ARTBOARD.height * 0.7;
        const scale = Math.min(maxWidth / image.width!, maxHeight / image.height!, 1);

        image.set({
          left: (artboard.left ?? 0) + 140,
          top: (artboard.top ?? 0) + 120,
          scaleX: scale,
          scaleY: scale,
        });

        ensureObjectMeta(image);
        canvas.add(image);
        setActiveObject(image);
        syncLayers();
        pushHistory();
      });
    };

    reader.readAsDataURL(file);
  }, [ensureObjectMeta, pushHistory, setActiveObject, syncLayers]);

  const handleDelete = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || active.get("objectId") === "artboard") {
      return;
    }

    canvas.remove(active);
    canvas.discardActiveObject();
    setSelectedObject(null);
    syncLayers();
    pushHistory();
  }, [pushHistory, syncLayers]);

  const duplicateSelected = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) {
      return;
    }

    active.clone((cloned) => {
      cloned.set({ left: (active.left ?? 0) + 30, top: (active.top ?? 0) + 30 });
      ensureObjectMeta(cloned);
      canvas.add(cloned);
      setActiveObject(cloned);
      syncLayers();
      pushHistory();
    });
  }, [ensureObjectMeta, pushHistory, setActiveObject, syncLayers]);

  const bringForward = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) {
      return;
    }

    canvas.bringForward(active);
    syncLayers();
    pushHistory();
  }, [pushHistory, syncLayers]);

  const sendBackward = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) {
      return;
    }

    canvas.sendBackwards(active);
    syncLayers();
    pushHistory();
  }, [pushHistory, syncLayers]);

  const alignCenter = useCallback(() => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    const artboard = artboardRef.current;
    if (!canvas || !active || !artboard) {
      return;
    }

    const centerX = (artboard.left ?? 0) + ARTBOARD.width / 2 - (active.getScaledWidth() ?? 0) / 2;
    const centerY = (artboard.top ?? 0) + ARTBOARD.height / 2 - (active.getScaledHeight() ?? 0) / 2;
    active.set({ left: centerX, top: centerY });
    active.setCoords();
    canvas.requestRenderAll();
    pushHistory();
  }, [pushHistory]);

  const applyFill = useCallback((value: string) => {
    setFill(value);
    if (!selectedObject) {
      return;
    }

    selectedObject.set({ fill: value });
    canvasRef.current?.requestRenderAll();
    pushHistory();
  }, [pushHistory, selectedObject]);

  const applyStroke = useCallback((value: string) => {
    setStroke(value);
    if (!selectedObject) {
      return;
    }

    selectedObject.set({ stroke: value });
    canvasRef.current?.requestRenderAll();
    pushHistory();
  }, [pushHistory, selectedObject]);

  const applyStrokeWidth = useCallback((value: number) => {
    setStrokeWidth(value);
    if (!selectedObject) {
      return;
    }

    selectedObject.set({ strokeWidth: value });
    canvasRef.current?.requestRenderAll();
    pushHistory();
  }, [pushHistory, selectedObject]);

  const applyOpacity = useCallback((value: number) => {
    setOpacity(value);
    if (!selectedObject) {
      return;
    }

    selectedObject.set({ opacity: value });
    canvasRef.current?.requestRenderAll();
    pushHistory();
  }, [pushHistory, selectedObject]);

  const applyAngle = useCallback((value: number) => {
    setAngle(value);
    if (!selectedObject) {
      return;
    }

    selectedObject.set({ angle: value });
    canvasRef.current?.requestRenderAll();
    pushHistory();
  }, [pushHistory, selectedObject]);

  const applyFontSize = useCallback((value: number) => {
    setFontSize(value);
    if (!selectedObject || selectedObject.type !== "i-text") {
      return;
    }

    selectedObject.set({ fontSize: value });
    canvasRef.current?.requestRenderAll();
    pushHistory();
  }, [pushHistory, selectedObject]);

  const applyZoom = useCallback((nextZoom: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const fabricModule = fabricRef.current;
    if (!fabricModule) {
      return;
    }

    const { Point } = fabricModule;
    const safeZoom = Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, nextZoom));
    const center = canvas.getCenter();
    canvas.zoomToPoint(new Point(center.left, center.top), safeZoom);
    setZoom(safeZoom);
    canvas.requestRenderAll();
  }, []);

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    const artboard = artboardRef.current;
    if (!canvas || !artboard) {
      return;
    }

    const dataUrl = canvas.toDataURL({
      format: "png",
      left: artboard.left ?? 0,
      top: artboard.top ?? 0,
      width: ARTBOARD.width,
      height: ARTBOARD.height,
      multiplier: 1,
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "design.png";
    link.click();
  }, []);

  const exportSVG = useCallback(() => {
    const canvas = canvasRef.current;
    const artboard = artboardRef.current;
    if (!canvas || !artboard) {
      return;
    }

    const svg = canvas.toSVG({
      viewBox: {
        x: artboard.left ?? 0,
        y: artboard.top ?? 0,
        width: ARTBOARD.width,
        height: ARTBOARD.height,
      },
    });

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "design.svg";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportJSON = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const json = JSON.stringify(canvas.toJSON(["objectId", "studioLabel"]), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "design.json";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const importJSON = useCallback((file: File) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const json = String(reader.result);
      historyRef.current.applying = true;
      canvas.loadFromJSON(
        json,
        () => {
          canvas.renderAll();
          historyRef.current.applying = false;
          canvas.discardActiveObject();
          setSelectedObject(null);
          syncLayers();
          pushHistory();
        },
        (_object, instance) => {
          if (instance?.get("objectId") === "artboard") {
            instance.set({ selectable: false, evented: false });
            artboardRef.current = instance as FabricRect;
          }
        }
      );
    };

    reader.readAsText(file);
  }, [pushHistory, syncLayers]);

  const applyImageFilter = useCallback((filter: "grayscale" | "sepia" | "none") => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active || active.type !== "image") {
      return;
    }

    const fabricModule = fabricRef.current;
    if (!fabricModule) {
      return;
    }

    const image = active as FabricImage;
    if (filter === "none") {
      image.filters = [];
    }

    if (filter === "grayscale") {
      image.filters = [new fabricModule.filters.Grayscale()];
    }

    if (filter === "sepia") {
      image.filters = [new fabricModule.filters.Sepia()];
    }

    image.applyFilters();
    canvas.requestRenderAll();
    pushHistory();
  }, [pushHistory]);

  // Initialize canvas only when user clicks to activate (prevents auto-scroll)
  const initializeCanvas = useCallback(async () => {
    const canvasElement = canvasElementRef.current;
    if (!canvasElement || canvasRef.current) return;

    try {
      setFabricLoading(true);
      setFabricError(null);
      
      const fabricModule = await import("fabric");
      fabricRef.current = fabricModule;
      const { Canvas, Rect, Shadow } = fabricModule;

      const canvas = new Canvas(canvasElement, {
        selection: true,
        preserveObjectStacking: true,
        fireRightClick: false,
        stopContextMenu: true,
      });

      canvasRef.current = canvas;

      const artboard = new Rect({
        left: 0,
        top: 0,
        width: ARTBOARD.width,
        height: ARTBOARD.height,
        fill: "#ffffff",
        stroke: "#e5e5e7",
        strokeWidth: 1,
        selectable: false,
        evented: false,
        rx: 12,
        ry: 12,
        shadow: new Shadow({
          color: "rgba(0, 0, 0, 0.1)",
          blur: 20,
          offsetX: 0,
          offsetY: 4,
        }),
      });

      artboard.set({ objectId: "artboard", studioLabel: "Artboard" });
      artboardRef.current = artboard;
      canvas.add(artboard);

      const handleSelection = () => {
        const active = canvas.getActiveObject();
        updateSelectionState(active ?? null);
        syncSelectionControls(active ?? null);
        syncLayers();
      };

      canvas.on("selection:created", handleSelection);
      canvas.on("selection:updated", handleSelection);
      canvas.on("selection:cleared", () => {
        updateSelectionState(null);
        syncLayers();
      });

      canvas.on("object:added", (event) => {
        if (event.target) {
          ensureObjectMeta(event.target);
        }
        syncLayers();
        pushHistory();
      });

      canvas.on("object:modified", () => {
        syncLayers();
        pushHistory();
      });

      canvas.on("object:removed", () => {
        syncLayers();
        pushHistory();
      });

      const resizeObserver = new ResizeObserver(() => resizeCanvas());
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      resizeCanvas();
      pushHistory();
      setCanvasReady(true);
      setFabricLoading(false);
    } catch (error) {
      console.error("[DesignStudio] Failed to load Fabric.js:", error);
      setFabricError(error instanceof Error ? error.message : "Failed to load design library");
      setFabricLoading(false);
      setUseFallback(true);
    }
  }, [ensureObjectMeta, pushHistory, resizeCanvas, syncLayers, syncSelectionControls, updateSelectionState]);

  useEffect(() => {
    if (!selectedObject) {
      return;
    }

    syncSelectionControls(selectedObject);
  }, [selectedObject, syncSelectionControls]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedObject) {
        event.preventDefault();
        handleDelete();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedo) {
            applyHistory(historyRef.current.index + 1);
          }
        } else if (canUndo) {
          applyHistory(historyRef.current.index - 1);
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [applyHistory, canRedo, canUndo, duplicateSelected, handleDelete, selectedObject]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.editor-selector')) {
        setShowEditorMenu(false);
      }
    };

    if (showEditorMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditorMenu]);

  const activeLayerId = selectedObject?.get("objectId")
    ? String(selectedObject.get("objectId"))
    : null;

  const propertiesHint = useMemo(() => {
    if (!selectedObject) {
      return "Select a layer to edit its properties.";
    }

    if (selectedObject.type === "image") {
      return "Adjust opacity, rotation, and filters for images.";
    }

    if (selectedObject.type === "i-text") {
      return "Edit typography, size, and styling.";
    }

    return "Tweak fill, stroke, and position.";
  }, [selectedObject]);

  return (
    <div className="studio-animate">
      <header className="studio-header">
        <div>
          <div className="studio-title">
            Design Studio
            {editorType === 'fabric' && fabricLoading && (
              <span className="studio-status-badge loading">Loading...</span>
            )}
            {editorType === 'fabric' && !fabricLoading && (
              <span className="studio-status-badge success">{editorMeta.badge}</span>
            )}
            {editorType !== 'fabric' && (
              <span className={`studio-status-badge ${editorMeta.badgeClass}`}>{editorMeta.badge}</span>
            )}
          </div>
          <div className="studio-subtitle">
            {editorType === 'fabric' && fabricLoading && "Initializing advanced design tools"}
            {editorType === 'fabric' && !fabricLoading && editorMeta.subtitle}
            {editorType !== 'fabric' && editorMeta.subtitle}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="editor-selector">
            <button 
              className="studio-btn studio-btn-compact" 
              onClick={() => setShowEditorMenu(!showEditorMenu)}
              title="Switch editor engine"
            >
              {editorMeta.icon}
              <span className="editor-label">{editorMeta.label}</span>
              <span className="editor-chevron">▼</span>
            </button>
            {showEditorMenu && (
              <div className="editor-menu" style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: '#ffffff',
                border: '1px solid var(--studio-border)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                minWidth: '260px',
                maxWidth: '90vw',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--studio-border)', fontSize: '12px', fontWeight: '600', color: 'var(--studio-text-soft)' }}>
                  SELECT EDITOR ENGINE
                </div>
                <button
                  className={`editor-menu-item ${editorType === 'fabric' ? 'active' : ''}`}
                  onClick={() => { setEditorType('fabric'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'fabric' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>🎨</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>Fabric.js</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>Professional design</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('konva'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'konva' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>⚡</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>Konva.js</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>Fast 2D canvas</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('paper'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'paper' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>📄</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>Paper.js</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>Vector graphics scripting</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('p5'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'p5' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>🎛️</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>P5.js</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>Creative coding library</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('two'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'two' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>✨</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>Two.js</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>Minimal 2D drawing</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('three'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'three' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>🧊</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>Three.js</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>3D graphics engine</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('pixi'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'pixi' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>🪄</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>PixiJS</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>WebGL 2D renderer</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('excalidraw'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'excalidraw' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>🧩</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>Excalidraw</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>Collaborative whiteboard</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('tldraw'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'tldraw' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>✍️</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>TLDraw</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>Infinite canvas</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('drawing'); setUseFallback(false); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'drawing' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>✏️</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>Drawing</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>Pure HTML5</div>
                  </div>
                </button>
                <button
                  className="editor-menu-item"
                  onClick={() => { setEditorType('html5'); setUseFallback(true); setShowEditorMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: editorType === 'html5' ? 'rgba(0, 122, 255, 0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span style={{ fontSize: '18px' }}>💾</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>HTML5</div>
                    <div style={{ fontSize: '11px', color: 'var(--studio-text-soft)' }}>Static canvas</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {editorType === 'fabric' && !useFallback && !fabricLoading && (
            <>
              <span className="studio-chip">{Math.round(zoom * 100)}%</span>
              <button className="studio-btn" onClick={() => applyZoom(zoom - 0.1)}>
                −
              </button>
              <button className="studio-btn" onClick={() => applyZoom(zoom + 0.1)}>
                +
              </button>
              <button className={`studio-btn studio-toggle${gridEnabled ? " is-on" : ""}`} onClick={() => setGridEnabled((prev) => !prev)}>
                Grid
              </button>
              <button className="studio-btn studio-btn-primary" onClick={exportPNG}>
                Export
              </button>
            </>
          )}
        </div>
      </header>

      <section className="studio-shell">
        <aside className="studio-rail studio-panel">
          <div 
            className={`studio-panel-title${collapsedTools ? " is-collapsed" : ""}`}
            onClick={() => setCollapsedTools(!collapsedTools)}
          >
            Tools
          </div>
          <div 
            className={`studio-collapsible${collapsedTools ? " is-collapsed" : ""}`}
            style={{ maxHeight: collapsedTools ? "0px" : "2000px" }}
          >
          {editorType === 'fabric' && fabricLoading && (
            <div className="studio-info-box mt-3">
              <p>⏳ Loading Fabric.js advanced tools...</p>
            </div>
          )}
          {editorType === 'html5' && (
            <div className="studio-info-box mt-3">
              <p><strong>🎨 HTML5 Canvas Mode</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                Static fallback using native browser Canvas API. Switch to other editors for interactive tools.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                Try: Fabric.js, Paper.js, P5.js, PixiJS
              </p>
            </div>
          )}
          {editorType === 'konva' && (
            <div className="studio-info-box mt-3" style={{ background: 'rgba(52, 199, 89, 0.08)', borderColor: 'rgba(52, 199, 89, 0.2)' }}>
              <p><strong>⚡ Konva.js Active</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                High-performance 2D canvas framework. Drag shapes on canvas. Free & Open Source.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                <a href="https://konvajs.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#34c759', textDecoration: 'underline' }}>Learn more →</a>
              </p>
            </div>
          )}
          {editorType === 'paper' && (
            <div className="studio-info-box mt-3">
              <p><strong>📄 Paper.js Active</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                Vector graphics scripting framework for precise paths and illustration workflows.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                <a href="https://paperjs.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#007aff', textDecoration: 'underline' }}>Learn more →</a>
              </p>
            </div>
          )}
          {editorType === 'p5' && (
            <div className="studio-info-box mt-3" style={{ background: 'rgba(255, 149, 0, 0.08)', borderColor: 'rgba(255, 149, 0, 0.2)' }}>
              <p><strong>🎛️ P5.js Active</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                Creative coding canvas for generative art, sketches, and interactive visuals.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                <a href="https://p5js.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#ff9500', textDecoration: 'underline' }}>Learn more →</a>
              </p>
            </div>
          )}
          {editorType === 'two' && (
            <div className="studio-info-box mt-3" style={{ background: 'rgba(0, 122, 255, 0.08)', borderColor: 'rgba(0, 122, 255, 0.2)' }}>
              <p><strong>✨ Two.js Active</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                Minimal 2D drawing API for quick geometric sketches and icons.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                <a href="https://two.js.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#007aff', textDecoration: 'underline' }}>Learn more →</a>
              </p>
            </div>
          )}
          {editorType === 'three' && (
            <div className="studio-info-box mt-3" style={{ background: 'rgba(88, 86, 214, 0.08)', borderColor: 'rgba(88, 86, 214, 0.2)' }}>
              <p><strong>🧊 Three.js Active</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                3D WebGL engine for scenes, lighting, and interactive objects.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#5856d6', textDecoration: 'underline' }}>Learn more →</a>
              </p>
            </div>
          )}
          {editorType === 'pixi' && (
            <div className="studio-info-box mt-3" style={{ background: 'rgba(52, 199, 89, 0.08)', borderColor: 'rgba(52, 199, 89, 0.2)' }}>
              <p><strong>🪄 PixiJS Active</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                WebGL-powered 2D renderer built for speed and animation-heavy scenes.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                <a href="https://pixijs.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#34c759', textDecoration: 'underline' }}>Learn more →</a>
              </p>
            </div>
          )}
          {editorType === 'excalidraw' && (
            <div className="studio-info-box mt-3" style={{ background: 'rgba(0, 122, 255, 0.08)', borderColor: 'rgba(0, 122, 255, 0.2)' }}>
              <p><strong>🧩 Excalidraw Active</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                Collaborative whiteboard with hand-drawn aesthetics and live sharing.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                <a href="https://excalidraw.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#007aff', textDecoration: 'underline' }}>Learn more →</a>
              </p>
            </div>
          )}
          {editorType === 'tldraw' && (
            <div className="studio-info-box mt-3" style={{ background: 'rgba(255, 149, 0, 0.08)', borderColor: 'rgba(255, 149, 0, 0.2)' }}>
              <p><strong>✍️ TLDraw Active</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                Infinite canvas whiteboard with smooth drawing tools and collaboration.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                <a href="https://tldraw.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#ff9500', textDecoration: 'underline' }}>Learn more →</a>
              </p>
            </div>
          )}
          {editorType === 'drawing' && (
            <div className="studio-info-box mt-3" style={{ background: 'rgba(255, 149, 0, 0.08)', borderColor: 'rgba(255, 149, 0, 0.2)' }}>
              <p><strong>✏️ Drawing Canvas Active</strong></p>
              <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                Simple pen & eraser tools. Pure HTML5 Canvas. Zero dependencies. Works 100% offline.
              </p>
              <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.6 }}>
                Perfect for quick sketches and annotations
              </p>
            </div>
          )}
          {editorType === 'fabric' && !fabricLoading && !useFallback && (
          <>
            <div className="studio-rail-block mt-3">
              <button className="studio-btn" onClick={() => handleButtonClick('addText', addText)}>
                Add Text
              </button>
              <button className="studio-btn" onClick={() => handleButtonClick('addRect', () => addShape("rect"))}>
                Rectangle
              </button>
              <button className="studio-btn" onClick={() => handleButtonClick('addCircle', () => addShape("circle"))}>
                Circle
              </button>
              <button className="studio-btn" onClick={() => handleButtonClick('addTriangle', () => addShape("triangle"))}>
                Triangle
              </button>
              <button className="studio-btn" onClick={() => handleButtonClick('addLine', () => addShape("line"))}>
                Line
              </button>
              <label className="studio-btn studio-btn-ghost">
                Upload Image
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      addImageFromFile(file);
                      event.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
            <div className="studio-divider" />
            <div className="studio-rail-block">
              <button className="studio-btn" onClick={() => handleButtonClick('duplicate', duplicateSelected)}>
                Duplicate
              </button>
              <button className="studio-btn" onClick={() => handleButtonClick('alignCenter', alignCenter)}>
                Center
              </button>
              <button className="studio-btn" onClick={() => handleButtonClick('bringForward', bringForward)}>
                Bring Forward
              </button>
              <button className="studio-btn" onClick={() => handleButtonClick('sendBackward', sendBackward)}>
                Send Backward
              </button>
              <button className="studio-btn" onClick={() => handleButtonClick('delete', handleDelete)}>
                Delete
              </button>
            </div>
            <div className="studio-divider" />
            <div className="studio-rail-block">
              <button className="studio-btn" onClick={exportSVG}>
                Export SVG
              </button>
              <button className="studio-btn" onClick={exportJSON}>
                Save JSON
              </button>
              <label className="studio-btn studio-btn-ghost">
                Load JSON
                <input
                  className="hidden"
                  type="file"
                  accept="application/json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      importJSON(file);
                      event.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
          </>
          )}
          </div>
        </aside>

        <section className="studio-canvas-wrap">
          {editorType === 'fabric' && !canvasReady && (
            <div className="studio-loading-state">
              <div className="studio-spinner"></div>
              <div className="studio-loading-text">Design Studio Ready</div>
              <div className="studio-loading-subtext">Click to start creating</div>
              <button 
                onClick={initializeCanvas}
                className="studio-btn studio-btn-primary mt-4"
                disabled={fabricLoading}
              >
                {fabricLoading ? 'Loading...' : 'Start Design Studio'}
              </button>
            </div>
          )}

          {editorType === 'fabric' && canvasReady && (
            <>
              <div className={`studio-grid${gridEnabled ? " is-on" : ""}`} />
              <div className="studio-canvas-stage" ref={containerRef}>
                <canvas className="studio-canvas-el" ref={canvasElementRef} />
              </div>
            </>
          )}

          {editorType === 'html5' && (
            <div className="studio-fallback-wrapper">
              <FallbackCanvas 
                error={fabricError}
                onRetry={() => {
                  setEditorType('fabric');
                  setUseFallback(false);
                  setFabricError(null);
                  window.location.reload();
                }}
              />
            </div>
          )}

          {editorType === 'konva' && (
            <div className="studio-fallback-wrapper">
              <KonvaEditor />
            </div>
          )}

          {editorType === 'paper' && (
            <div className="studio-fallback-wrapper">
              <PaperEditor />
            </div>
          )}

          {editorType === 'p5' && (
            <div className="studio-fallback-wrapper">
              <P5Editor />
            </div>
          )}

          {editorType === 'two' && (
            <div className="studio-fallback-wrapper">
              <TwoEditor />
            </div>
          )}

          {editorType === 'three' && (
            <div className="studio-fallback-wrapper">
              <ThreeEditor />
            </div>
          )}

          {editorType === 'pixi' && (
            <div className="studio-fallback-wrapper">
              <PixiEditor />
            </div>
          )}

          {editorType === 'excalidraw' && (
            <div className="studio-fallback-wrapper">
              <ExcalidrawEditor />
            </div>
          )}

          {editorType === 'tldraw' && (
            <div className="studio-fallback-wrapper">
              <TLDrawEditor />
            </div>
          )}

          {editorType === 'drawing' && (
            <div className="studio-fallback-wrapper">
              <DrawingCanvas />
            </div>
          )}
        </section>

        {editorType === 'fabric' && !useFallback && !fabricLoading && (
          <div className="studio-mobile-actions">
            <button className="studio-btn" onClick={addText}>
              + Text
            </button>
            <button className="studio-btn" onClick={() => addShape("rect")}>
              + Shape
            </button>
            <button className="studio-btn" onClick={duplicateSelected} disabled={!selectedObject}>
              Clone
            </button>
            <button className="studio-btn studio-btn-primary" onClick={exportPNG}>
              Save
            </button>
          </div>
        )}

        <aside className="studio-panel">
          <div 
            className={`studio-panel-title${collapsedProperties ? " is-collapsed" : ""}`}
            onClick={() => setCollapsedProperties(!collapsedProperties)}
          >
            Properties
          </div>
          <div 
            className={`studio-collapsible${collapsedProperties ? " is-collapsed" : ""}`}
            style={{ maxHeight: collapsedProperties ? "0px" : "2000px" }}
          >
          <p className="text-xs text-[color:var(--studio-text-soft)] mt-2 mb-4">
            {propertiesHint}
          </p>
          <div className="studio-list">
            <label className="studio-field">
              Fill
              <input
                className="studio-input"
                type="color"
                value={fill}
                onChange={(event) => applyFill(event.target.value)}
              />
            </label>
            <label className="studio-field">
              Stroke
              <input
                className="studio-input"
                type="color"
                value={stroke}
                onChange={(event) => applyStroke(event.target.value)}
              />
            </label>
            <label className="studio-field">
              Stroke Width
              <input
                className="studio-input"
                type="number"
                min={0}
                max={20}
                value={strokeWidth}
                onChange={(event) => applyStrokeWidth(Number(event.target.value))}
              />
            </label>
            <label className="studio-field">
              Opacity
              <input
                className="studio-input"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(event) => applyOpacity(Number(event.target.value))}
              />
            </label>
            <label className="studio-field">
              Angle
              <input
                className="studio-input"
                type="range"
                min={-180}
                max={180}
                step={1}
                value={angle}
                onChange={(event) => applyAngle(Number(event.target.value))}
              />
            </label>
            {selectedObject?.type === "i-text" && (
              <label className="studio-field">
                Font Size
                <input
                  className="studio-input"
                  type="number"
                  min={12}
                  max={160}
                  value={fontSize}
                  onChange={(event) => applyFontSize(Number(event.target.value))}
                />
              </label>
            )}
            {selectedObject?.type === "image" && (
              <div className="studio-field">
                Filters
                <div className="flex flex-wrap gap-2">
                  <button className="studio-btn" onClick={() => applyImageFilter("none")}>
                    None
                  </button>
                  <button className="studio-btn" onClick={() => applyImageFilter("grayscale")}>
                    Grayscale
                  </button>
                  <button className="studio-btn" onClick={() => applyImageFilter("sepia")}>
                    Sepia
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>

          <div className="studio-divider my-4" />
          <div 
            className={`studio-panel-title${collapsedLayers ? " is-collapsed" : ""}`}
            onClick={() => setCollapsedLayers(!collapsedLayers)}
          >
            Layers
          </div>
          <div 
            className={`studio-collapsible${collapsedLayers ? " is-collapsed" : ""}`}
            style={{ maxHeight: collapsedLayers ? "0px" : "2000px" }}
          >
          <div className="studio-list mt-3">
            {layers.length === 0 && (
              <div className="text-xs text-[color:var(--studio-text-soft)]">
                No layers yet. Add shapes, text, or images to start.
              </div>
            )}
            {layers.map((layer) => (
              <button
                key={layer.id}
                className={`studio-layer${activeLayerId === layer.id ? " is-active" : ""}`}
                onClick={() => {
                  const canvas = canvasRef.current;
                  if (!canvas) {
                    return;
                  }

                  const target = canvas
                    .getObjects()
                    .find((object) => String(object.get("objectId")) === layer.id);
                  if (target) {
                    setActiveObject(target);
                    updateSelectionState(target);
                    syncSelectionControls(target);
                  }
                }}
              >
                <span>{layer.label}</span>
                <span className="text-[color:var(--studio-text-soft)]">{layer.type}</span>
              </button>
            ))}
          </div>
          </div>

          <div className="studio-divider my-4" />
          <div 
            className={`studio-panel-title${collapsedHistory ? " is-collapsed" : ""}`}
            onClick={() => setCollapsedHistory(!collapsedHistory)}
          >
            History
          </div>
          <div 
            className={`studio-collapsible${collapsedHistory ? " is-collapsed" : ""}`}
            style={{ maxHeight: collapsedHistory ? "0px" : "500px" }}
          >
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              className="studio-btn"
              disabled={!canUndo}
              onClick={() => applyHistory(historyRef.current.index - 1)}
            >
              Undo
            </button>
            <button
              className="studio-btn"
              disabled={!canRedo}
              onClick={() => applyHistory(historyRef.current.index + 1)}
            >
              Redo
            </button>
          </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
