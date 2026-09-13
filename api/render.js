import { createClient } from '@supabase/supabase-js'

// La página es un SPA de un solo index.html servido igual en todos los
// subdominios (roma.metr1ka.com, hernan.metr1ka.com, ...) — así que el
// <title>/og:title/og:description que trae ese archivo son siempre los
// mismos, genéricos, sin importar qué encuesta se esté compartiendo. Los
// bots que arman la vista previa al compartir un link (WhatsApp, Telegram,
// etc.) NO ejecutan JavaScript, así que no alcanza con corregir esto del
// lado del cliente — hace falta devolver el HTML ya con el título/
// descripción de ESA encuesta en particular.
//
// Este endpoint reemplaza al index.html estático para la ruta "/" (ver
// rewrite en vercel.json): lee el index.html ya buildeado (con los
// scripts/assets hasheados de Vite, intacto) desde el propio deploy,
// resuelve el subdominio actual contra `obtener_encuesta_publica` (mismo
// RPC público que usa el front) y pisa título/descripción con
// titulo_publico/subtitulo_publico de esa encuesta — si no hay match
// (subdominio libre, encuesta cerrada, etc.) se devuelve el HTML tal cual,
// con los valores genéricos que ya tenía.

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
)

const TITULO_GENERICO      = 'Tu ciudad, tu mirada — Metr1ka'
const DESCRIPCION_GENERICA = 'Contanos qué pensás de tu ciudad. Encuestas online de Metr1ka: anónimas, rápidas y pensadas para tu comunidad.'

function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolverSubdominio(req) {
  const forzado = new URL(req.url, `https://${req.headers.host}`).searchParams.get('subdominio')
  if (forzado) return forzado

  const host = (req.headers.host || '').split(':')[0]
  const base = '.metr1ka.com'
  if (host.endsWith(base)) {
    const sub = host.slice(0, -base.length)
    if (sub && sub !== 'www') return sub
  }
  return null
}

export default async function handler(req, res) {
  try {
    const html = await fetch(`https://${req.headers.host}/index.html`).then(r => r.text())

    // og:image/twitter:image/og:url van absolutas, con el host real de
    // este request, sin importar si hay o no encuesta para ese subdominio
    // — más estricto que dejarlas relativas/genéricas (algunos crawlers no
    // resuelven bien una ruta relativa) y Facebook pide og:url obligatoria.
    const imagenAbsoluta = `https://${req.headers.host}/og-image.png`
    const urlAbsoluta    = `https://${req.headers.host}/`

    const subdominio = resolverSubdominio(req)
    if (!subdominio) {
      const out = html
        .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${urlAbsoluta}$2`)
        .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${imagenAbsoluta}$2`)
        .replace(/(<meta property="og:image:secure_url" content=")[^"]*(")/, `$1${imagenAbsoluta}$2`)
        .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${imagenAbsoluta}$2`)
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.status(200).send(out)
      return
    }

    const { data } = await supabase.rpc('obtener_encuesta_publica', { p_subdominio: subdominio })
    const encuesta = data && !data.error ? data.encuesta : null

    const tituloBase = encuesta?.titulo_publico || encuesta?.nombre
    const titulo      = tituloBase ? `${escaparHTML(tituloBase)} — Metr1ka` : TITULO_GENERICO
    const descripcion = encuesta
      ? escaparHTML(encuesta.subtitulo_publico || encuesta.descripcion || DESCRIPCION_GENERICA)
      : DESCRIPCION_GENERICA

    const out = html
      .replace(/<title>.*?<\/title>/, `<title>${titulo}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${descripcion}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${urlAbsoluta}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${titulo}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${descripcion}$2`)
      .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${imagenAbsoluta}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${titulo}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${descripcion}$2`)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${imagenAbsoluta}$2`)

    // Cache corto en el borde: si el admin edita el título, no queda un
    // link viejo circulando en caché mucho tiempo, pero tampoco se pega a
    // Supabase en cada apertura del link.
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')
    res.status(200).send(out)
  } catch (e) {
    console.error('[api/render]', e)
    // Ante cualquier falla, la encuesta tiene que seguir andando — se
    // devuelve el index.html tal cual, sin título dinámico, no un error.
    try {
      const html = await fetch(`https://${req.headers.host}/index.html`).then(r => r.text())
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.status(200).send(html)
    } catch {
      res.status(500).send('Error')
    }
  }
}
