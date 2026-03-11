import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/files/:path*',
        destination: 'https://jordi-api.streamingpro.es/api/files/:path*',
      },
    ];
  },
};

export default nextConfig;
