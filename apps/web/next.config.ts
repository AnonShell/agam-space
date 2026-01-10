import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: ['@agam-space/client', 'agam-space/core', 'agam-space/shared-types'],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
