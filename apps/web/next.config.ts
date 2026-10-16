import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@triveni/shared-types', '@triveni/shared-validation'],
};

export default nextConfig;
