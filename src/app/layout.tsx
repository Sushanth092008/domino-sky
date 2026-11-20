import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DOMINO SKY — Airline Network Disruption & Recovery Simulator',
  description: 'Network Operations Control Centre simulator modeling cascading flight delays, aircraft rotations, passenger connections, crew duty limits, and AI-assisted recovery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-slate-950 text-slate-100 h-full antialiased">
      <body className="h-full w-full overflow-hidden bg-slate-950 font-sans">{children}</body>
    </html>
  );
}
