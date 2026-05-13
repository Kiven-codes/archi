/**
 * services/messagesService.js
 *
 * Encapsulates all Supabase query logic for the `messages` table.
 *
 * Uses the ADMIN client (supabaseAdmin / service_role) because:
 *  - The RLS policy "messages_anon_insert" allows anonymous INSERT, but
 *    using the service_role key gives the backend full control and lets
 *    us read/update messages for an admin panel without extra RLS policies.
 *  - The service_role key MUST stay on the server — never expose it to the browser.
 */

import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Insert a new contact message into the `messages` table.
 *
 * @param {{ name: string, email: string, subject: string, message: string }} payload
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export async function createMessage(payload) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    // Insert the validated payload.
    // .select() after insert returns the newly created row (including server-generated id & created_at).
    .insert([
      {
        name:    payload.name.trim(),
        email:   payload.email.trim().toLowerCase(),
        subject: payload.subject.trim(),
        message: payload.message.trim(),
      },
    ])
    .select('id, name, email, subject, created_at')  // return a safe subset (never expose message body)
    .single();

  return { data, error };
}

/**
 * Fetch all unread messages — intended for an internal admin view.
 * Requires service_role client (RLS: only service_role can SELECT messages).
 *
 * @returns {Promise<{ data: object[] | null, error: object | null }>}
 */
export async function getUnreadMessages() {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('id, name, email, subject, message, created_at')
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  return { data, error };
}
