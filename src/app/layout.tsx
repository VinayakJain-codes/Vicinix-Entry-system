import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700']
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '600']
});

export const metadata: Metadata = {
  metadataBase: new URL('https://entrysystem.vicinix.co.in'),
  title: { template: '%s | Marketnera Entry', default: 'Marketnera Entry' },
  description: 'Real-time QR entry management by Marketnera × Vicinix',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/Marketneraxvicinix.png',
  },
  openGraph: {
    title: 'Marketnera Entry',
    description: 'Real-time QR entry management by Marketnera × Vicinix',
    url: 'https://entrysystem.vicinix.co.in',
    siteName: 'Marketnera Entry',
    images: [
      {
        url: '/Marketneraxvicinix.png',
        width: 1200,
        height: 630,
        alt: 'Marketnera × Vicinix Entry System Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#13EC5B',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0F0D] text-[#E8F5F0]">
        {children}
        <Toaster position="top-right" 
          toastOptions={{
            style: {
              background: '#111918',
              color: '#E8F5F0',
              border: '1px solid #1F2D28',
              fontFamily: 'var(--font-display)',
            },
            success: { iconTheme: { primary: '#13EC5B', secondary: '#0A0F0D' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#0A0F0D' } },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
