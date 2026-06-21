import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.boconcept.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
