import { createClient } from '@supabase/supabase-js'

// Intermediario entre el navegador y el RPC de Supabase. Existe por una
// sola razón: la IP real del visitante y su geolocalización aproximada solo
// se pueden confiar del lado del servidor (Vercel las agrega como headers
// en cada request que llega a una función, gratis, sin servicio externo) —
// nunca hay que confiar en algo que mande el propio navegador para esto.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
)

const ERRORES_CONOCIDOS = ['respuesta_duplicada', 'encuesta_no_disponible']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  const { subdominio, respuestas, token_navegador, fingerprint } = req.body || {}

  if (!subdominio || !token_navegador) {
    res.status(400).json({ ok: false, error: 'faltan_datos' })
    return
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null
  const pais = req.headers['x-vercel-ip-country'] || null
  const ciudad = req.headers['x-vercel-ip-city']
    ? decodeURIComponent(req.headers['x-vercel-ip-city'])
    : null
  const latitud_ip = req.headers['x-vercel-ip-latitude']
    ? Number(req.headers['x-vercel-ip-latitude'])
    : null
  const longitud_ip = req.headers['x-vercel-ip-longitude']
    ? Number(req.headers['x-vercel-ip-longitude'])
    : null

  const { data, error } = await supabase.rpc('guardar_respuesta_online', {
    p_subdominio: subdominio,
    p_respuestas: respuestas || [],
    p_token_navegador: token_navegador,
    p_fingerprint: fingerprint || null,
    p_ip: ip,
    p_pais: pais,
    p_ciudad: ciudad,
    p_latitud_ip: latitud_ip,
    p_longitud_ip: longitud_ip,
  })

  if (error) {
    const conocido = ERRORES_CONOCIDOS.find(e => error.message?.includes(e))
    res.status(conocido ? 409 : 500).json({ ok: false, error: conocido || 'error_desconocido' })
    return
  }

  res.status(200).json({ ok: true, sesion_id: data })
}
