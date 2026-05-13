/**
 * src/index.js — Application entry point
 *
 * Bootstraps the Express server with:
 *   - Security headers (Helmet)
 *   - CORS (restricted to allowed origins)
 *   - Rate limiting (configurable per IP)
 *   - JSON body parsing
 *   - Request logging (Morgan)
 *   - Route registration
 *   - Global 404 + error-handling middleware
 */

import 'dotenv/config';              // loads .env before anything else
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import projectsRouter from './routes/projects.js';
import contactRouter from './routes/contact.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// ── Env config ─────────────────────────────────────────────
const PORT            = process.env.PORT ?? 4000;
const NODE_ENV        = process.env.NODE_ENV ?? 'development';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// ── App ────────────────────────────────────────────────────
const app = express();

// ── Security middleware ────────────────────────────────────

// Sets sensible HTTP security headers (Content-Security-Policy, HSTS, etc.)
app.use(helmet());

// CORS — whitelist only the origins defined in .env
app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server requests (no Origin header) and whitelisted origins
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
      }
    },
    methods:     ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  }),
);

// Rate limiter — applied globally to all /api routes
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900_000), // 15 min
  max:      Number(process.env.RATE_LIMIT_MAX ?? 100),
  standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ── General middleware ─────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // body parser with size limit
app.use(express.urlencoded({ extended: false }));

// HTTP request logging — compact in prod, colourful in dev
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', env: NODE_ENV, timestamp: new Date().toISOString() }),
);

// ── API Routes ─────────────────────────────────────────────
app.use('/api/projects', projectsRouter);
app.use('/api/contact',  contactRouter);

// ── 404 + Error handling (always last) ────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   Motion Portfolio API                       ║
║   Running on  http://localhost:${PORT}          ║
║   Environment: ${NODE_ENV.padEnd(30)}║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
