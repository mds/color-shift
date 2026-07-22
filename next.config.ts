import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/color-shift';

const nextConfig: NextConfig = {
  basePath,
  // Pin the workspace root. Stray lockfiles above this directory make
  // Turbopack infer the wrong root, which breaks tailwindcss resolution.
  turbopack: { root: __dirname },
  allowedDevOrigins: ['192.168.86.41'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
