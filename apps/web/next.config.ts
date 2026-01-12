import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  transpilePackages: ['@agam-space/client', 'agam-space/core', 'agam-space/shared-types'],
  typescript: {
    ignoreBuildErrors: false,
  },
  generateBuildId: async () => {
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID;

    if (buildId) {
      console.log(`📦 Using NEXT_PUBLIC_BUILD_ID as Next.js buildId: ${buildId}`);
      return buildId;
    }

    return undefined as any;
  },
};

export default nextConfig;
