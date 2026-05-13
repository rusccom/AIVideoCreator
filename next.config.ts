import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@dnd-kit/core"]
  },
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
