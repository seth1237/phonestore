import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tappi-images.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "backend.codewithseth.co.ke",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
