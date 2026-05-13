/**
 * controllers/projectsController.js
 *
 * Handles HTTP request / response logic for project-related routes.
 * Delegates all data-fetching to projectsService.
 *
 * Convention:
 *   - Controller validates route params / query strings.
 *   - Service owns Supabase queries.
 *   - Errors are forwarded to the global error handler via next(err).
 */

import {
  getAllProjects,
  getProjectBySlug,
  getFeaturedProjects,
} from '../services/projectsService.js';

// ── GET /api/projects ──────────────────────────────────────
/**
 * Returns all projects.
 * Supports optional query param: ?category=Residential&featured=true
 */
export async function listProjects(req, res, next) {
  try {
    const { category, featured } = req.query;

    // If ?featured=true is passed, return only featured projects
    if (featured === 'true') {
      const { data, error } = await getFeaturedProjects();
      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    }

    const { data, error } = await getAllProjects({ category });
    if (error) throw error;

    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err); // forward to errorHandler middleware
  }
}

// ── GET /api/projects/:slug ────────────────────────────────
/**
 * Returns a single project matched by its slug.
 * Responds 404 when Supabase returns no row (PGRST116).
 */
export async function getProject(req, res, next) {
  try {
    const { slug } = req.params;

    // Basic slug format validation before hitting the DB
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slug format.',
      });
    }

    const { data, error } = await getProjectBySlug(slug);

    // Supabase returns error code PGRST116 when .single() finds no row
    if (error?.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        message: `Project "${slug}" not found.`,
      });
    }

    if (error) throw error;

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
