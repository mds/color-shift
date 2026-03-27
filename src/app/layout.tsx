import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { getGoogleFontsUrl } from "@/lib/fonts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const alphaLyrae = localFont({
  src: "../fonts/AlphaLyrae-Medium.woff2",
  variable: "--font-alpha-lyrae",
  display: "swap",
});

const departureMono = localFont({
  src: "../fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure-mono",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const ghostByte = localFont({
  src: '../fonts/GhostByte-Regular.woff',
  variable: '--font-ghost-byte',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Color Shift",
  description: "Two colors. Background and foreground. See the contrast. Feel the combination.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${alphaLyrae.variable} ${departureMono.variable} ${instrumentSerif.variable} ${ghostByte.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={getGoogleFontsUrl()} />
      </head>
      <body>{children}</body>
    </html>
  );
}
