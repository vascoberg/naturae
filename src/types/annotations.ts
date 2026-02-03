// Custom annotation tool types
// Version 2.0 - Built from scratch after Fabric.js, Konva.js, and Excalidraw attempts

export interface BaseAnnotation {
  id: string;
  color: string;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: "arrow";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  strokeWidth?: number; // Default: 2
}

export interface CircleAnnotation extends BaseAnnotation {
  type: "circle";
  centerX: number;
  centerY: number;
  radius: number;
  strokeWidth?: number; // Default: 2
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  backgroundColor?: string; // Default: rgba(0,0,0,0.7)
}

export type Annotation = ArrowAnnotation | CircleAnnotation | TextAnnotation;

export interface AnnotationData {
  version: "2.0";
  tool: "custom";
  imageWidth: number;
  imageHeight: number;
  annotations: Annotation[];
}

// Preset colors for annotations
export const ANNOTATION_COLORS = [
  "#FFFFFF", // White
  "#000000", // Black
  "#EF4444", // Red
  "#F97316", // Orange
  "#FBBF24", // Yellow
  "#22C55E", // Green
  "#3B82F6", // Blue
] as const;

export type AnnotationColor = (typeof ANNOTATION_COLORS)[number] | string;

// Preset stroke widths
export const STROKE_WIDTHS = [1, 2, 3, 4, 6] as const;
export type StrokeWidth = (typeof STROKE_WIDTHS)[number];

// Preset background colors for text labels
export const TEXT_BACKGROUNDS = [
  { value: "rgba(0,0,0,0.7)", label: "Donker" },
  { value: "rgba(255,255,255,0.9)", label: "Licht" },
  { value: "rgba(239,68,68,0.8)", label: "Rood" },
  { value: "rgba(59,130,246,0.8)", label: "Blauw" },
  { value: "rgba(34,197,94,0.8)", label: "Groen" },
  { value: "transparent", label: "Geen" },
] as const;

export type AnnotationTool = "select" | "arrow" | "circle" | "text";

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
