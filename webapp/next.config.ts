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
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
