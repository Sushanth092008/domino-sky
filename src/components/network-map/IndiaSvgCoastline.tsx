// DOMINO SKY - High-precision Indian Subcontinent Vector Outline & Tactical Graticule

import React from 'react';
import { MAP_WIDTH, MAP_HEIGHT, projectLatLng } from './IndiaGeoProjection';

export const IndiaSvgCoastline: React.FC = () => {
  // Approximate polygonal boundary path tracing the outer periphery of India
  const boundaryCoords: [number, number][] = [
    // Kashmir / North
    [34.5, 76.5],
    [34.2, 77.8],
    [32.8, 78.5],
    [31.0, 79.2],
    [30.2, 80.5],
    // Nepal border
    [28.8, 80.2],
    [27.4, 83.2],
    [26.8, 85.2],
    [26.5, 88.0],
    // Sikkim / Bhutan border
    [27.8, 88.5],
    [27.6, 89.2],
    [27.0, 92.0],
    // Arunachal / Northeast
    [28.2, 94.0],
    [28.5, 96.0],
    [27.2, 96.5],
    // Assam / Nagaland / Manipur / Mizoram
    [26.0, 95.5],
    [24.5, 94.0],
    [23.0, 93.2],
    [22.0, 92.8],
    // Bangladesh border / Bengal
    [23.0, 91.5],
    [25.0, 90.0],
    [25.5, 88.5],
    [22.5, 89.0],
    // Odisha / Andhra East Coast
    [21.5, 87.0],
    [19.8, 86.0],
    [17.8, 83.4],
    [16.0, 81.0],
    [13.5, 80.3],
    [11.5, 79.8],
    // Tamil Nadu / Palk Strait / Southern tip (Kanyakumari)
    [9.5, 79.0],
    [8.1, 77.5],
    // Kerala / West Coast
    [8.8, 76.5],
    [10.5, 76.0],
    [12.5, 74.9],
    // Goa / Maharashtra Coast
    [15.3, 73.8],
    [18.9, 72.8],
    [20.5, 72.8],
    // Gujarat / Gulf of Khambhat / Saurashtra / Kutch
    [21.2, 72.2],
    [20.8, 70.8],
    [21.8, 69.1],
    [22.8, 69.5],
    [23.8, 68.6],
    [24.2, 70.8],
    // Rajasthan / Western border
    [24.8, 71.2],
    [26.5, 70.5],
    [28.0, 71.8],
    [29.8, 73.5],
    // Punjab / J&K Western border
    [31.5, 74.8],
    [32.8, 74.5],
    [34.5, 74.5],
    [34.5, 76.5],
  ];

  // Convert coords to projected SVG polygon string
  const pathData = boundaryCoords
    .map((coord, i) => {
      const pt = projectLatLng(coord[0], coord[1]);
      return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
    })
    .join(' ') + ' Z';

  return (
    <g className="tactical-basemap pointer-events-none select-none">
      <defs>
        {/* Subtle grid pattern for radar ops feel */}
        <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" />
        </pattern>
        {/* Radial sweep glow centered on India */}
        <radialGradient id="center-radar-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(14, 165, 233, 0.08)" />
          <stop offset="80%" stopColor="rgba(15, 23, 42, 0)" />
        </radialGradient>
      </defs>

      {/* Background Graticule Grid */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#radar-grid)" />
      <circle cx={MAP_WIDTH / 2} cy={MAP_HEIGHT / 2} r="380" fill="url(#center-radar-glow)" />

      {/* Range rings from central India (Nagpur/Bhopal region ~ 21N, 78E) */}
      <circle
        cx={projectLatLng(21.1, 79.0).x}
        cy={projectLatLng(21.1, 79.0).y}
        r="140"
        fill="none"
        stroke="rgba(56, 189, 248, 0.06)"
        strokeDasharray="4 4"
      />
      <circle
        cx={projectLatLng(21.1, 79.0).x}
        cy={projectLatLng(21.1, 79.0).y}
        r="280"
        fill="none"
        stroke="rgba(56, 189, 248, 0.05)"
        strokeDasharray="4 4"
      />
      <circle
        cx={projectLatLng(21.1, 79.0).x}
        cy={projectLatLng(21.1, 79.0).y}
        r="420"
        fill="none"
        stroke="rgba(56, 189, 248, 0.03)"
        strokeDasharray="6 6"
      />

      {/* India Country Silhouette */}
      <path
        d={pathData}
        fill="rgba(30, 41, 59, 0.45)"
        stroke="rgba(71, 85, 105, 0.4)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Subtle interior FIR / Sector lines */}
      <path
        d={`M ${projectLatLng(22.0, 68.0).x} ${projectLatLng(22.0, 68.0).y} L ${projectLatLng(22.0, 92.0).x} ${projectLatLng(22.0, 92.0).y}`}
        stroke="rgba(148, 163, 184, 0.08)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <path
        d={`M ${projectLatLng(15.0, 72.0).x} ${projectLatLng(15.0, 72.0).y} L ${projectLatLng(15.0, 84.0).x} ${projectLatLng(15.0, 84.0).y}`}
        stroke="rgba(148, 163, 184, 0.08)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <path
        d={`M ${projectLatLng(32.0, 78.0).x} ${projectLatLng(32.0, 78.0).y} L ${projectLatLng(9.0, 78.0).x} ${projectLatLng(9.0, 78.0).y}`}
        stroke="rgba(148, 163, 184, 0.08)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
    </g>
  );
};
