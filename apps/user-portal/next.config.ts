import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@template/dashboard-ui", "@template/ui-core"],
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
