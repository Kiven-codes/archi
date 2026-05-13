/**
 * routes/projects.js
 *
 * Mounts project-related routes under /api/projects (set in index.js).
 */

import { Router } from 'express';
import { listProjects, getProject } from '../controllers/projectsController.js';

const router = Router();

// GET /api/projects          → list all (supports ?category=&featured=)
router.get('/', listProjects);

// GET /api/projects/:slug    → single project by slug
router.get('/:slug', getProject);

export default router;
