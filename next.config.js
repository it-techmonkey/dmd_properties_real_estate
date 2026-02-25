/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Alnair property images & logos
        protocol: 'https',
        hostname: 'files.alnair.ae',
      },
      {
        // Alnair API media
        protocol: 'https',
        hostname: 'api.alnair.ae',
      },
    ],
    // Faster loading: allow large images from CDN
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24h CDN cache for optimized images
  },
};

module.exports = nextConfig;
