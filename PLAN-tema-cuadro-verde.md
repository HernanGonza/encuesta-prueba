# Plan: 3 temas ilustrados sobre el layout "cuadro verde"

## Contexto

Arrancó como "agregar un tema más" (ver historial de decisiones abajo),
pero el alcance creció: **los temas actuales (`ciudad`/`gente`/
`institucional` en `src/lib/temas.js`, hoy solo un emoji chico) se
retiran**. Los 3 temas nuevos comparten el mismo layout de dos columnas
("cuadro verde": panel verde a la izquierda con ilustración + texto,
encuesta a la derecha — diseño de `encuesta de prueba/`, adaptado a la
disciplina de altura fija sin scroll de página que ya usa `src/App.css`).
Lo que diferencia a cada tema ahora es **la ilustración del panel** y
que **todos los textos del panel son editables por encuesta** desde el
constructor (superadmin) — con textos por defecto si no se editan, para
que una encuesta nueva sin configurar nada se vea bien igual.

También hace falta una **vista previa en el panel de superadmin** para
ver el resultado antes de publicar.

## Decisiones ya tomadas (no volver a preguntar)

1. El panel verde queda **siempre verde fijo** — no depende del toggle
   claro/oscuro de la encuesta.
2. Ya no hay temas "sin panel" — el layout de dos columnas es el único,
   para las 3 encuestas.
3. Se reusan los 3 valores existentes de `tema_visual`
   (`ciudad`/`gente`/`institucional`) para los 3 temas nuevos, en vez de
   inventar nombres nuevos — así las encuestas de prueba que ya tienen
   `tema_visual` seteado (hernan/roma/patricia) no necesitan migración de
   datos, solo cambia cómo se renderiza cada valor.

## Estado actual (contexto técnico, para no reinventar)

- `src/components/City.jsx` ya existe (idéntico al prototipo): SVG plano,
  viewBox `0 0 460 350`, paleta de verdes translúcidos, patrón de
  ventanas repetido, edificios "isométricos" simples, árboles tipo
  paleta, sin dependencias externas. Es la ilustración del tema `ciudad`
  — no hay que tocarla.
- `.stage` en `src/App.css` (línea ~116) ya es `display:flex` con altura
  fija heredada de `.page{height:100dvh}` — el panel se agrega como
  segundo hijo de `.stage`, sin reestructurar el esqueleto de página que
  ya evita el scroll.
- `obtener_encuesta_publica` (RPC pública, Supabase) selecciona columnas
  explícitas de `encuestas` (no `select *`) — cualquier campo nuevo del
  panel tiene que sumarse ahí a mano.
- `EncuestaBuilderOnline.jsx` (Metr1ka, superadmin) hoy tiene
  `TEMAS_VISUALES` con 3 radios simples (emoji + label + descripción) —
  se reemplaza por el selector de ilustración + los inputs de texto.

## Diseño

### 1. Los 3 temas — ilustración + copy por defecto

| `tema_visual` | Ilustración | Idea visual |
|---|---|---|
| `ciudad` | `City.jsx` (ya existe) | skyline, edificios, plazas |
| `gente` | `Gente.jsx` (nueva) | siluetas/comunidad, mismo trazo plano y paleta que City.jsx |
| `institucional` | `Institucional.jsx` (nueva) | edificio público, columnas, mismo estilo |

Las dos ilustraciones nuevas se construyen mañana como componentes SVG
propios (sin librerías/assets externos), calcando el lenguaje visual de
`City.jsx`: mismo viewBox aproximado, mismos verdes translúcidos, mismo
patrón de "ventanas", mismo trazo isométrico simple — para que los 3
temas se sientan de la misma familia.

### 2. Textos del panel — editables, con default por tema

Los 5 textos que hoy están hardcodeados en el prototipo pasan a ser
editables por encuesta, con fallback a un default por tema si no se
editan:

- `eyebrow` — label chico arriba (ej. "ESCUCHAR PARA ENTENDER")
- `edicion` — label chico (ej. "ESTUDIO DE OPINIÓN" — confirmar si se
  saca el "/ 01" que tenía el prototipo, no tiene sentido fuera de una
  serie numerada)
- `titulo_panel` — el título grande (ej. "Las ciudades cambian. Con tu voz.")
- `texto_panel` — el párrafo de apoyo
- `pie_panel` — tagline de abajo (ej. "PERSONAS. DATOS. DECISIONES.")

**Backend**: nueva columna `encuestas.panel_config jsonb` (nullable,
default null), con esas 5 claves como strings opcionales. Mismo patrón
que `preguntas.config_matriz`/`condicionales` (jsonb, no 5 columnas
sueltas). Migración de Supabase + sumar `panel_config` a la lista
explícita de columnas que devuelve `obtener_encuesta_publica`.

**Frontend**: nuevo `encuestas-online/src/lib/panelTemas.js` con los
defaults de copy por tema (los textos actuales del prototipo, tal cual,
para `ciudad`; textos análogos para `gente`/`institucional`, a escribir
mañana) + el mapeo tema → componente de ilustración. `PanelCuadroVerde.jsx`
resuelve cada campo como `encuesta.panel_config?.[campo] || defaults[tema][campo]`.

### 3. Builder (superadmin) — editar tema + textos

En `EncuestaBuilderOnline.jsx`: el selector de tema pasa a elegir
ilustración (mismas 3 opciones, mismos value ya usados). Debajo, un
bloque de 5 inputs/textarea para los textos del panel, con el default de
ese tema como `placeholder` (así se ve qué se está pisando y qué queda
igual si se deja vacío).

### 4. Vista previa en el panel de superadmin

Dos caminos — **a decidir mañana antes de arrancar**, recomendación
marcada:

**(a) iframe + postMessage — recomendado.** `encuestas-online` suma un
modo preview (ej. `?preview=1`): en vez de pedirle la encuesta a
Supabase, escucha `postMessage` del padre con `{tema, panel_config,
titulo_publico, subtitulo_publico}` y renderiza con eso, en vivo. El
builder mete un `<iframe>` apuntando a ese modo y le manda `postMessage`
cada vez que el admin edita algo. Fidelidad total (es literalmente el
mismo código que se despliega) y cero código duplicado. Falta definir
contra qué dominio apunta el iframe (¿un subdominio reservado tipo
`preview.metr1ka.com`, o cualquiera de las encuestas online existentes en
modo preview?) y construir el mecanismo (no existe hoy).

**(b) Mini-render propio dentro del panel.** Un componente chico en
Metr1ka que replica solo la pantalla de bienvenida (panel + encabezado +
título) con los mismos textos/ilustración, sin ser la app real. Más
rápido de construir hoy, pero queda una segunda implementación del mismo
panel visual que puede desalinearse del original con el tiempo si se
edita uno y no el otro.

### 5. Qué se retira

- `src/lib/temas.js` actual (`{emoji,label}` por tema) y `.theme-badge`
  en `App.jsx`/`App.css` — la ilustración grande del panel cumple ahora
  el rol que cumplía el badge chico. A confirmar mañana si se saca del
  todo o se deja como un detalle adicional (mi lectura: se saca, ya es
  redundante).
- El selector de 3 radios simple en `EncuestaBuilderOnline.jsx` (se
  reemplaza por el del punto 3).

## Archivos a tocar

- **Supabase**: migración `encuestas.panel_config jsonb` + actualizar
  `obtener_encuesta_publica` (sumar la columna a la selección explícita).
- `encuestas-online/src/components/Gente.jsx` (nuevo)
- `encuestas-online/src/components/Institucional.jsx` (nuevo)
- `encuestas-online/src/lib/panelTemas.js` (nuevo)
- `encuestas-online/src/components/PanelCuadroVerde.jsx` (nuevo — del
  plan original, ahora lee `panel_config` con fallback a `panelTemas.js`)
- `encuestas-online/src/App.jsx` — panel como segundo hijo de `.stage`;
  sacar `.theme-badge`/uso de `temas.js` viejo
- `encuestas-online/src/App.css` — estilos del panel (adaptados a altura
  fija, sin `min-height` en px como el prototipo)
- Si se elige (a): modo preview en `encuestas-online` (nueva ruta/query
  param + listener de `postMessage`) + iframe en el builder
- `Metr1ka/src/pages/superadmin/EncuestaBuilderOnline.jsx` — selector de
  tema + 5 inputs de texto + panel de preview

## Preguntas a confirmar mañana antes de tocar código

1. ¿Preview por iframe+postMessage (a) o mini-render propio (b)?
2. "ESTUDIO DE OPINIÓN / 01" del prototipo — ¿sacar el "/ 01" o dejarlo?
3. `.theme-badge` (el circulito con emoji arriba de la encuesta) — ¿se
   saca del todo?
4. Copy por defecto de `gente` e `institucional` — los escribo yo como
   propuesta y los ajustamos juntos, o los tenés vos ya pensados?

## Verificación

- `npm run build` sin errores (Metr1ka y encuestas-online).
- Los 3 temas, cada uno con `panel_config` vacío (debe verse con los
  defaults) y con `panel_config` parcial (algunos campos editados, resto
  default).
- Sin scroll de página en ninguno de los 3 (ventana chica, zoom 150%,
  pregunta con muchas opciones — ahí sí scrollea solo esa pregunta).
- Mobile (`≤700px`): panel oculto, una sola columna, igual que hoy.
- Preview del superadmin refleja fielmente lo que ve el público (clave
  si se elige el camino (a)).
