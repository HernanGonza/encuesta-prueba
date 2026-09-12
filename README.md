# Encuestas online — Metr1ka

Proyecto Vite + React independiente (no depende de `../Metr1ka`) para la
página que va a responder cada encuesta online publicada desde el panel.
Por ahora sigue siendo una demo: las preguntas están fijas en `src/App.jsx`
y no se envía ni guarda nada. Cuando se conecte al panel, esa misma pantalla
va a leer la encuesta real desde Supabase según el subdominio y va a guardar
las respuestas — ver el `TODO` en `src/App.jsx`.

## Desarrollo

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

Genera `dist/`, listo para publicar en cualquier hosting estático.

## Publicación (GitHub Pages)

El repo ya está enlazado a GitHub Pages con dominio personalizado
(`public/CNAME` → `campogrande.metr1ka.com`, se copia solo a `dist/` en el
build). Hay un workflow en `.github/workflows/deploy.yml` que compila y
publica en cada push a `main`.

**Paso único pendiente en GitHub** (una sola vez): en el repo, ir a
Settings → Pages → Source y elegir "GitHub Actions" en vez de "Deploy from
a branch". Sin ese cambio el workflow corre pero Pages sigue sirviendo el
contenido viejo.

## Editar

- `src/App.jsx`: contenido y comportamiento de la encuesta.
- `src/App.css`: estilos.
- `src/components/`: logo, ilustración e íconos.
- `public/favicon.svg`: ícono del sitio.

El editor de encuestas, la publicación desde la plataforma y la asignación
dinámica de subdominios están planificados pero todavía no implementados
(quedan del lado del panel `Metr1ka/`, no de este proyecto).
