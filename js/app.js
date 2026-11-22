(function(){
  "use strict";

  const LS_THEME = "rutina-theme";
  const LS_DAY = "rutina-dia-actual";
  const LS_ALT_PREFIX = "rutina-alt-";      // + exerciseId -> índice alternativa elegida (0 = principal)
  const LS_WEIGHT_PREFIX = "rutina-peso-";  // + variantId -> último peso anotado
  const LS_DONE_PREFIX = "rutina-hecho-";   // + fecha + exerciseId -> true

  let DATA = null;
  let currentDayId = null;
  let activeExercise = null; // ejercicio base actualmente abierto en el modal
  let timerInterval = null;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function todayKey(){
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
  }

  // ---------- Tema ----------
  function initTheme(){
    const saved = localStorage.getItem(LS_THEME);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    updateThemeIcon();
    $("#theme-toggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(LS_THEME, next);
      updateThemeIcon();
    });
  }
  function updateThemeIcon(){
    const current = document.documentElement.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    $(".theme-icon").textContent = current === "dark" ? "☀️" : "🌙";
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

  // ---------- Grid de ejercicios ----------
  function renderExerciseGrid(){
    const dia = DATA.dias.find(d => d.id === currentDayId);
    const grid = $("#exercise-grid");
    grid.innerHTML = "";
    let lastGroup = null;
    dia.ejercicios.forEach(ex => {
      if (ex.grupoMuscular !== lastGroup){
        const h = document.createElement("div");
        h.className = "ex-group-title";
        h.textContent = ex.grupoMuscular;
        grid.appendChild(h);
        lastGroup = ex.grupoMuscular;
      }
      grid.appendChild(renderExerciseCard(ex, dia.colorTag));
    });
  }

  function renderExerciseCard(ex, colorTag){
    const idx = getChosenIndex(ex);
    const variant = getVariant(ex, idx);
    const done = isDone(ex.id);

    const card = document.createElement("div");
    card.className = "ex-card" + (done ? " is-done" : "");
    card.dataset.exerciseId = ex.id;

    const altBadge = idx > 0 ? `<span class="alt-mark">🔄 alternativa</span>` : "";

    card.innerHTML = `
      <span class="ex-dot ${colorTag}"></span>
      <button type="button" class="ex-open">
        <span class="ex-info">
          <h3>${escapeHtml(variant.nombre)}</h3>
          <span class="ex-meta">
            <span>${variant.series}×${escapeHtml(String(variant.repeticiones))}</span>
            <span>·</span>
            <span>${formatRest(variant.descansoSeg)}</span>
            ${altBadge ? `<span>·</span>${altBadge}` : ""}
          </span>
        </span>
      </button>
      <button type="button" class="ex-check" aria-label="Marcar como hecho" aria-pressed="${done}">✓</button>
    `;

    $(".ex-open", card).addEventListener("click", () => openModal(ex));
    $(".ex-check", card).addEventListener("click", () => {
      const nowDone = !isDone(ex.id);
      setDone(ex.id, nowDone);
      renderExerciseGrid();
      renderDayProgress();
    });

    return card;
  }

  function formatRest(sec){
    if (!sec) return "sin descanso";
    if (sec >= 60) {
      const min = Math.floor(sec/60);
      const rest = sec % 60;
      return rest ? `descanso ${min}m ${rest}s` : `descanso ${min} min`;
    }
    return `descanso ${sec}s`;
  }

  // ---------- Modal ----------
  function openModal(exercise){
    activeExercise = exercise;
    stopTimer();
    renderModalContent();
    $("#exercise-modal").showModal();
  }

  function renderModalContent(){
    const ex = activeExercise;
    const idx = getChosenIndex(ex);
    const variant = getVariant(ex, idx);
    const body = $("#modal-body");

    const altChips = [`<button type="button" class="alt-chip" data-idx="0" aria-pressed="${idx===0}">Principal</button>`];
    (ex.alternativas || []).forEach((alt, i) => {
      altChips.push(`<button type="button" class="alt-chip" data-idx="${i+1}" aria-pressed="${idx===i+1}">Opción ${i+2}</button>`);
    });

    const weightKey = LS_WEIGHT_PREFIX + (variant.id || ex.id);
    const savedWeight = localStorage.getItem(weightKey) || "";
    const showWeightInput = !/sin material|peso corporal/i.test(variant.equipo || "");

    body.innerHTML = `
      <div class="modal-group">${escapeHtml(ex.grupoMuscular)}</div>
      <h2 class="modal-title">${escapeHtml(variant.nombre)}</h2>
      <div class="modal-stats">
        <div class="stat-chip"><small>Equipo</small>${escapeHtml(variant.equipo)}</div>
        <div class="stat-chip"><small>Series</small>${variant.series}</div>
        <div class="stat-chip"><small>Repeticiones</small>${escapeHtml(String(variant.repeticiones))}</div>
        <div class="stat-chip"><small>Descanso</small>${formatRest(variant.descansoSeg)}</div>
      </div>

      <div class="modal-section">
        <h4>💡 Peso recomendado</h4>
        <p>${escapeHtml(variant.pesoSugerido)}</p>
      </div>

      <div class="modal-section">
        <h4>⚠️ Técnica y cuidado articular</h4>
        <p>${escapeHtml(variant.notas)}</p>
      </div>

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

      <button type="button" class="modal-done-btn ${isDone(ex.id) ? "is-done" : ""}" id="modal-done-btn">
        ${isDone(ex.id) ? "✓ Marcado como hecho" : "Marcar como hecho"}
      </button>
    `;

    $$(".alt-chip", body).forEach(chip => {
      chip.addEventListener("click", () => {
        setChosenIndex(ex, parseInt(chip.dataset.idx, 10));
        stopTimer();
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

    $("#modal-done-btn", body).addEventListener("click", () => {
      const nowDone = !isDone(ex.id);
      setDone(ex.id, nowDone);
      renderModalContent();
      renderExerciseGrid();
      renderDayProgress();
    });
  }

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
        btn.dataset.finished = "1";
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
    initTheme();
    $("#modal-close").addEventListener("click", closeModal);
    $("#exercise-modal").addEventListener("click", (e) => {
      if (e.target.id === "exercise-modal") closeModal();
    });

    loadData().then(data => {
      DATA = data;
      renderRecs();
      renderDayTabs();
      const savedDay = localStorage.getItem(LS_DAY);
      const validDay = DATA.dias.some(d => d.id === savedDay) ? savedDay : DATA.dias[0].id;
      selectDay(validDay);
    }).catch(err => {
      $("#exercise-grid").innerHTML = `<p style="color:#b00020">No se pudo cargar la rutina (${escapeHtml(err.message)}). Asegúrate de que el archivo js/exercises-data.js esté presente y se cargue antes que js/app.js.</p>`;
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
