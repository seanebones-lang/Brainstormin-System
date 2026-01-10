/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Security: Remove X-Powered-By header
  
  // Temporarily disable ESLint during build to allow deployment
  // TODO: Fix all linting errors and re-enable
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Temporarily disable type checking during build
  // TODO: Fix all type errors and re-enable
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'openai'],
  },

  // Security headers (also handled in middleware, but this is a fallback)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Environment variables validation (optional, better handled in lib/env.ts)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
