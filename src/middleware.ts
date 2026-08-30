import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for security headers and CORS
 * Simplified for open-source local-first tool
 */

// Allowed origins for CORS (configure via environment variables)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
];

// Security headers configuration
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': process.env.NODE_ENV === 'production'
    ? 'max-age=31536000; includeSubDomains; preload'
    : '',
  // CSP without unsafe-eval, allowing external APIs via connect-src
  'Content-Security-Policy': process.env.NODE_ENV === 'production'
    ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.x.ai https://api.openai.com https://api.anthropic.com https://*.supabase.co https://*.sentry.io https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';",
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');

  // Set security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });

  // CORS handling for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-ai-baseurl, x-ai-apikey, x-ai-model');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        return new NextResponse(null, { status: 204, headers: response.headers });
      }
      return new NextResponse(null, { status: 403 });
    }

    // Handle actual requests
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    } else if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      // Block unauthorized origins
      return NextResponse.json(
        { error: 'Forbidden: Origin not allowed' },
        { status: 403, headers: response.headers }
      );
    }
  }

  // Request size validation (prevent DoS)
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    // Limit request size to 1MB for API routes
    if (request.nextUrl.pathname.startsWith('/api/') && size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'Request too large. Maximum size: 1MB' },
        { status: 413, headers: response.headers }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};