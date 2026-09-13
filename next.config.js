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
      // YouTube video thumbnails
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
