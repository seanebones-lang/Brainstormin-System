/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer';
import withPWA from 'next-pwa';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Cache strategies
  runtimeCaching: [
    {
      // Cache API routes
      urlPattern: /^\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      // Cache static assets
      urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|woff2?)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      // Cache fonts
      urlPattern: /\.(?:woff|woff2)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
  ],
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

// Apply PWA wrapper first, then bundle analyzer
export default bundleAnalyzer(withPWAConfig(nextConfig));