/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Security: Remove X-Powered-By header

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['openai'],
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

  // Exclude server-side only modules from client bundle
  webpack: (config, { isServer }) => {
    // Externalize openai and isomorphic-dompurify from both server and client bundles
    config.externals = config.externals || [];
    config.externals.push({
      'openai': 'commonjs openai',
      'isomorphic-dompurify': 'commonjs isomorphic-dompurify',
      'dompurify': 'commonjs dompurify',
    });
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  // Force all API routes to be dynamic (no static generation)
  async rewrites() {
    return [];
  },
};

export default bundleAnalyzer(nextConfig);