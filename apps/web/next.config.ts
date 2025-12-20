import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: ['@agam-space/client', 'agam-space/core', 'agam-space/shared-types'],
  eslint: {
    // Disable ESLint during production build - CI already lints
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is done in CI
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
