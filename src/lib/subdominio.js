// Resuelve qué encuesta mostrar. En producción es el subdominio real
// (campogrande.metr1ka.com -> "campogrande"); en desarrollo local, donde no
// hay subdominio, se puede forzar con ?subdominio=campogrande.
export function resolverSubdominio() {
  const params = new URLSearchParams(window.location.search)
  const forzado = params.get('subdominio')
  if (forzado) return forzado

  const host = window.location.hostname
  const base = '.metr1ka.com'
  if (host.endsWith(base)) {
    const sub = host.slice(0, -base.length)
    if (sub && sub !== 'www') return sub
  }
  return null
}
