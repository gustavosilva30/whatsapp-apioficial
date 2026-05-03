import rateLimit, { MemoryStore } from 'express-rate-limit';
import { Request, Response } from 'express';

// Using MemoryStore for rate limiting (sufficient for single-instance)
// For production with multiple instances, use a Redis-backed store

// Generate key based on IP and tenant (if authenticated)
// Using req.ip and x-forwarded-for for more robust proxy support (Vercel)
const ipKeyGenerator = (req: Request): string => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
  const tenantId = (req as any).user?.tenantId || 'anonymous';
  return `${ip}:${tenantId}`;
};

// General API Rate Limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false }, // Disable IPv6 validation for local dev
  keyGenerator: ipKeyGenerator,
  store: new MemoryStore(),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks and webhooks
    return req.path === '/api/health' || req.path.startsWith('/webhook');
  }
});

// Strict Rate Limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false }, // Disable IPv6 validation for local dev
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
    const email = req.body?.email || 'unknown';
    return `${ip}:${email}`;
  },
  store: new MemoryStore(),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many login attempts, please try again after 15 minutes.',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

// API Key Rate Limiter for external gateway
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per API key
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const apiKey = req.headers['x-api-key'] as string || 'unknown';
    return apiKey;
  },
  store: new MemoryStore(),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'API rate limit exceeded, please try again later.',
      retryAfter: 60
    });
  }
});

// Webhook Rate Limiter (higher limit for Meta webhooks)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false }, // Disable IPv6 validation for local dev
  keyGenerator: (req: Request) => {
    // Rate limit by phoneNumberId from payload
    const phoneNumberId = req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
    return phoneNumberId || ip;
  },
  store: new MemoryStore(),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Webhook rate limit exceeded.'
    });
  }
});

// Tenant-specific rate limiter for resource-heavy operations
export const tenantLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per tenant
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const tenantId = (req as any).user?.tenantId || 'anonymous';
    return tenantId;
  },
  store: new MemoryStore(),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Tenant rate limit exceeded, please try again later.',
      retryAfter: 60
    });
  }
});

export default {
  generalLimiter,
  authLimiter,
  apiKeyLimiter,
  webhookLimiter,
  tenantLimiter
};
