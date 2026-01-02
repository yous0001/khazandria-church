/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "*.vercel.app",
      },
    ],
  },
  // Environment variables available only on the server
  serverRuntimeConfig: {
    apiBaseUrl: process.env.INTERNAL_API_BASE_URL,
  },
};

export default nextConfig;

