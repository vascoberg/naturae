"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Circle, Type, MousePointer2, Trash2, ChevronUp, ChevronDown, Layers, Undo2, Redo2 } from "lucide-react";
import {
  type Annotation,
  type AnnotationData,
  type AnnotationTool,
  type AnnotationColor,
  ANNOTATION_COLORS,
  TEXT_BACKGROUNDS,
  generateId,
} from "@/types/annotations";

interface AnnotationCanvasProps {
  imageUrl: string;
  initialAnnotations?: AnnotationData | null;
  onSave: (data: AnnotationData, pngBase64: string) => Promise<void>;
  onCancel: () => void;
}

export function AnnotationCanvas({
  imageUrl,
  initialAnnotations,
  onSave,
  onCancel,
}: AnnotationCanvasProps) {
  // Debug: log what we receive
  console.log("AnnotationCanvas mounted with initialAnnotations:", {
    hasData: !!initialAnnotations,
    annotationsCount: initialAnnotations?.annotations?.length ?? 0,
    raw: initialAnnotations,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    const initial = initialAnnotations?.annotations || [];
    console.log("Initial annotations state:", initial.length, "items");
    return initial;
  });
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>("select");
  const [selectedColor, setSelectedColor] = useState<AnnotationColor>("#EF4444");
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(25);
  const [selectedFontSize, setSelectedFontSize] = useState(32);
  const [selectedTextBackground, setSelectedTextBackground] = useState<string>(TEXT_BACKGROUNDS[0].value);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  // Undo/redo history
  const [history, setHistory] = useState<Annotation[][]>(() => [initialAnnotations?.annotations || []]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedo = useRef(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [previewAnnotation, setPreviewAnnotation] = useState<Annotation | null>(null);

  // Drag/resize state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<"start" | "end" | "radius" | "fontSize" | null>(null);

  // Hover state for visual feedback
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Text editing state
  const [textInput, setTextInput] = useState<{
    x: number; // canvas coordinate for saving
    y: number; // canvas coordinate for saving
    screenX: number; // screen coordinate for positioning input
    screenY: number; // screen coordinate for positioning input
    value: string;
  } | null>(null);
  const textInputJustCreated = useRef(false);

  // Load image and set dimensions
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Debug: log when textInput changes
  useEffect(() => {
    console.log("textInput state changed:", textInput);
  }, [textInput]);

  // Sync toolbar to selected annotation's properties
  useEffect(() => {
    if (!selectedId) return;

    const selectedAnnotation = annotations.find((a) => a.id === selectedId);
    if (!selectedAnnotation) return;

    // Sync color
    setSelectedColor(selectedAnnotation.color);

    // Sync stroke width for arrow/circle
    if (selectedAnnotation.type === "arrow" || selectedAnnotation.type === "circle") {
      setSelectedStrokeWidth(selectedAnnotation.strokeWidth ?? 10);
    }

    // Sync text background and font size
    if (selectedAnnotation.type === "text") {
      setSelectedTextBackground(selectedAnnotation.backgroundColor ?? TEXT_BACKGROUNDS[0].value);
      setSelectedFontSize(selectedAnnotation.fontSize ?? 32);
    }
  }, [selectedId]); // Only run when selection changes

  // Update selected annotation when color changes
  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);

    // Update selected annotation if any
    if (selectedId) {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === selectedId ? { ...a, color: newColor } : a))
      );
    }
  };

  // Update selected annotation when stroke width changes
  const handleStrokeWidthChange = (newWidth: number) => {
    // Clamp to valid range
    const clampedWidth = Math.max(1, Math.min(100, newWidth));
    setSelectedStrokeWidth(clampedWidth);

    // Update selected annotation if it's an arrow or circle
    if (selectedId) {
      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== selectedId) return a;
          if (a.type === "arrow" || a.type === "circle") {
            return { ...a, strokeWidth: clampedWidth };
          }
          return a;
        })
      );
    }
  };

  // Update selected annotation when text background changes
  const handleTextBackgroundChange = (newBackground: string) => {
    setSelectedTextBackground(newBackground);

    // Update selected annotation if it's text
    if (selectedId) {
      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== selectedId) return a;
          if (a.type === "text") {
            return { ...a, backgroundColor: newBackground };
          }
          return a;
        })
      );
    }
  };

  // Update selected annotation when font size changes
  const handleFontSizeChange = (newSize: number) => {
    // Clamp to valid range
    const clampedSize = Math.max(12, Math.min(100, newSize));
    setSelectedFontSize(clampedSize);

    // Update selected annotation if it's text
    if (selectedId) {
      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== selectedId) return a;
          if (a.type === "text") {
            return { ...a, fontSize: clampedSize };
          }
          return a;
        })
      );
    }
  };

  // Push current state to history (called after significant changes)
  const pushToHistory = useCallback((newAnnotations: Annotation[]) => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }

    setHistory((prev) => {
      // Remove any forward history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new state
      newHistory.push(newAnnotations);
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;

    isUndoRedo.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setAnnotations(history[newIndex]);
    setSelectedId(null);
  }, [historyIndex, history]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    isUndoRedo.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setAnnotations(history[newIndex]);
    setSelectedId(null);
  }, [historyIndex, history]);

  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Render annotations on canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imageLoaded) {
      console.log("render skipped:", { canvas: !!canvas, ctx: !!ctx, imageLoaded });
      return;
    }

    console.log("render called, drawing", annotations.length, "annotations");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all annotations
    const allAnnotations = previewAnnotation
      ? [...annotations, previewAnnotation]
      : annotations;

    for (const annotation of allAnnotations) {
      const isSelected = annotation.id === selectedId;
      const isHovered = annotation.id === hoveredId && !isSelected;

      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;

      if (annotation.type === "arrow") {
        drawArrow(ctx, annotation, isSelected, isHovered);
      } else if (annotation.type === "circle") {
        drawCircle(ctx, annotation, isSelected, isHovered);
      } else if (annotation.type === "text") {
        drawText(ctx, annotation, isSelected, isHovered);
      }
    }
  }, [annotations, previewAnnotation, selectedId, hoveredId, imageLoaded]);

  // Re-render when annotations change or image loads
  useEffect(() => {
    render();
  }, [render]);

  // Draw arrow with arrowhead
  function drawArrow(
    ctx: CanvasRenderingContext2D,
    arrow: Extract<Annotation, { type: "arrow" }>,
    isSelected: boolean,
    isHovered: boolean = false
  ) {
    const { startX, startY, endX, endY, color, strokeWidth = 2 } = arrow;

    // Scale arrowhead proportionally with stroke width
    const headLength = Math.max(15, strokeWidth * 3);
    const headWidth = Math.max(10, strokeWidth * 2);
    const angle = Math.atan2(endY - startY, endX - startX);

    // Calculate where the line should stop (at the base of the arrowhead)
    const lineEndX = endX - headLength * Math.cos(angle);
    const lineEndY = endY - headLength * Math.sin(angle);

    // Set stroke width
    ctx.lineWidth = isSelected ? strokeWidth + 1 : isHovered ? strokeWidth + 0.5 : strokeWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = "round";

    // Draw hover glow
    if (isHovered) {
      ctx.save();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
      ctx.lineWidth = strokeWidth + 4;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
    }

    // Draw line (stopping before arrowhead)
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.stroke();

    // Draw arrowhead as filled triangle
    const perpAngle = angle + Math.PI / 2;
    const baseX1 = lineEndX + headWidth * Math.cos(perpAngle);
    const baseY1 = lineEndY + headWidth * Math.sin(perpAngle);
    const baseX2 = lineEndX - headWidth * Math.cos(perpAngle);
    const baseY2 = lineEndY - headWidth * Math.sin(perpAngle);

    ctx.beginPath();
    ctx.moveTo(endX, endY); // Tip of arrow
    ctx.lineTo(baseX1, baseY1); // Base corner 1
    ctx.lineTo(baseX2, baseY2); // Base corner 2
    ctx.closePath();
    ctx.fill();

    // Draw selection handles
    if (isSelected) {
      ctx.fillStyle = "#3B82F6";
      ctx.beginPath();
      ctx.arc(startX, startY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw circle
  function drawCircle(
    ctx: CanvasRenderingContext2D,
    circle: Extract<Annotation, { type: "circle" }>,
    isSelected: boolean,
    isHovered: boolean = false
  ) {
    const { centerX, centerY, radius, strokeWidth = 2 } = circle;

    // Set stroke width
    ctx.lineWidth = isSelected ? strokeWidth + 1 : isHovered ? strokeWidth + 0.5 : strokeWidth;

    // Draw hover glow
    if (isHovered) {
      ctx.save();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"; // Blue glow
      ctx.lineWidth = strokeWidth + 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.lineWidth = strokeWidth;
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw selection handle
    if (isSelected) {
      ctx.fillStyle = "#3B82F6";
      ctx.beginPath();
      ctx.arc(centerX + radius, centerY, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw text with background
  function drawText(
    ctx: CanvasRenderingContext2D,
    text: Extract<Annotation, { type: "text" }>,
    isSelected: boolean,
    isHovered: boolean = false
  ) {
    const { x, y, text: label, fontSize, color, backgroundColor = "rgba(0,0,0,0.7)" } = text;

    ctx.font = `bold ${fontSize}px sans-serif`;
    const metrics = ctx.measureText(label);
    const padding = 4;
    const bgHeight = fontSize + padding * 2;
    const bgWidth = metrics.width + padding * 2;

    // Draw hover glow
    if (isHovered) {
      ctx.save();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"; // Blue glow
      ctx.lineWidth = 4;
      ctx.strokeRect(x - padding - 2, y - fontSize - padding - 2, bgWidth + 4, bgHeight + 4);
      ctx.restore();
    }

    // Draw background (if not transparent)
    if (backgroundColor && backgroundColor !== "transparent") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(x - padding, y - fontSize - padding, bgWidth, bgHeight);
    }

    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(label, x, y);

    // Draw selection border and resize handle
    if (isSelected) {
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - padding - 2, y - fontSize - padding - 2, bgWidth + 4, bgHeight + 4);

      // Draw resize handle at bottom-right corner
      const handleX = x + bgWidth - padding + 2;
      const handleY = y + padding + 2;
      ctx.fillStyle = "#3B82F6";
      ctx.beginPath();
      ctx.arc(handleX, handleY, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Get mouse position relative to canvas
  function getMousePos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  // Hit detection for selecting annotations
  function hitTest(x: number, y: number): Annotation | null {
    const HIT_TOLERANCE = 20; // Larger hit area for easier selection

    // Check in reverse order (top-most first)
    for (let i = annotations.length - 1; i >= 0; i--) {
      const ann = annotations[i];

      if (ann.type === "arrow") {
        // Check if near the line
        const dist = pointToLineDistance(
          x,
          y,
          ann.startX,
          ann.startY,
          ann.endX,
          ann.endY
        );
        if (dist < HIT_TOLERANCE) return ann;
      } else if (ann.type === "circle") {
        // Check if inside or near the circle (entire interior is clickable)
        const dist = Math.sqrt(
          Math.pow(x - ann.centerX, 2) + Math.pow(y - ann.centerY, 2)
        );
        // Click anywhere inside the circle or near the edge
        if (dist <= ann.radius + HIT_TOLERANCE) return ann;
      } else if (ann.type === "text") {
        // Check if inside text bounding box (with extra padding for easier selection)
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
          ctx.font = `bold ${ann.fontSize}px sans-serif`;
          const metrics = ctx.measureText(ann.text);
          const padding = 4;
          const hitPadding = 10; // Extra padding for hit detection
          if (
            x >= ann.x - padding - hitPadding &&
            x <= ann.x + metrics.width + padding + hitPadding &&
            y >= ann.y - ann.fontSize - padding - hitPadding &&
            y <= ann.y + padding + hitPadding
          ) {
            return ann;
          }
        }
      }
    }
    return null;
  }

  // Check if point is on a resize handle of the selected annotation
  function hitTestHandle(x: number, y: number): "start" | "end" | "radius" | "fontSize" | null {
    if (!selectedId) return null;
    const ann = annotations.find((a) => a.id === selectedId);
    if (!ann) return null;

    const handleRadius = 10; // Slightly larger hit area than visual

    if (ann.type === "arrow") {
      // Check start handle
      const distStart = Math.sqrt(Math.pow(x - ann.startX, 2) + Math.pow(y - ann.startY, 2));
      if (distStart < handleRadius) return "start";
      // Check end handle
      const distEnd = Math.sqrt(Math.pow(x - ann.endX, 2) + Math.pow(y - ann.endY, 2));
      if (distEnd < handleRadius) return "end";
    } else if (ann.type === "circle") {
      // Check radius handle (on the right side of circle)
      const handleX = ann.centerX + ann.radius;
      const handleY = ann.centerY;
      const dist = Math.sqrt(Math.pow(x - handleX, 2) + Math.pow(y - handleY, 2));
      if (dist < handleRadius) return "radius";
    } else if (ann.type === "text") {
      // Check fontSize handle at bottom-right corner
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.font = `bold ${ann.fontSize}px sans-serif`;
        const metrics = ctx.measureText(ann.text);
        const padding = 4;
        const bgWidth = metrics.width + padding * 2;
        const handleX = ann.x + bgWidth - padding + 2;
        const handleY = ann.y + padding + 2;
        const dist = Math.sqrt(Math.pow(x - handleX, 2) + Math.pow(y - handleY, 2));
        if (dist < handleRadius) return "fontSize";
      }
    }

    return null;
  }

  // Point to line distance helper
  function pointToLineDistance(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Handle mouse down
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getMousePos(e);
    const canvas = canvasRef.current;

    if (selectedTool === "select") {
      // First check if clicking on a resize handle of selected annotation
      const handle = hitTestHandle(pos.x, pos.y);
      if (handle) {
        setResizeHandle(handle);
        setDragStart(pos);
        return;
      }

      // Check if clicking on any annotation
      const hit = hitTest(pos.x, pos.y);
      if (hit) {
        setSelectedId(hit.id);
        // Start dragging if clicking on already selected or newly selected annotation
        setIsDragging(true);
        setDragStart(pos);
      } else {
        setSelectedId(null);
      }
    } else if (selectedTool === "arrow" || selectedTool === "circle") {
      setIsDrawing(true);
      setDrawStart(pos);
    } else if (selectedTool === "text") {
      if (!canvas) {
        console.error("No canvas ref");
        return;
      }
      // Get screen position relative to canvas element
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      // Set flag to prevent immediate blur from closing the input
      textInputJustCreated.current = true;
      setTimeout(() => {
        textInputJustCreated.current = false;
      }, 300);
      // Start text input at this position
      setTextInput({ x: pos.x, y: pos.y, screenX, screenY, value: "" });
    }
  }

  // Handle mouse move
  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getMousePos(e);

    // Update hover state when in select mode and not dragging/resizing
    if (selectedTool === "select" && !isDragging && !resizeHandle) {
      const hit = hitTest(pos.x, pos.y);
      setHoveredId(hit?.id ?? null);
    }

    // Handle resize
    if (resizeHandle && dragStart && selectedId) {
      const ann = annotations.find((a) => a.id === selectedId);
      if (!ann) return;

      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== selectedId) return a;

          if (a.type === "arrow") {
            if (resizeHandle === "start") {
              return { ...a, startX: pos.x, startY: pos.y };
            } else if (resizeHandle === "end") {
              return { ...a, endX: pos.x, endY: pos.y };
            }
          } else if (a.type === "circle" && resizeHandle === "radius") {
            const newRadius = Math.sqrt(
              Math.pow(pos.x - a.centerX, 2) + Math.pow(pos.y - a.centerY, 2)
            );
            return { ...a, radius: Math.max(10, newRadius) }; // Minimum radius of 10
          } else if (a.type === "text" && resizeHandle === "fontSize") {
            // Calculate new font size based on drag distance from start position
            const dy = pos.y - dragStart.y;
            const newFontSize = Math.max(10, Math.min(72, a.fontSize + dy * 0.5)); // Min 10, max 72
            return { ...a, fontSize: Math.round(newFontSize) };
          }
          return a;
        })
      );
      // Update dragStart for continuous resizing
      if (resizeHandle === "fontSize") {
        setDragStart(pos);
      }
      return;
    }

    // Handle drag
    if (isDragging && dragStart && selectedId) {
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;

      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== selectedId) return a;

          if (a.type === "arrow") {
            return {
              ...a,
              startX: a.startX + dx,
              startY: a.startY + dy,
              endX: a.endX + dx,
              endY: a.endY + dy,
            };
          } else if (a.type === "circle") {
            return {
              ...a,
              centerX: a.centerX + dx,
              centerY: a.centerY + dy,
            };
          } else if (a.type === "text") {
            return {
              ...a,
              x: a.x + dx,
              y: a.y + dy,
            };
          }
          return a;
        })
      );
      setDragStart(pos); // Update drag start for next move
      return;
    }

    // Handle drawing new annotations
    if (!isDrawing || !drawStart) return;

    if (selectedTool === "arrow") {
      setPreviewAnnotation({
        id: "preview",
        type: "arrow",
        color: selectedColor,
        strokeWidth: selectedStrokeWidth,
        startX: drawStart.x,
        startY: drawStart.y,
        endX: pos.x,
        endY: pos.y,
      });
    } else if (selectedTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(pos.x - drawStart.x, 2) + Math.pow(pos.y - drawStart.y, 2)
      );
      setPreviewAnnotation({
        id: "preview",
        type: "circle",
        color: selectedColor,
        strokeWidth: selectedStrokeWidth,
        centerX: drawStart.x,
        centerY: drawStart.y,
        radius,
      });
    }
  }

  // Handle mouse up
  function handleMouseUp() {
    // Reset drag/resize state and save to history
    if (isDragging || resizeHandle) {
      setIsDragging(false);
      setResizeHandle(null);
      setDragStart(null);
      // Push to history after drag/resize completes
      pushToHistory(annotations);
      return;
    }

    // Handle finishing drawing
    if (!isDrawing || !drawStart) return;

    if (previewAnnotation && previewAnnotation.id === "preview") {
      // Add the annotation with a real ID
      const newAnnotation = { ...previewAnnotation, id: generateId() };
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      // Push to history
      pushToHistory(newAnnotations);
      // Auto-select the new annotation and switch to select mode
      setSelectedId(newAnnotation.id);
      setSelectedTool("select");
    }

    setIsDrawing(false);
    setDrawStart(null);
    setPreviewAnnotation(null);
  }

  // Handle text input submit
  function handleTextSubmit() {
    if (textInput && textInput.value.trim()) {
      const newId = generateId();
      const newText: Annotation = {
        id: newId,
        type: "text",
        color: selectedColor,
        backgroundColor: selectedTextBackground,
        x: textInput.x,
        y: textInput.y,
        text: textInput.value.trim(),
        fontSize: selectedFontSize,
      };
      const newAnnotations = [...annotations, newText];
      setAnnotations(newAnnotations);
      // Push to history
      pushToHistory(newAnnotations);
      // Auto-select the new annotation and switch to select mode
      setSelectedId(newId);
      setSelectedTool("select");
    }
    setTextInput(null);
  }

  // Delete selected annotation
  function handleDelete() {
    if (selectedId) {
      const newAnnotations = annotations.filter((a) => a.id !== selectedId);
      setAnnotations(newAnnotations);
      pushToHistory(newAnnotations);
      setSelectedId(null);
    }
  }

  // Move annotation up in layer order (towards front)
  function moveLayerUp(id: string) {
    setAnnotations((prev) => {
      const index = prev.findIndex((a) => a.id === id);
      if (index === -1 || index === prev.length - 1) return prev; // Already at top
      const newArr = [...prev];
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      return newArr;
    });
  }

  // Move annotation down in layer order (towards back)
  function moveLayerDown(id: string) {
    setAnnotations((prev) => {
      const index = prev.findIndex((a) => a.id === id);
      if (index === -1 || index === 0) return prev; // Already at bottom
      const newArr = [...prev];
      [newArr[index], newArr[index - 1]] = [newArr[index - 1], newArr[index]];
      return newArr;
    });
  }

  // Get annotation type icon
  function getAnnotationIcon(type: Annotation["type"]) {
    switch (type) {
      case "arrow": return "➡️";
      case "circle": return "⭕";
      case "text": return "T";
    }
  }

  // Get annotation label for layers panel
  function getAnnotationLabel(annotation: Annotation) {
    if (annotation.type === "text") {
      return annotation.text.length > 15 ? annotation.text.slice(0, 15) + "..." : annotation.text;
    }
    return annotation.type === "arrow" ? "Pijl" : "Cirkel";
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Undo: Cmd+Z / Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      // Redo: Cmd+Shift+Z / Ctrl+Shift+Z or Ctrl+Y
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !textInput) {
          e.preventDefault();
          handleDelete();
        }
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setTextInput(null);
        setIsDrawing(false);
        setPreviewAnnotation(null);
        setIsDragging(false);
        setResizeHandle(null);
        setDragStart(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, textInput, handleUndo, handleRedo]);

  // Handle save
  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    console.log("handleSave starting, annotations:", annotations.length);

    setIsSaving(true);
    try {
      // Create a new canvas with image + annotations
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = imageDimensions.width;
      exportCanvas.height = imageDimensions.height;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get 2d context");
        return;
      }

      console.log("Export canvas size:", exportCanvas.width, "x", exportCanvas.height);

      // Draw image first
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log("Image loaded for export:", img.naturalWidth, "x", img.naturalHeight);
          resolve();
        };
        img.onerror = (e) => {
          console.error("Image load error:", e);
          reject(new Error("Kon afbeelding niet laden voor export. Dit kan een CORS-probleem zijn."));
        };
        img.src = imageUrl;
      });

      try {
        ctx.drawImage(img, 0, 0);
      } catch (drawError) {
        console.error("drawImage error:", drawError);
        throw new Error("Kon afbeelding niet tekenen. Mogelijk een CORS-probleem met de afbeeldingsbron.");
      }

      // Draw annotations on top
      for (const annotation of annotations) {
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.lineWidth = 2;

        if (annotation.type === "arrow") {
          drawArrow(ctx, annotation, false);
        } else if (annotation.type === "circle") {
          drawCircle(ctx, annotation, false);
        } else if (annotation.type === "text") {
          drawText(ctx, annotation, false);
        }
      }

      // Export as PNG base64
      let pngBase64: string;
      try {
        pngBase64 = exportCanvas.toDataURL("image/png");
      } catch (toDataUrlError) {
        console.error("toDataURL error:", toDataUrlError);
        throw new Error(
          "Kon geannoteerde afbeelding niet exporteren. De afbeelding heeft mogelijk geen CORS-headers. " +
          "Probeer de afbeelding opnieuw toe te voegen via de media picker."
        );
      }
      console.log("PNG generated, length:", pngBase64.length, "starts with:", pngBase64.substring(0, 30));

      // Create annotation data
      const data: AnnotationData = {
        version: "2.0",
        tool: "custom",
        imageWidth: imageDimensions.width,
        imageHeight: imageDimensions.height,
        annotations,
      };

      console.log("Calling onSave with data and PNG");
      await onSave(data, pngBase64);
      console.log("onSave completed");
    } catch (error) {
      console.error("Failed to save annotations:", error);
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : "Onbekende fout bij opslaan";
      toast.error(`Opslaan mislukt: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }

  if (!imageLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Afbeelding laden...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between bg-background">
        <Button variant="ghost" onClick={onCancel}>
          ← Terug
        </Button>
        <h1 className="font-semibold">Foto annoteren</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Opslaan..." : "Opslaan"}
        </Button>
      </header>

      {/* Canvas area */}
      <main className="flex-1 overflow-auto bg-muted/30 p-4 flex items-start justify-center">
        <div
          ref={containerRef}
          className="relative inline-block"
          style={{ maxWidth: "100%" }}
        >
          {/* Background image */}
          <img
            src={imageUrl}
            alt=""
            style={{
              maxWidth: "100%",
              height: "auto",
              display: "block",
            }}
          />

          {/* Annotation canvas overlay */}
          <canvas
            ref={canvasRef}
            width={imageDimensions.width}
            height={imageDimensions.height}
            className="absolute inset-0 w-full h-full"
            style={{
              cursor:
                isDragging
                  ? "grabbing"
                  : resizeHandle
                    ? resizeHandle === "fontSize"
                      ? "ns-resize"
                      : "nwse-resize"
                    : selectedTool === "select"
                      ? hoveredId
                        ? "pointer"
                        : selectedId
                          ? "grab"
                          : "default"
                      : "crosshair",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              handleMouseUp();
              setHoveredId(null);
            }}
          />

          {/* Text input overlay */}
          {textInput && (
            <input
              type="text"
              value={textInput.value}
              onChange={(e) => {
                setTextInput({ ...textInput, value: e.target.value });
              }}
              onBlur={() => {
                // Ignore blur if we just created the input (prevents mouseUp from closing it)
                if (textInputJustCreated.current) {
                  console.log("Ignoring blur - just created");
                  return;
                }
                console.log("Text input blur - will submit");
                // Small delay to allow for intentional clicks
                setTimeout(handleTextSubmit, 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTextSubmit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setTextInput(null);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="border-2 border-primary bg-white dark:bg-gray-900 px-2 py-1 text-sm rounded shadow-lg text-foreground"
              style={{
                position: "absolute",
                left: `${textInput.screenX}px`,
                top: `${textInput.screenY}px`,
                minWidth: 150,
                zIndex: 9999,
              }}
              placeholder="Typ label..."
            />
          )}
        </div>
      </main>

      {/* Toolbar */}
      <footer className="border-t p-4 bg-background relative">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* Tool selection */}
          <div className="flex gap-1">
            <Button
              variant={selectedTool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("select")}
              title="Selecteren"
            >
              <MousePointer2 className="w-4 h-4" />
            </Button>
            <Button
              variant={selectedTool === "arrow" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("arrow")}
              title="Pijl"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant={selectedTool === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("circle")}
              title="Cirkel"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant={selectedTool === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("text")}
              title="Tekst"
            >
              <Type className="w-4 h-4" />
            </Button>
          </div>

          {/* Color selection */}
          <div className="flex gap-1 flex-wrap items-center">
            {ANNOTATION_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-5 h-5 rounded-full border-2 ${
                  selectedColor === color
                    ? "border-primary ring-2 ring-primary ring-offset-1"
                    : "border-muted-foreground/30"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {/* Custom color picker */}
            <div className="relative">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Kies een kleur"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  !ANNOTATION_COLORS.includes(selectedColor as typeof ANNOTATION_COLORS[number])
                    ? "border-primary ring-2 ring-primary ring-offset-1"
                    : "border-muted-foreground/30"
                }`}
                style={{
                  background: !ANNOTATION_COLORS.includes(selectedColor as typeof ANNOTATION_COLORS[number])
                    ? selectedColor
                    : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
                }}
              />
            </div>
          </div>

          {/* Stroke width slider - show only for arrow/circle tools */}
          {(selectedTool === "arrow" || selectedTool === "circle") && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Dikte:</span>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={selectedStrokeWidth}
                onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                className="w-20 h-2 accent-primary cursor-pointer"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={selectedStrokeWidth}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  handleStrokeWidthChange(Math.max(1, Math.min(100, val)));
                }}
                className="w-12 text-xs text-center border rounded px-1 py-0.5 bg-background"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          )}

          {/* Text controls - show only for text tool */}
          {selectedTool === "text" && (
            <>
              {/* Font size slider */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Grootte:</span>
                <input
                  type="range"
                  min={12}
                  max={72}
                  step={1}
                  value={selectedFontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="w-20 h-2 accent-primary cursor-pointer"
                />
                <input
                  type="number"
                  min={12}
                  max={100}
                  value={selectedFontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 12;
                    handleFontSizeChange(Math.max(12, Math.min(100, val)));
                  }}
                  className="w-12 text-xs text-center border rounded px-1 py-0.5 bg-background"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
              {/* Text background dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Achtergrond:</span>
                <Select value={selectedTextBackground} onValueChange={handleTextBackgroundChange}>
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top" className="min-w-24">
                    {TEXT_BACKGROUNDS.map((bg) => (
                      <SelectItem key={bg.value} value={bg.value} className="text-xs">
                        {bg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Undo/Redo buttons */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Ongedaan maken (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Opnieuw (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Delete button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!selectedId}
            title="Verwijderen (Delete)"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* Layers toggle button */}
          <Button
            variant={showLayersPanel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowLayersPanel(!showLayersPanel)}
            title="Lagen"
            disabled={annotations.length === 0}
          >
            <Layers className="w-4 h-4" />
            {annotations.length > 0 && (
              <span className="ml-1 text-xs">{annotations.length}</span>
            )}
          </Button>
        </div>

        {/* Floating Layers panel - positioned above toolbar */}
        {showLayersPanel && annotations.length > 0 && (
          <div className="absolute bottom-full right-4 mb-2 w-64 bg-background border rounded-lg shadow-lg p-3 z-50">
            <div className="text-xs font-medium text-muted-foreground mb-2">Lagen (boven = voorgrond)</div>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {/* Show in reverse order: last item (top layer) first */}
              {[...annotations].reverse().map((annotation, reversedIndex) => {
                const actualIndex = annotations.length - 1 - reversedIndex;
                const isTop = actualIndex === annotations.length - 1;
                const isBottom = actualIndex === 0;

                return (
                  <div
                    key={annotation.id}
                    onClick={() => setSelectedId(annotation.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                      selectedId === annotation.id
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted/50 hover:bg-muted border border-transparent"
                    }`}
                  >
                    {/* Type icon */}
                    <span className="w-5 text-center">
                      {getAnnotationIcon(annotation.type)}
                    </span>

                    {/* Color indicator */}
                    <span
                      className="w-3 h-3 rounded-full border border-muted-foreground/30"
                      style={{ backgroundColor: annotation.color }}
                    />

                    {/* Label */}
                    <span className="flex-1 truncate text-xs">
                      {getAnnotationLabel(annotation)}
                    </span>

                    {/* Up/Down buttons */}
                    <div className="flex gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayerUp(annotation.id);
                        }}
                        disabled={isTop}
                        className={`p-0.5 rounded ${
                          isTop
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "hover:bg-background text-muted-foreground hover:text-foreground"
                        }`}
                        title="Naar voren"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayerDown(annotation.id);
                        }}
                        disabled={isBottom}
                        className={`p-0.5 rounded ${
                          isBottom
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "hover:bg-background text-muted-foreground hover:text-foreground"
                        }`}
                        title="Naar achteren"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
