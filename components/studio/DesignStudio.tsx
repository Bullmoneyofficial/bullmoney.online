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

const ARTBOARD = { width: 1200, height: 800 };
const ZOOM_LIMITS = { min: 0.35, max: 2 };

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

const DEFAULT_FILL = "#f97316";
const DEFAULT_STROKE = "#f8fafc";

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

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

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
        type: String(object.type),
      }))
      .reverse();

    setLayers(items);
  }, []);

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
          artboardRef.current = instance as Rect;
        }
      }
    );
  }, [syncLayers]);

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
      fill,
      fontFamily: "Impact, Haettenschweiler, Arial Narrow Bold, sans-serif",
      fontSize,
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
            artboardRef.current = instance as Rect;
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

  useEffect(() => {
    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;

    const setupCanvas = async () => {
      const canvasElement = canvasElementRef.current;
      if (!canvasElement) {
        return;
      }

      const fabricModule = await import("fabric");
      if (!mounted) {
        return;
      }

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
        fill: "#111827",
        stroke: "#1f2937",
        strokeWidth: 2,
        selectable: false,
        evented: false,
        rx: 18,
        ry: 18,
        shadow: new Shadow({
          color: "rgba(15, 23, 42, 0.6)",
          blur: 30,
          offsetX: 0,
          offsetY: 14,
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

      resizeObserver = new ResizeObserver(() => resizeCanvas());
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      resizeCanvas();
      pushHistory();
    };

    setupCanvas();

    return () => {
      mounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      canvasRef.current?.dispose();
      canvasRef.current = null;
    };
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
          <div className="studio-title">BullMoney Studio</div>
          <div className="studio-subtitle">Adobe-style design room</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="studio-chip">{Math.round(zoom * 100)}% Zoom</span>
          <button className="studio-btn" onClick={() => applyZoom(zoom - 0.1)}>
            Zoom -
          </button>
          <button className="studio-btn" onClick={() => applyZoom(zoom + 0.1)}>
            Zoom +
          </button>
          <button className="studio-btn studio-toggle" onClick={() => setGridEnabled((prev) => !prev)}>
            {gridEnabled ? "Grid On" : "Grid Off"}
          </button>
          <button className="studio-btn studio-btn-primary" onClick={exportPNG}>
            Export PNG
          </button>
        </div>
      </header>

      <section className="studio-shell">
        <aside className="studio-rail studio-panel">
          <div className="studio-panel-title">Tools</div>
          <div className="studio-rail-block">
            <button className="studio-btn" onClick={addText}>
              Add Text
            </button>
            <button className="studio-btn" onClick={() => addShape("rect")}>
              Rectangle
            </button>
            <button className="studio-btn" onClick={() => addShape("circle")}>
              Circle
            </button>
            <button className="studio-btn" onClick={() => addShape("triangle")}>
              Triangle
            </button>
            <button className="studio-btn" onClick={() => addShape("line")}>
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
            <button className="studio-btn" onClick={duplicateSelected}>
              Duplicate
            </button>
            <button className="studio-btn" onClick={alignCenter}>
              Center
            </button>
            <button className="studio-btn" onClick={bringForward}>
              Bring Forward
            </button>
            <button className="studio-btn" onClick={sendBackward}>
              Send Backward
            </button>
            <button className="studio-btn" onClick={handleDelete}>
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
        </aside>

        <section className="studio-canvas-wrap">
          <div className={`studio-grid${gridEnabled ? " is-on" : ""}`} />
          <div className="studio-canvas-stage" ref={containerRef}>
            <canvas className="studio-canvas-el" ref={canvasElementRef} />
          </div>
        </section>

        <aside className="studio-panel">
          <div className="studio-panel-title">Properties</div>
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

          <div className="studio-divider my-4" />
          <div className="studio-panel-title">Layers</div>
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

          <div className="studio-divider my-4" />
          <div className="studio-panel-title">History</div>
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
        </aside>
      </section>
    </div>
  );
}
