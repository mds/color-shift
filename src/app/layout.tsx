import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

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
      className={`${geistSans.variable} ${geistMono.variable} ${alphaLyrae.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
