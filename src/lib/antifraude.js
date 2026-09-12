import FingerprintJS from '@fingerprintjs/fingerprintjs'

const TOKEN_KEY = 'metr1ka:token_navegador'

// Capa 1: cookie/token estable por navegador (localStorage, no expira).
export function obtenerTokenNavegador() {
  let token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(TOKEN_KEY, token)
  }
  return token
}

// Capa 3: fingerprint de navegador (open source, corre en el cliente, sin
// cuenta ni costo — no es la versión Pro paga de FingerprintJS).
let fingerprintCache = null
export async function obtenerFingerprint() {
  if (fingerprintCache) return fingerprintCache
  try {
    const fp = await FingerprintJS.load()
    const resultado = await fp.get()
    fingerprintCache = resultado.visitorId
  } catch {
    fingerprintCache = null
  }
  return fingerprintCache
}

// Guarda localmente que ya se respondió esta encuesta, para no ni mostrar
// el formulario de nuevo en este navegador (la validación real y definitiva
// pasa igual por el servidor — esto es solo para no hacerle perder el
// tiempo a alguien que ya sabemos que va a rebotar).
const respondidaKey = (subdominio) => `metr1ka:respondida:${subdominio}`

export function yaRespondio(subdominio) {
  return localStorage.getItem(respondidaKey(subdominio)) === '1'
}

export function marcarRespondida(subdominio) {
  localStorage.setItem(respondidaKey(subdominio), '1')
}
