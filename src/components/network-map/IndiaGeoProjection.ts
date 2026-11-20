// DOMINO SKY - Geographic Projection for Indian Subcontinent
// Accurate Mercator-style linear projection mapping WGS84 Lat/Lng to SVG canvas space

export interface GeoPoint {
  x: number;
  y: number;
}

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 900;

// Geographic bounding box for India & flight network
const MIN_LNG = 68.0;
const MAX_LNG = 96.0;
const MIN_LAT = 7.5;
const MAX_LAT = 34.5;

export function projectLatLng(lat: number, lng: number): GeoPoint {
  // Linear equirectangular projection bounded and padded
  const xRatio = (lng - MIN_LNG) / (MAX_LNG - MIN_LNG);
  const yRatio = (MAX_LAT - lat) / (MAX_LAT - MIN_LAT);

  const paddingX = 40;
  const paddingY = 40;
  const innerWidth = MAP_WIDTH - paddingX * 2;
  const innerHeight = MAP_HEIGHT - paddingY * 2;

  return {
    x: Math.round(paddingX + xRatio * innerWidth),
    y: Math.round(paddingY + yRatio * innerHeight),
  };
}

// Great-circle quadratic bezier curve control point calculation
export function calculateArcCurve(start: GeoPoint, end: GeoPoint, curvature: number = 0.18): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);

  // Normal vector perpendicular to chord
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;

  // Arc bend offset (bowed slightly west/north for natural look)
  const offset = distance * curvature;
  const nx = -dy / distance;
  const ny = dx / distance;

  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
}

// Computes aircraft interpolated position along arc at parameter t (0 to 1)
export function getArcPositionAt(start: GeoPoint, end: GeoPoint, t: number, curvature: number = 0.18): { x: number; y: number; angle: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);

  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const offset = distance * curvature;
  const nx = -dy / distance;
  const ny = dx / distance;

  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  // Quadratic Bezier: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
  const oneMinusT = 1 - t;
  const x = oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * cx + t * t * end.x;
  const y = oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * cy + t * t * end.y;

  // Tangent for rotation angle: B'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
  const tx = 2 * oneMinusT * (cx - start.x) + 2 * t * (end.x - cx);
  const ty = 2 * oneMinusT * (cy - start.y) + 2 * t * (end.y - cy);
  const angle = (Math.atan2(ty, tx) * 180) / Math.PI;

  return { x, y, angle };
}
