import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent stale HTML cache after deploys
  headers: async () => [
    {
      source: '/gestion/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imblasco.cl',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'promoimport.cl',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
