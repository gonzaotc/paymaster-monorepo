import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Universal Paymaster 🪐',
  description: 'made in Argentina 🇦🇷🇦🇷',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 antialiased`}>
        <Providers>
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-10 text-slate-900 sm:px-8 sm:py-14 lg:px-14 lg:py-16">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
