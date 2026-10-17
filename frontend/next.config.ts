import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep verification builds separate from an already running dev server.
  distDir: process.env.SPOTT_BUILD_DIR ?? ".next",
};

export default nextConfig;
