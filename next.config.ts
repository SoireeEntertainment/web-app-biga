import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bigapizzeria.it",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
