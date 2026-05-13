/**
 * middleware/errorHandler.js
 *
 * Centralised Express error-handling middleware.
 * Receives errors forwarded via next(err) from controllers.
 *
 * Must be the LAST middleware registered in index.js (Express identifies
 * error-handling middleware by its four-argument signature).
 */

/**
 * Maps known Supabase / PostgREST error codes to HTTP status codes.
 *
 * @param {string | undefined} code  — error.code from Supabase
 * @returns {number}
 */
function supabaseCodeToStatus(code) {
  const map = {
    PGRST116: 404, // no rows found for .single()
    '23505':  409, // unique_violation (e.g. duplicate slug)
    '23503':  422, // foreign_key_violation
    '23514':  422, // check_violation (constraint failed)
    '42501':  403, // insufficient_privilege (RLS blocked the query)
  };
  return map[code] ?? 500;
}

/**
 * Global error handler.
 *
 * @param {Error & { code?: string, statusCode?: number }} err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next  — required even if unused
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Determine HTTP status
  const status =
    err.statusCode ??
    (err.code ? supabaseCodeToStatus(err.code) : 500);

  // Never leak internal details in production
  const isDev = process.env.NODE_ENV !== 'production';

  const payload = {
    success: false,
    message: status < 500
      ? err.message                  // safe to surface client errors
      : 'An unexpected server error occurred. Please try again later.',
    ...(isDev && status >= 500 && {
      debug: {
        message: err.message,
        code:    err.code,
        stack:   err.stack,
      },
    }),
  };

  // Always log server errors regardless of environment
  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json(payload);
}

/**
 * 404 catcher — placed before errorHandler in index.js.
 * Catches any request that didn't match a registered route.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}
