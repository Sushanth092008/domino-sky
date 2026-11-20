function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function interpolateGreatCircle(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  t: number
): { lat: number; lng: number } {
  const rLat1 = toRad(lat1);
  const rLng1 = toRad(lng1);
  const rLat2 = toRad(lat2);
  const rLng2 = toRad(lng2);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((rLat2 - rLat1) / 2) ** 2 +
          Math.cos(rLat1) * Math.cos(rLat2) * Math.sin((rLng2 - rLng1) / 2) ** 2
      )
    );

  if (d < 1e-6) {
    return { lat: lat1, lng: lng1 };
  }

  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);

  const x = A * Math.cos(rLat1) * Math.cos(rLng1) + B * Math.cos(rLat2) * Math.cos(rLng2);
  const y = A * Math.cos(rLat1) * Math.sin(rLng1) + B * Math.cos(rLat2) * Math.sin(rLng2);
  const z = A * Math.sin(rLat1) + B * Math.sin(rLat2);

  const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
  const lng = toDeg(Math.atan2(y, x));

  return { lat, lng };
}

export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const dLng = toRad(lng2 - lng1);

  const y = Math.sin(dLng) * Math.cos(rLat2);
  const x =
    Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLng);

  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

export function generateArcLineString(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  numPoints: number = 30
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const pt = interpolateGreatCircle(lat1, lng1, lat2, lng2, t);
    points.push([pt.lng, pt.lat]);
  }
  return points;
}


