import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@template/api-client", "@template/public-ui"],
  typescript: { ignoreBuildErrors: false },
};
export default nextConfig;
