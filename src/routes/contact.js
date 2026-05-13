/**
 * routes/contact.js
 *
 * Mounts contact-form routes under /api/contact (set in index.js).
 */

import { Router } from 'express';
import { submitContact } from '../controllers/messagesController.js';

const router = Router();

// POST /api/contact  → submit contact form
router.post('/', submitContact);

export default router;
