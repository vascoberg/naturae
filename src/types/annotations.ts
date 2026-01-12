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
}

export interface CircleAnnotation extends BaseAnnotation {
  type: "circle";
  centerX: number;
  centerY: number;
  radius: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
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
  "#FFFFFF", // White - for dark backgrounds
  "#000000", // Black - for light backgrounds
  "#EF4444", // Red - attention
  "#FBBF24", // Yellow - warning
  "#22C55E", // Green - positive
  "#3B82F6", // Blue - neutral
] as const;

export type AnnotationColor = (typeof ANNOTATION_COLORS)[number];

export type AnnotationTool = "select" | "arrow" | "circle" | "text";

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
