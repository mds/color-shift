import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/color-shift';

const nextConfig: NextConfig = {
  basePath,
  allowedDevOrigins: ['192.168.86.41'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
