import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: ["127.0.0.1", "localhost"],
  }),
};

export default nextConfig;
