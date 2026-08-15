import { supabase } from '../lib/supabaseClient.js'

const STORAGE_KEY = 'foodtrack_reviews'

// crypto.randomUUID() requires HTTPS and is unavailable in Safari on HTTP dev
// servers. crypto.getRandomValues() works on HTTP across all browsers.
function generateId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // UUID version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // RFC 4122 variant
  return [...bytes]
    .map((b, i) => ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0'))
    .join('')
}

// load and save functions were made before supabase was connected
// function load() {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY)
//     return raw ? JSON.parse(raw) : []
//   } catch {
//     return []
//   }
// }

// function save(reviews) {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
// }


export async function getReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}


export async function getReviewById(id) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}


export async function addReview(reviewData) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{ ...reviewData, created_at: new Date().toISOString() }])
    .select()
    .single()
  if (error) throw error
  return data
}


export async function updateReview(id, reviewData) {
  const { data, error } = await supabase
    .from('reviews')
    .update(reviewData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}


export async function deleteReview(id) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)
  if (error) throw error
}
