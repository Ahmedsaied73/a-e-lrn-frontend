/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ESLint: enforce linting on every build — no silent bypasses.
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    // Next.js image optimisation re-enabled.
    // Add any external hostname the backend serves images from below.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3005',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
