import { useState, useEffect } from 'react'

// Mismo mecanismo que useTheme.js en el panel de Metr1ka: el modo ya viene
// aplicado en <html data-theme> por el script inline de index.html; este
// hook solo lo lee y ofrece un toggle que persiste la elección explícita.
// Se llama "modo color" (no "tema") porque acá "tema" ya nombra el tema
// visual de la encuesta (ciudad/gente/institucional, ver lib/temas.js).
function leerModo() {
  return document.documentElement.getAttribute('data-theme')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export function useModoColor() {
  const [modo, setModo] = useState(leerModo)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const actual = document.documentElement.getAttribute('data-theme')
      if (actual && actual !== modo) setModo(actual)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [modo])

  const toggle = () => {
    const next = modo === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('metr1ka-theme', next) } catch { /* modo privado */ }
    setModo(next)
  }

  return { modo, toggle, esOscuro: modo === 'dark' }
}
