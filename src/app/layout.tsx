import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StreamNest — Your Channels, Curated',
  description: 'A personal dashboard for organizing and launching your own authorized streaming sources.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
