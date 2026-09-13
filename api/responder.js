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

// Los headers x-vercel-ip-* alcanzan para país casi siempre, pero para
// ciudad/lat/lng dependen de la base MaxMind de Vercel, que para IPs
// móviles/NAT de operadoras argentinas suele no tener precisión de ciudad
// — el header directamente no llega, no es que llegue vacío. Sin eso el
// mapa de la encuesta queda sin punto para esa respuesta ("sin ubicación").
// Fallback: si faltan lat/lng, se completan con un servicio de geo-IP
// dedicado (mejor cobertura que MaxMind para este caso). No bloquea el
// guardado de la respuesta si falla o tarda — es un dato lindo de tener,
// no algo de lo que dependa poder responder la encuesta.
const IP_PRIVADA = /^(127\.|10\.|192\.168\.|::1$|f[cd])/i

async function geolocalizarFallback(ip) {
  if (!ip || IP_PRIVADA.test(ip)) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    const r = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!r.ok) return null
    const j = await r.json()
    if (j.error || j.latitude == null || j.longitude == null) return null
    return {
      pais: j.country_name || null,
      ciudad: j.city || null,
      latitud_ip: Number(j.latitude),
      longitud_ip: Number(j.longitude),
    }
  } catch {
    return null
  }
}

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
  let pais = req.headers['x-vercel-ip-country'] || null
  let ciudad = req.headers['x-vercel-ip-city']
    ? decodeURIComponent(req.headers['x-vercel-ip-city'])
    : null
  let latitud_ip = req.headers['x-vercel-ip-latitude']
    ? Number(req.headers['x-vercel-ip-latitude'])
    : null
  let longitud_ip = req.headers['x-vercel-ip-longitude']
    ? Number(req.headers['x-vercel-ip-longitude'])
    : null

  if (latitud_ip == null || longitud_ip == null) {
    const fallback = await geolocalizarFallback(ip)
    if (fallback) {
      pais = pais || fallback.pais
      ciudad = ciudad || fallback.ciudad
      latitud_ip = fallback.latitud_ip
      longitud_ip = fallback.longitud_ip
    }
  }

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
