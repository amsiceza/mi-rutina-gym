(function(){
  "use strict";

  const LS_DAY = "rutina-dia-actual";
  const LS_ALT_PREFIX = "rutina-alt-";      // + exerciseId -> índice alternativa elegida (0 = principal)
  const LS_WEIGHT_PREFIX = "rutina-peso-";  // + variantId -> último peso anotado
  const LS_DONE_PREFIX = "rutina-hecho-";   // + fecha + exerciseId -> true

  let DATA = null;
  let currentDayId = null;
  let activeExercise = null; // ejercicio base actualmente abierto en el modal

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function todayKey(){
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
  }

  // ---------- Carga de datos ----------
  // Los datos vienen embebidos en js/exercises-data.js (window.EXERCISES_DATA)
  // en lugar de cargarse con fetch, para que la app funcione también abriendo
  // index.html directamente con doble clic (file://), sin necesitar servidor.
  function loadData(){
    return new Promise((resolve, reject) => {
      if (window.EXERCISES_DATA) resolve(window.EXERCISES_DATA);
      else reject(new Error("No se encontró EXERCISES_DATA. ¿Falta cargar js/exercises-data.js?"));
    });
  }

  // ---------- Recomendaciones ----------
  function renderRecs(){
    const list = $("#recs-list");
    list.innerHTML = "";
    DATA.recomendacionesGenerales.forEach(rec => {
      const div = document.createElement("div");
      div.className = "rec-item";
      div.innerHTML = `<strong>${escapeHtml(rec.titulo)}</strong><p>${escapeHtml(rec.texto)}</p>`;
      list.appendChild(div);
    });
    $("#recs-toggle").addEventListener("click", () => {
      const expanded = $("#recs-toggle").getAttribute("aria-expanded") === "true";
      $("#recs-toggle").setAttribute("aria-expanded", String(!expanded));
      $("#recs-body").hidden = expanded;
    });
  }

  // ---------- Tabs de día ----------
  function renderDayTabs(){
    const nav = $("#day-tabs");
    nav.innerHTML = "";
    DATA.dias.forEach(dia => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day-tab";
      btn.dataset.day = dia.id;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.innerHTML = `<span class="tab-icon">${dia.icono}</span><span class="tab-label">Día ${dia.numero}<br>${escapeHtml(shortName(dia.nombre))}</span>`;
      btn.addEventListener("click", () => selectDay(dia.id));
      nav.appendChild(btn);
    });
  }

  function shortName(nombre){
    return nombre.split(",")[0];
  }

  function selectDay(dayId){
    currentDayId = dayId;
    localStorage.setItem(LS_DAY, dayId);
    $$(".day-tab").forEach(btn => {
      btn.setAttribute("aria-selected", String(btn.dataset.day === dayId));
    });
    renderExerciseGrid();
    renderDayProgress();
  }

  // ---------- Progreso del día ----------
  function getDoneSet(){
    const raw = localStorage.getItem(LS_DONE_PREFIX + todayKey());
    return raw ? JSON.parse(raw) : {};
  }
  function setDone(exerciseId, done){
    const key = LS_DONE_PREFIX + todayKey();
    const map = getDoneSet();
    if (done) map[exerciseId] = true; else delete map[exerciseId];
    localStorage.setItem(key, JSON.stringify(map));
  }
  function isDone(exerciseId){
    return !!getDoneSet()[exerciseId];
  }

  function renderDayProgress(){
    const dia = DATA.dias.find(d => d.id === currentDayId);
    const done = getDoneSet();
    const total = dia.ejercicios.length;
    const doneCount = dia.ejercicios.filter(e => done[e.id]).length;
    const pct = total ? Math.round((doneCount/total)*100) : 0;
    $("#day-progress").innerHTML = `
      <span>${doneCount}/${total} hecho hoy</span>
      <span class="progress-bar"><span class="progress-fill" style="width:${pct}%"></span></span>
    `;
  }

  // ---------- Alternativa elegida ----------
  function getChosenIndex(exercise){
    const raw = localStorage.getItem(LS_ALT_PREFIX + exercise.id);
    const idx = raw ? parseInt(raw, 10) : 0;
    const max = exercise.alternativas ? exercise.alternativas.length : 0;
    return (idx >= 0 && idx <= max) ? idx : 0;
  }
  function setChosenIndex(exercise, idx){
    localStorage.setItem(LS_ALT_PREFIX + exercise.id, String(idx));
  }
  function getVariant(exercise, idx){
    if (idx === 0) return exercise;
    return exercise.alternativas[idx - 1];
  }

  // ---------- Grid de fichas ----------
  function renderExerciseGrid(){
    const dia = DATA.dias.find(d => d.id === currentDayId);
    const grid = $("#exercise-grid");
    grid.innerHTML = "";
    let lastGroup = null;
    dia.ejercicios.forEach((ex, i) => {
      if (ex.grupoMuscular !== lastGroup){
        const h = document.createElement("div");
        h.className = "ex-group-title";
        h.textContent = ex.grupoMuscular;
        grid.appendChild(h);
        lastGroup = ex.grupoMuscular;
      }
      grid.appendChild(renderExerciseTile(ex, i + 1));
    });
  }

  function renderExerciseTile(ex, n){
    const idx = getChosenIndex(ex);
    const variant = getVariant(ex, idx);
    const done = isDone(ex.id);

    const tile = document.createElement("div");
    tile.className = "ex-tile" + (done ? " is-done" : "");

    const imgFile = window.EXERCISE_IMAGES[variant.nombre];
    const photo = imgFile
      ? `<img src="img/exercises/${imgFile}" alt="${escapeHtml(variant.nombre)}" loading="lazy">`
      : "";
    const altBadge = idx > 0 ? `<span class="alt-badge">🔄 alt.</span>` : "";

    tile.innerHTML = `
      <button type="button" class="tile-open">
        <div class="tile-fig">${altBadge}${photo}</div>
        <div class="tile-head">
          <span class="tile-n">${String(n).padStart(2, "0")}</span>
          <h3>${escapeHtml(variant.nombre)}</h3>
        </div>
      </button>
      <label class="tile-check">
        <input type="checkbox" ${done ? "checked" : ""}>
        <span class="check-ico">✓</span>
      </label>
    `;

    $(".tile-open", tile).addEventListener("click", () => openModal(ex));
    $("input", tile).addEventListener("change", (e) => {
      setDone(ex.id, e.target.checked);
      tile.classList.toggle("is-done", e.target.checked);
      renderDayProgress();
    });

    return tile;
  }

  function formatRest(sec){
    if (!sec) return "sin descanso";
    if (sec >= 60) {
      const min = Math.floor(sec/60);
      const rest = sec % 60;
      return rest ? `${min}m ${rest}s` : `${min} min`;
    }
    return `${sec}s`;
  }

  // ---------- Modal ----------
  function openModal(exercise){
    activeExercise = exercise;
    renderModalContent();
    $("#exercise-modal").showModal();
  }

  function renderModalContent(){
    const ex = activeExercise;
    const idx = getChosenIndex(ex);
    const variant = getVariant(ex, idx);
    const body = $("#modal-body");

    const altChips = [`<button type="button" class="alt-pill" data-idx="0" aria-pressed="${idx===0}">Principal</button>`];
    (ex.alternativas || []).forEach((alt, i) => {
      altChips.push(`<button type="button" class="alt-pill" data-idx="${i+1}" aria-pressed="${idx===i+1}">Opción ${i+2}</button>`);
    });

    const weightKey = LS_WEIGHT_PREFIX + (variant.id || ex.id);
    const savedWeight = localStorage.getItem(weightKey) || "";
    const showWeightInput = !/sin material|peso corporal/i.test(variant.equipo || "");

    const imgFile = window.EXERCISE_IMAGES[variant.nombre];
    const photo = imgFile
      ? `<img src="img/exercises/${imgFile}" alt="${escapeHtml(variant.nombre)}">`
      : "";
    const videoId = window.EXERCISE_VIDEOS[variant.nombre];
    const searchUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(variant.nombre + " ejercicio técnica correcta");

    const videoBlock = videoId ? `
      <details class="vid">
        <summary><span class="ico">&#9654;</span> Ver vídeo de referencia<span class="src">YouTube</span></summary>
        <div class="frame" data-id="${videoId}"></div>
        <a class="alt" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">Abrir en YouTube &#8599;</a>
      </details>
    ` : `
      <a class="vid-search" href="${searchUrl}" target="_blank" rel="noopener noreferrer">
        <span class="ico">&#9654;</span> Buscar vídeos de este ejercicio en YouTube
      </a>
    `;

    body.innerHTML = `
      <h2 class="modal-title">${escapeHtml(variant.nombre)}</h2>
      ${photo ? `<div class="fig">${photo}</div>` : ""}

      ${videoBlock}

      <div class="pills">
        <span class="pill soft"><small>Equipo</small>${escapeHtml(variant.equipo)}</span>
        <span class="pill soft"><small>Series × reps</small>${variant.series}×${escapeHtml(String(variant.repeticiones))}</span>
        <span class="pill soft"><small>Descanso</small>${formatRest(variant.descansoSeg)}</span>
      </div>

      <p class="tip"><b>💡 Peso recomendado:</b> ${escapeHtml(variant.pesoSugerido)}</p>
      <p class="feel"><b>⚠️ Técnica y cuidado articular:</b> ${escapeHtml(variant.notas)}</p>

      ${(ex.alternativas && ex.alternativas.length) ? `
      <div class="modal-section">
        <h4>🔄 Cambiar ejercicio (si hoy te apetece otra variante)</h4>
        <div class="alt-row">${altChips.join("")}</div>
      </div>` : ""}

      ${showWeightInput ? `
      <div class="modal-section">
        <h4>🏷️ Registro rápido</h4>
        <div class="weight-row">
          <label for="weight-input">Peso usado hoy</label>
          <input type="number" id="weight-input" inputmode="decimal" step="0.5" min="0" placeholder="kg" value="${escapeHtml(savedWeight)}">
          <span>kg</span>
        </div>
      </div>` : ""}

      ${variant.descansoSeg > 0 ? `
      <div class="modal-section">
        <h4>⏱️ Temporizador de descanso</h4>
        <div class="timer-row">
          <span class="timer-display" id="timer-display">${formatTimer(variant.descansoSeg)}</span>
          <button type="button" class="timer-btn" id="timer-btn">Iniciar descanso</button>
        </div>
      </div>` : ""}
    `;

    $$(".vid", body).forEach(vid => {
      vid.addEventListener("toggle", () => {
        if (!vid.open) return;
        const frame = $(".frame", vid);
        if (frame.querySelector("iframe")) return;
        const id = frame.dataset.id;
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
        iframe.loading = "lazy";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        frame.appendChild(iframe);
      });
    });

    $$(".alt-pill", body).forEach(chip => {
      chip.addEventListener("click", () => {
        setChosenIndex(ex, parseInt(chip.dataset.idx, 10));
        renderModalContent();
        renderExerciseGrid();
      });
    });

    const weightInput = $("#weight-input", body);
    if (weightInput){
      weightInput.addEventListener("change", () => {
        if (weightInput.value) localStorage.setItem(weightKey, weightInput.value);
        else localStorage.removeItem(weightKey);
      });
    }

    const timerBtn = $("#timer-btn", body);
    if (timerBtn){
      timerBtn.addEventListener("click", () => toggleTimer(variant.descansoSeg));
    }
  }

  // ---------- Temporizador de descanso ----------
  let timerInterval = null;

  function formatTimer(sec){
    const m = Math.floor(sec/60);
    const s = sec % 60;
    return `${String(m).padStart(1,"0")}:${String(s).padStart(2,"0")}`;
  }

  function stopTimer(){
    if (timerInterval){
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function toggleTimer(totalSec){
    const display = $("#timer-display");
    const btn = $("#timer-btn");
    if (!display || !btn) return;
    if (timerInterval){
      stopTimer();
      btn.textContent = "Reanudar";
      return;
    }
    let remaining = parseTimerDisplay(display.textContent, totalSec);
    btn.textContent = "Pausar";
    timerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0){
        display.textContent = "0:00";
        stopTimer();
        btn.textContent = "Reiniciar";
        if (navigator.vibrate) navigator.vibrate(200);
        return;
      }
      display.textContent = formatTimer(remaining);
    }, 1000);
  }

  function parseTimerDisplay(text, totalSec){
    if (text === "0:00") return totalSec;
    const [m, s] = text.split(":").map(Number);
    return m*60 + s;
  }

  function closeModal(){
    stopTimer();
    $("#exercise-modal").close();
  }

  function escapeHtml(str){
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  // ---------- Init ----------
  function init(){
    $("#modal-close").addEventListener("click", closeModal);
    $("#exercise-modal").addEventListener("click", (e) => {
      if (e.target.id === "exercise-modal") closeModal();
    });
    $("#exercise-modal").addEventListener("close", stopTimer);

    loadData().then(data => {
      DATA = data;
      renderRecs();
      renderDayTabs();
      const savedDay = localStorage.getItem(LS_DAY);
      const validDay = DATA.dias.some(d => d.id === savedDay) ? savedDay : DATA.dias[0].id;
      selectDay(validDay);
    }).catch(err => {
      $("#exercise-grid").innerHTML = `<p style="color:#b00020">No se pudo cargar la rutina (${escapeHtml(err.message)}). Asegúrate de que js/exercises-data.js, js/images.js y js/videos.js se carguen antes que js/app.js.</p>`;
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
