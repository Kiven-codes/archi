/**
 * controllers/messagesController.js
 *
 * Handles contact form submissions.
 * Validates the incoming payload before passing it to messagesService.
 *
 * Validation rules mirror the DB CHECK constraints so the API surface
 * returns friendly errors before a DB round-trip even happens.
 */

import isEmail from 'validator/lib/isEmail.js';
import { createMessage } from '../services/messagesService.js';

// ── Validation helpers ─────────────────────────────────────

/**
 * Validates a contact form payload.
 * Returns an array of error strings (empty means valid).
 *
 * @param {{ name, email, subject, message }} body
 * @returns {string[]}
 */
function validateContactPayload(body) {
  const errors = [];
  const { name, email, subject, message } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    errors.push('Name is required.');
  } else if (name.trim().length > 120) {
    errors.push('Name must be 120 characters or fewer.');
  }

  if (!email || typeof email !== 'string') {
    errors.push('Email is required.');
  } else if (!isEmail(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length < 1) {
    errors.push('Subject is required.');
  } else if (subject.trim().length > 200) {
    errors.push('Subject must be 200 characters or fewer.');
  }

  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    errors.push('Message must be at least 10 characters.');
  } else if (message.trim().length > 5000) {
    errors.push('Message must be 5,000 characters or fewer.');
  }

  return errors;
}

// ── POST /api/contact ──────────────────────────────────────
/**
 * Accepts a contact form submission.
 * Validates, sanitizes, then persists to Supabase.
 * Returns only a safe confirmation payload to the client.
 */
export async function submitContact(req, res, next) {
  try {
    const { name, email, subject, message } = req.body ?? {};

    // 1. Validate
    const errors = validateContactPayload({ name, email, subject, message });
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    // 2. Persist via service
    const { data, error } = await createMessage({ name, email, subject, message });

    if (error) throw error;

    // 3. Return a safe confirmation — never echo back message body
    return res.status(201).json({
      success: true,
      message: "Thank you! Your message has been received. I'll be in touch soon.",
      data: {
        id:         data.id,
        created_at: data.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}
