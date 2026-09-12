// Temas visuales curados — el superadmin elige uno por encuesta en el
// constructor (mismo set que TEMAS_VISUALES en EncuestaBuilderOnline.jsx,
// misma insignia). Solo un ícono chico + una etiqueta corta: nada de
// ilustración grande, a pedido.
export const TEMAS = {
  ciudad:        { emoji: '🏙️', label: 'Estudio urbano' },
  gente:         { emoji: '👥', label: 'Estudio de comunidad' },
  institucional: { emoji: '🏛️', label: 'Estudio de opinión' },
}

export function resolverTema(temaVisual) {
  return TEMAS[temaVisual] || TEMAS.ciudad
}
