import { createClient } from '@supabase/supabase-js'

// Reemplaza a api/render.js — ese enfoque (vercel.json "rewrites" de "/" a
// una función normal) NO funcionaba: comprobado con curl contra
// hernan.metr1ka.com y roma.metr1ka.com, las dos devolvían el index.html
// ESTÁTICO sin pasar por la función. En Vercel, un archivo estático que
// matchea la ruta (index.html en "/") gana contra un rewrite declarado en
// vercel.json — el rewrite nunca llegaba a ejecutarse.
//
// El Edge Middleware es distinto: corre ANTES de que Vercel resuelva la
// ruta contra archivos estáticos, así que sí puede interceptar "/" de
// verdad. Mismo objetivo que antes: los bots que arman la vista previa al
// compartir un link (WhatsApp, Facebook, Telegram) no ejecutan JavaScript,
// así que el <title>/og:title/og:description/og:image por encuesta tienen
// que venir ya resueltos en el HTML que se les devuelve.

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
)

const TITULO_GENERICO      = 'Tu ciudad, tu mirada — Metr1ka'
const DESCRIPCION_GENERICA = 'Contanos qué pensás de tu ciudad. Encuestas online de Metr1ka: anónimas, rápidas y pensadas para tu comunidad.'

export const config = {
  matcher: '/',
}

function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolverSubdominio(url, host) {
  const forzado = url.searchParams.get('subdominio')
  if (forzado) return forzado

  const base = '.metr1ka.com'
  if (host.endsWith(base)) {
    const sub = host.slice(0, -base.length)
    if (sub && sub !== 'www') return sub
  }
  return null
}

export default async function middleware(request) {
  const url  = new URL(request.url)
  const host = request.headers.get('host') || url.host

  let html
  try {
    // "/index.html" no matchea el config.matcher (solo "/"), así que esto
    // no re-entra al middleware — cae directo al archivo estático.
    html = await fetch(new URL('/index.html', url)).then(r => r.text())
  } catch (e) {
    console.error('[middleware] no se pudo leer index.html', e)
    return undefined // deja que Vercel sirva lo que pueda por su cuenta
  }

  const imagenAbsoluta = `https://${host}/og-image.png`
  const urlAbsoluta     = `https://${host}/`

  const subdominio = resolverSubdominio(url, host)
  let titulo      = TITULO_GENERICO
  let descripcion = DESCRIPCION_GENERICA

  if (subdominio) {
    try {
      const { data } = await supabase.rpc('obtener_encuesta_publica', { p_subdominio: subdominio })
      const encuesta = data && !data.error ? data.encuesta : null
      if (encuesta) {
        const tituloBase = encuesta.titulo_publico || encuesta.nombre
        if (tituloBase) titulo = `${escaparHTML(tituloBase)} — Metr1ka`
        descripcion = escaparHTML(encuesta.subtitulo_publico || encuesta.descripcion || DESCRIPCION_GENERICA)
      }
    } catch (e) {
      console.error('[middleware] obtener_encuesta_publica falló', e)
      // sigue con los valores genéricos — la encuesta tiene que poder
      // abrirse igual aunque esto falle
    }
  }

  const out = html
    .replace(/<title>.*?<\/title>/, `<title>${titulo}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${descripcion}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${urlAbsoluta}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${titulo}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${descripcion}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${imagenAbsoluta}$2`)
    .replace(/(<meta property="og:image:secure_url" content=")[^"]*(")/, `$1${imagenAbsoluta}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${titulo}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${descripcion}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${imagenAbsoluta}$2`)

  return new Response(out, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Cache corto en el borde: si el admin edita el título, no queda un
      // link viejo circulando mucho tiempo, pero tampoco pega a Supabase
      // en cada apertura del link.
      'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
