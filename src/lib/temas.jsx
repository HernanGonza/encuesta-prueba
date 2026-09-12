import City from '../components/City'
import Gente from '../components/Gente'
import Institucional from '../components/Institucional'

// Temas visuales curados — el superadmin elige uno por encuesta en el
// constructor. No generamos arte distinto por tema de la encuesta en sí
// (sería mucho esfuerzo para poco beneficio real); esto solo separa el
// panel ilustrado en 3 variantes con las que cubrir la mayoría de los casos.
export const TEMAS = {
  ciudad: {
    Ilustracion: City,
    eyebrow: 'ESCUCHAR PARA ENTENDER',
    edition: 'ESTUDIO DE OPINIÓN',
    tituloAside: <>Las ciudades<br/>cambian.<br/><span>Con tu voz.</span></>,
    bajadaAside: 'Las mejores decisiones empiezan por escuchar a quienes viven ahí.',
  },
  gente: {
    Ilustracion: Gente,
    eyebrow: 'ESCUCHAR A LA COMUNIDAD',
    edition: 'ESTUDIO DE OPINIÓN',
    tituloAside: <>Las comunidades<br/>crecen.<br/><span>Con tu voz.</span></>,
    bajadaAside: 'Cada opinión ayuda a construir mejores decisiones colectivas.',
  },
  institucional: {
    Ilustracion: Institucional,
    eyebrow: 'MEDIR PARA MEJORAR',
    edition: 'ESTUDIO DE OPINIÓN',
    tituloAside: <>Los datos<br/>importan.<br/><span>Tu voz también.</span></>,
    bajadaAside: 'Tu respuesta se suma a un proceso de mejora continua.',
  },
}

export function resolverTema(temaVisual) {
  return TEMAS[temaVisual] || TEMAS.ciudad
}
