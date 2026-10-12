import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tappi-images.s3.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const origin = process.env.API_ORIGIN || "http://127.0.0.1:3001";
    return [{ source: "/backend/:path*", destination: `${origin}/:path*` }];
  },
};

export default nextConfig;
