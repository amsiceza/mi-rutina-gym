# Mi Rutina de Fuerza

Web de una sola página (sin backend, sin build), pensada **mobile-first** para consultarse desde el móvil durante el entrenamiento, para seguir una rutina de **3 días a la semana** enfocada en ganar masa muscular, entrenando en casa con: barra, mancuernas, máquina de press de banca y máquina multifuncional (aperturas + polea).

- **Día 1** — Pecho, tríceps y abdominales
- **Día 2** — Hombros, bíceps + aeróbico
- **Día 3** — Espalda, pierna y abdominales

Todos los ejercicios, pesos sugeridos, series, repeticiones y descansos están en [`js/exercises-data.js`](js/exercises-data.js) — para añadir, quitar o ajustar algo solo hay que editar ese archivo, no hace falta tocar el resto del código.

## Qué incluye

- Mismo estilo visual que la app hermana [`rutina-movilidad`](https://github.com/amsiceza/rutina-movilidad): grid de fichas cuadradas, modal del ejercicio (pantalla completa en el móvil, recuadro centrado desde tablet/escritorio), tipografía Fraunces + Nunito Sans, paleta cálida con modo claro/oscuro automático según el sistema
- **Fotografía real** de cada uno de los 51 ejercicios y alternativas (no ilustraciones), tomada del dataset abierto [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio público / Unlicense) y guardada dentro del propio repositorio en `img/exercises/` — no depende de ningún servicio externo
- **Vídeo real incrustado en la propia app** (no un enlace externo): se carga perezosamente al abrir el desplegable "Ver vídeo de referencia", con enlace de escape a YouTube. 49 de los 51 ejercicios tienen un vídeo verificado por búsqueda real (no inventado); los 2 restantes (cardio en cinta y caminata al aire libre, donde no se encontró un tutorial claro) muestran en su lugar un botón de búsqueda en YouTube
- Recomendaciones generales pensadas para entrenar con seguridad a los 60 años (calentamiento, cómo elegir el peso con la escala RIR, progresión, cuidado articular, descanso entre sesiones)
- Cada ejercicio trae **2-3 alternativas** por si un día apetece cambiarlo (se recuerda tu elección)
- Peso sugerido y notas de técnica por ejercicio
- Temporizador de descanso entre series
- Registro rápido del peso usado, guardado en tu propio móvil/navegador
- Casilla "Hecho" por ejercicio y barra de progreso del día (se reinicia cada día)

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
  "alternativas": [ /* mismos campos, sin "alternativas" dentro */ ]
}
```

La foto y el vídeo de cada ejercicio se buscan por su **nombre exacto** (`nombre`), no por `id`:

- Foto: en [`js/images.js`](js/images.js) (`window.EXERCISE_IMAGES`), que apunta a un archivo dentro de `img/exercises/`. Si cambias el nombre de un ejercicio o añades uno nuevo, añade aquí su entrada; si no hay ninguna, simplemente no se muestra foto.
- Vídeo: en [`js/videos.js`](js/videos.js) (`window.EXERCISE_VIDEOS`) con el ID de YouTube (los 11 caracteres después de `v=` en la URL). Si no hay ninguna entrada, la app muestra automáticamente un botón de búsqueda en YouTube en su lugar.

Si quieres añadir una foto para un ejercicio nuevo, el dataset [free-exercise-db](https://github.com/yuhonas/free-exercise-db) tiene más de 800 ejercicios fotografiados y es de dominio público — su README explica cómo construir la URL de cada imagen.

## Aviso

Esta rutina es una guía general, no sustituye la valoración de un médico o fisioterapeuta. Ante cualquier dolor articular (no la fatiga muscular normal), detén el ejercicio y consulta.
