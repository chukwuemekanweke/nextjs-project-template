import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@template/api-client",
    "@template/dashboard-ui",
    "@template/forms",
    "@template/ui-core",
  ],
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
