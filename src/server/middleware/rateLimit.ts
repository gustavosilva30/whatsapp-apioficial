import rateLimit, { MemoryStore } from 'express-rate-limit';
import { Request, Response } from 'express';

// Gets the client IP without triggering express-rate-limit IPv6 validation warning
const getIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip.trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};

// General API Rate Limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const tenantId = (req as any).user?.tenantId || 'anonymous';
    return `${getIp(req)}:${tenantId}`;
  },
  store: new MemoryStore(),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    });
  },
  skip: (req: Request) => req.path === '/api/health' || req.path.startsWith('/webhook'),
});

// Strict Rate Limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    return `${getIp(req)}:${email}`;
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
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req.headers['x-api-key'] as string) || 'unknown';
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
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const phoneNumberId = req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    return phoneNumberId || getIp(req);
  },
  store: new MemoryStore(),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Webhook rate limit exceeded.'
    });
  }
});

// Tenant-specific rate limiter
export const tenantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as any).user?.tenantId || 'anonymous';
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
