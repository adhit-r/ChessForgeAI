import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'ChessForgeAI',
  description: 'AI-powered chess analysis and training platform.',
  icons: {
    // Consider adding a placeholder icon or a simple SVG icon later
    // icon: "/favicon.ico", // Example
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark"> {/* Assuming a dark theme default for glassmorphism */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Updated font to Inter for a more modern feel, kept Open Sans as fallback */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          // Add a subtle pattern or gradient to the body background for better glassmorphism effect
          "bg-gradient-to-br from-background to-slate-900" // Example gradient
        )}
      >
        {children}
      </body>
    </html>
  );
}
