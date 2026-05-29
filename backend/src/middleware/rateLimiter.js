// middleware/rateLimiter.js
import log from '../utils/console.js';

/**
 * Creates an in-memory rate limiting middleware.
 * @param {object} options 
 * @returns {Function} Express middleware function
 */
export function rateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // Default: 15 minutes
  const max = options.max || 100;                     // Default: 100 requests per window
  const message = options.message || "Too many requests, please try again later.";
  
  const ipMap = new Map();

  // Periodic cleanup to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipMap.entries()) {
      if (now > record.resetTime) {
        ipMap.delete(ip);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipMap.has(ip)) {
      ipMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = ipMap.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;
    if (record.count > max) {
      log(`Rate limit exceeded for IP: ${ip} on path ${req.path}`, 'warn');
      return res.status(429).json({ error: message });
    }

    next();
  };
}
