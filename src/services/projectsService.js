/**
 * services/projectsService.js
 *
 * Encapsulates all Supabase query logic for the `projects` table.
 * Controllers call these functions — they never touch Supabase directly.
 *
 * Uses the PUBLIC anon client (supabase) because projects are publicly readable
 * and the RLS policy "projects_public_read" already grants SELECT to anon.
 */

import { supabase } from '../config/supabaseClient.js';

// Columns to return on list queries (omit heavy fields if needed)
const PROJECT_COLUMNS = `
  id,
  title,
  slug,
  category,
  description,
  tools_used,
  thumbnail_url,
  video_url,
  is_featured,
  sort_order,
  created_at
`;

/**
 * Fetch all projects, ordered by sort_order then created_at descending.
 * Optionally filter by category.
 *
 * @param {{ category?: string }} options
 * @returns {Promise<{ data: object[] | null, error: object | null }>}
 */
export async function getAllProjects({ category } = {}) {
  // Start a Supabase query builder chain
  let query = supabase
    .from('projects')            // target table
    .select(PROJECT_COLUMNS)     // explicit column list (avoids over-fetching)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  // Conditionally append a filter — Supabase chains are lazy until awaited
  if (category) {
    query = query.ilike('category', category); // case-insensitive match
  }

  const { data, error } = await query;
  return { data, error };
}

/**
 * Fetch a single project by its URL slug.
 * Returns a single object (not an array) via .single().
 *
 * @param {string} slug
 * @returns {Promise<{ data: object | null, error: object | null }>}
 */
export async function getProjectBySlug(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    // Use .eq() for an exact match on the citext slug column.
    // citext makes the comparison case-insensitive automatically in PostgreSQL.
    .eq('slug', slug)
    // .single() tells Supabase to expect exactly one row.
    // If 0 rows → error.code 'PGRST116' (not found).
    // If >1 rows → error.code 'PGRST116' (ambiguous) — prevented by UNIQUE constraint.
    .single();

  return { data, error };
}

/**
 * Fetch only featured projects (is_featured = TRUE), useful for hero sections.
 *
 * @returns {Promise<{ data: object[] | null, error: object | null }>}
 */
export async function getFeaturedProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    // PostgREST filter — translates to WHERE is_featured = TRUE
    .eq('is_featured', true)
    .order('sort_order', { ascending: true });

  return { data, error };
}
