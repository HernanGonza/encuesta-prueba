import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisá el .env.')
}

// Sin auth: esta app nunca loguea a nadie, solo llama a los dos RPC públicos
// (obtener_encuesta_publica / vía /api/responder) habilitados para el rol anon.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})
