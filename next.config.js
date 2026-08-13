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


      // YouTube thumbnails
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },

      // Example — replace with your real production API/CDN host(s):
      // {
      //   protocol: 'https',
      //   hostname: 'api.yourdomain.com',
      //   pathname: '/**',
      // },
    ],
  },
};

module.exports = nextConfig;
