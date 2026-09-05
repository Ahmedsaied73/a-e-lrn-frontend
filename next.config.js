/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ESLint: enforce linting on every build — no silent bypasses.
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    // Next.js image optimisation re-enabled.
    //
    // IMPORTANT: list every real external hostname explicitly here.
    // `hostname: '**'` (removed) told Next's image optimizer to fetch and
    // re-serve an image from ANY https URL on request — effectively an
    // open image proxy that can be abused for SSRF-style requests and to
    // burn your bandwidth/CDN quota on someone else's images. Add each
    // hostname you actually serve images from (your API/CDN, S3 bucket,
    // etc.) as its own entry below.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3005',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3005',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      // Bunny Stream CDN — thumbnails served from vz-*.b-cdn.net subdomains
      {
        protocol: 'https',
        hostname: '**.b-cdn.net',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
