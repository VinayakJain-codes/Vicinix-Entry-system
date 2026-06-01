import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
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
  title: { template: '%s | Marketnera Entry', default: 'Marketnera Entry' },
  description: 'Real-time QR entry management by Marketnera × Vicinix',
  manifest: '/manifest.json',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' }, // using same icon for now
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
      </body>
    </html>
  );
}
