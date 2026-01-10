import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    api: 'ok' | 'error';
    environment: 'ok' | 'error';
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  version: string;
  uptime: number;
}

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 * Returns 200 if healthy, 503 if unhealthy
 */
export async function GET(_req: NextRequest): Promise<NextResponse<HealthCheckResponse | ApiResponse>> {
  const startTime = process.uptime();
  const checks: HealthCheckResponse['checks'] = {
    api: 'ok',
    environment: 'ok',
  };

  try {
    // Check environment variables
    const requiredEnvVars = ['XAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingEnvVars.length > 0) {
      checks.environment = 'error';
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            ...checks,
            environment: 'error',
          },
          version: process.env.npm_package_version || 'unknown',
          uptime: Math.floor(process.uptime() - startTime),
        },
        { status: 503 }
      );
    }

    // Check memory usage (optional, only if available)
    if (process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      const memoryTotal = memoryUsage.heapTotal + memoryUsage.external;
      const memoryUsed = memoryUsage.heapUsed;
      const memoryPercentage = (memoryUsed / memoryTotal) * 100;

      checks.memory = {
        used: Math.round(memoryUsed / 1024 / 1024), // MB
        total: Math.round(memoryTotal / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage * 100) / 100,
      };

      // Warn if memory usage is high (>90%)
      if (memoryPercentage > 90) {
        return NextResponse.json(
          {
            status: 'degraded',
            timestamp: new Date().toISOString(),
            checks,
            version: process.env.npm_package_version || 'unknown',
            uptime: Math.floor(process.uptime() - startTime),
          },
          { status: 200 }
        );
      }
    }

    // All checks passed
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks,
        version: process.env.npm_package_version || 'unknown',
        uptime: Math.floor(process.uptime() - startTime),
      },
      { status: 200 }
    );
  } catch (error) {
    // Health check itself failed
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Health check failed',
          retryable: true,
        },
      },
      { status: 503 }
    );
  }
}
