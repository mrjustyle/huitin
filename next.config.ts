import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000', '*.ngrok-free.app'],
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.vietqr.io' },
      { protocol: 'https', hostname: 'cdn.vietqr.io' },
      { protocol: 'https', hostname: 'api.vietqr.io' },
      { protocol: 'https', hostname: 'developers.momo.vn' },
      { protocol: 'https', hostname: 'cdn.haitrieu.com' },
      { protocol: 'https', hostname: 'vinadesign.vn' },
    ],
  },
};

export default nextConfig;
