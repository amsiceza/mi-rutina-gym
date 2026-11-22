# Mi Rutina de Fuerza

Web de una sola página (sin backend, sin build), pensada **mobile-first** para consultarse desde el móvil durante el entrenamiento, para seguir una rutina de **3 días a la semana** enfocada en ganar masa muscular, entrenando en casa con: barra, mancuernas, máquina de press de banca y máquina multifuncional (aperturas + polea).

- **Día 1** — Pecho, tríceps y abdominales
- **Día 2** — Hombros, bíceps + aeróbico
- **Día 3** — Espalda, pierna y abdominales

Todos los ejercicios, pesos sugeridos, series, repeticiones y descansos están en [`js/exercises-data.js`](js/exercises-data.js) — para añadir, quitar o ajustar algo solo hay que editar ese archivo, no hace falta tocar el resto del código.

## Qué incluye

- Diseño mobile-first: pantallas táctiles grandes, modal del ejercicio a pantalla completa en el móvil
- Ilustración (pictograma) de la postura de cada uno de los 51 ejercicios y alternativas, dibujada en SVG (ligera, nítida, sin fotos que descargar)
- Botón "Ver vídeos de este ejercicio en YouTube" en cada ejercicio: abre una búsqueda de YouTube con el nombre exacto del ejercicio (no enlaza a un vídeo concreto, para no depender de que siga existiendo)
- Recomendaciones generales pensadas para entrenar con seguridad a los 60 años (calentamiento, cómo elegir el peso con la escala RIR, progresión, cuidado articular, descanso entre sesiones)
- Cada ejercicio trae **2-3 alternativas** por si un día apetece cambiarlo (se recuerda tu elección)
- Peso sugerido y notas de técnica por ejercicio
- Temporizador de descanso entre series
- Registro rápido del peso usado, guardado en tu propio móvil/navegador
- Casilla "Hecho" por ejercicio y barra de progreso del día (se reinicia cada día)
- Modo claro / oscuro

Todo se guarda únicamente en el `localStorage` de tu navegador: no hay servidor, cuenta ni datos que salgan de tu dispositivo.

## Ver la rutina en local

Abre `index.html` directamente con doble clic, sin necesidad de servidor ni instalar nada: los datos están embebidos en `js/exercises-data.js`, así que funciona tal cual con doble clic.

## Publicar en GitHub Pages

1. Sube esta carpeta a un repositorio de GitHub.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)`.
4. Guarda. En uno o dos minutos la app queda publicada en `https://<tu-usuario>.github.io/<nombre-repo>/`.

No hace falta build, Node ni dependencias: es HTML/CSS/JS plano.

## Ajustar la rutina

Para cambiar un ejercicio, peso sugerido, series, repeticiones o añadir una alternativa nueva, edita `js/exercises-data.js`. Es un objeto JavaScript (`window.EXERCISES_DATA = { ... }`) con la misma estructura que un JSON; cada ejercicio tiene esta forma:

```js
{
  "id": "identificador-unico",
  "grupoMuscular": "Pecho",
  "nombre": "Nombre del ejercicio",
  "equipo": "Qué máquina o material usa",
  "series": 3,
  "repeticiones": "10-12",
  "descansoSeg": 90,
  "pesoSugerido": "Consejo de peso",
  "notas": "Consejo de técnica/seguridad",
  "ilustracion": "clave-de-pose",
  "alternativas": [ /* mismos campos, sin "alternativas" dentro */ ]
}
```

`ilustracion` debe ser una de las claves definidas en [`js/illustrations.js`](js/illustrations.js) (por ejemplo `"sentadilla"`, `"curl-biceps"`, `"plancha-frontal"`...). Si pones una clave que no existe, se usa un pictograma genérico de respaldo.

## Aviso

Esta rutina es una guía general, no sustituye la valoración de un médico o fisioterapeuta. Ante cualquier dolor articular (no la fatiga muscular normal), detén el ejercicio y consulta.
