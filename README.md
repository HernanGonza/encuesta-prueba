# Encuestas online — demo Metr1ka

El archivo **index.html** está listo para publicar: incluye React, los estilos, el logo y la ilustración. Se puede abrir directamente en el navegador o subir como inicio de un sitio en GitHub Pages. No requiere instalación ni compilación para usarlo. Las fuentes se cargan desde Google Fonts; si no hay conexión se usan las fuentes de respaldo.

La encuesta contiene una bienvenida, cinco preguntas y un cierre. Incluye selección única, hasta tres prioridades, valoración del 1 al 5 y texto opcional. Se puede volver atrás sin perder respuestas, usar letras para elegir opciones y Enter para avanzar (en el campo de texto, Enter agrega una línea).

Es una demostración sin servidor, cuentas, analítica ni almacenamiento. Las respuestas existen solo en memoria y se borran al recargar o reiniciar. Finalizar no envía datos.

## Editar

- `encuesta.jsx`: contenido y comportamiento de la encuesta.
- `plantilla.html`: diseño, estilos y estructura del documento.
- `build.mjs`: genera `index.html` usando las dependencias existentes de `../Metr1ka` y su logo original.

Desde la carpeta principal del proyecto, después de editar:

```sh
node encuestas-online/build.mjs
```

Para publicar solo hace falta el `index.html` generado. No hay rutas absolutas ni recursos locales adicionales. El editor de encuestas, la publicación desde la plataforma y la asignación de subdominios quedan fuera de esta demo.
