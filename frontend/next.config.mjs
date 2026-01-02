/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
  // Environment variables available only on the server
  serverRuntimeConfig: {
    apiBaseUrl: process.env.INTERNAL_API_BASE_URL,
  },
};

export default nextConfig;

