import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format (more readable for VPS console)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Winston Logger Configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'whatsapp-saas',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Request logs
    new winston.transports.File({
      filename: path.join(logsDir, 'requests.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport for VPS (always enabled in production)
logger.add(new winston.transports.Console({
  format: consoleFormat,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}));

// HTTP Request Logger
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      tenantId: req.user?.tenantId || 'anonymous',
      userId: req.user?.userId || 'anonymous',
      timestamp: new Date().toISOString()
    };

    // Log based on status code
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// Error Logger
export const errorLogger = (error: Error, req?: any, res?: any) => {
  const logData: any = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString()
  };

  if (req) {
    logData.method = req.method;
    logData.url = req.originalUrl || req.url;
    logData.ip = req.ip || req.socket.remoteAddress;
    logData.tenantId = req.user?.tenantId || 'anonymous';
    logData.userId = req.user?.userId || 'anonymous';
  }

  if (res) {
    logData.statusCode = res.statusCode;
  }

  logger.error('Application Error', logData);
};

// Audit Logger for sensitive operations
export const auditLogger = (action: string, details: any, req?: any) => {
  const logData = {
    action,
    details,
    timestamp: new Date().toISOString(),
    ip: req?.ip || 'system',
    tenantId: req?.user?.tenantId || 'system',
    userId: req?.user?.userId || 'system',
    userEmail: req?.user?.email || 'system'
  };

  logger.info('Audit Log', logData);
};

// Webhook Logger
export const webhookLogger = (source: string, event: string, data: any, status: 'success' | 'error') => {
  const logData = {
    source,
    event,
    status,
    data: status === 'error' ? data : undefined, // Only log data on error
    timestamp: new Date().toISOString()
  };

  if (status === 'error') {
    logger.error(`Webhook ${source}`, logData);
  } else {
    logger.info(`Webhook ${source}`, logData);
  }
};

// Database Logger
export const dbLogger = (operation: string, table: string, duration: number, error?: Error) => {
  const logData = {
    operation,
    table,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };

  if (error) {
    logger.error('Database Operation', { ...logData, error: error.message });
  } else if (duration > 1000) {
    logger.warn('Slow Database Operation', logData);
  } else {
    logger.debug('Database Operation', logData);
  }
};

// Rate Limit Logger
export const rateLimitLogger = (key: string, limit: number, windowMs: number) => {
  logger.warn('Rate Limit Hit', {
    key,
    limit,
    windowMs,
    timestamp: new Date().toISOString()
  });
};

// Socket Logger
export const socketLogger = (event: string, socketId: string, data?: any) => {
  const logData = {
    event,
    socketId,
    data,
    timestamp: new Date().toISOString()
  };

  logger.info('Socket Event', logData);
};

// Performance Logger
export const performanceLogger = (operation: string, duration: number, metadata?: any) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    ...metadata,
    timestamp: new Date().toISOString()
  };

  if (duration > 5000) {
    logger.error('Slow Operation', logData);
  } else if (duration > 1000) {
    logger.warn('Slow Operation', logData);
  } else {
    logger.debug('Performance', logData);
  }
};

export default logger;
export { logger };
