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
    // El modal debe estar abierto (showModal) antes de medir anchos para el
    // carrusel de alternativas: un <dialog> cerrado no tiene layout y todas
    // las medidas (clientWidth/scrollWidth) saldrían a 0.
    $("#exercise-modal").showModal();
    renderModalContent();
  }

  function renderModalContent(){
    stopTimer(); // evita que un temporizador en marcha siga corriendo contra el DOM anterior
    const ex = activeExercise;
    const idx = getChosenIndex(ex);
    const variant = getVariant(ex, idx);
    const body = $("#modal-body");
    const dia = DATA.dias.find(d => d.id === currentDayId);

    $("#exercise-modal").style.setProperty("--day-accent", `var(--${dia.colorTag})`);

    const altOptions = [{ idx: 0, nombre: ex.nombre }, ...(ex.alternativas || []).map((alt, i) => ({ idx: i+1, nombre: alt.nombre }))];
    const altTabs = altOptions.map(opt => `
      <button type="button" class="alt-tab" role="tab" data-idx="${opt.idx}" aria-selected="${idx===opt.idx}">${escapeHtml(opt.nombre)}</button>
    `).join("");
    const altDots = altOptions.map(opt => `<span class="alt-dot${idx===opt.idx ? " is-active" : ""}" data-idx="${opt.idx}"></span>`).join("");

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

    const hasTrainCard = showWeightInput || variant.descansoSeg > 0;
    if (variant.descansoSeg > 0) initTimerState(variant.descansoSeg);

    body.innerHTML = `
      <div class="modal-head">
        <span>${dia.icono}</span>
        <div class="modal-group">${escapeHtml(ex.grupoMuscular)}</div>
      </div>

      ${altOptions.length > 1 ? `
      <div class="alt-slider">
        <div class="alt-tabs" role="tablist" aria-label="Elegir ejercicio" id="alt-tabs-track">${altTabs}</div>
      </div>
      <div class="alt-dots">${altDots}</div>
      ` : ""}

      <h2 class="modal-title">${escapeHtml(variant.nombre)}</h2>
      ${photo ? `<div class="fig"><span class="fig-badge">${dia.icono}</span>${photo}</div>` : ""}

      ${videoBlock}

      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-icon">🔁</span>
          <span class="stat-value">${variant.series}×${escapeHtml(String(variant.repeticiones))}</span>
          <span class="stat-label">Series × reps</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⏱️</span>
          <span class="stat-value">${formatRest(variant.descansoSeg)}</span>
          <span class="stat-label">Descanso</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🏋️</span>
          <span class="stat-value">${escapeHtml(variant.equipo)}</span>
          <span class="stat-label">Equipo</span>
        </div>
      </div>

      <div class="info-card">
        <span class="info-ico">💡</span>
        <div><strong>Peso recomendado</strong><p>${escapeHtml(variant.pesoSugerido)}</p></div>
      </div>
      <div class="info-card">
        <span class="info-ico">⚠️</span>
        <div><strong>Técnica y cuidado articular</strong><p>${escapeHtml(variant.notas)}</p></div>
      </div>

      ${hasTrainCard ? `
      <div class="train-card">
        ${showWeightInput ? `
        <div class="train-item">
          <label for="weight-input">🏷️ Peso usado hoy</label>
          <div class="weight-stepper">
            <button type="button" class="weight-step" data-dir="-1" aria-label="Restar medio kilo">−</button>
            <div class="weight-value">
              <input type="number" id="weight-input" inputmode="decimal" step="0.5" min="0" placeholder="0" value="${escapeHtml(savedWeight)}">
              <span>kg</span>
            </div>
            <button type="button" class="weight-step" data-dir="1" aria-label="Sumar medio kilo">+</button>
          </div>
        </div>` : ""}

        ${variant.descansoSeg > 0 ? `
        <div class="train-item">
          <label>⏱️ Temporizador de descanso</label>
          <div class="timer-widget">
            <div class="timer-ring" id="timer-ring" style="--pct:100">
              <div class="timer-ring-inner">
                <span class="timer-display" id="timer-display">${formatTimer(timerRemaining)}</span>
              </div>
            </div>
            <div class="timer-controls">
              <button type="button" class="timer-btn-main" id="timer-btn" aria-label="Iniciar descanso">▶</button>
              <button type="button" class="timer-btn-reset" id="timer-reset" aria-label="Reiniciar descanso">↺</button>
            </div>
          </div>
        </div>` : ""}
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
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        frame.appendChild(iframe);
      });
    });

    const selectAlt = (newIdx) => {
      setChosenIndex(ex, newIdx);
      renderModalContent();
      renderExerciseGrid();
    };
    $$(".alt-tab", body).forEach(chip => {
      chip.addEventListener("click", () => selectAlt(parseInt(chip.dataset.idx, 10)));
    });
    $$(".alt-dot", body).forEach(dot => {
      dot.addEventListener("click", () => selectAlt(parseInt(dot.dataset.idx, 10)));
    });

    const track = $("#alt-tabs-track", body);
    if (track){
      const activeTab = track.querySelector('.alt-tab[aria-selected="true"]');
      if (activeTab) track.scrollLeft = Math.max(0, activeTab.offsetLeft - 4);
    }

    const weightInput = $("#weight-input", body);
    if (weightInput){
      const saveWeight = () => {
        if (weightInput.value) localStorage.setItem(weightKey, weightInput.value);
        else localStorage.removeItem(weightKey);
      };
      weightInput.addEventListener("change", saveWeight);
      $$(".weight-step", body).forEach(stepBtn => {
        stepBtn.addEventListener("click", () => {
          const dir = parseInt(stepBtn.dataset.dir, 10);
          const current = parseFloat(weightInput.value) || 0;
          const next = Math.max(0, current + dir * 0.5);
          weightInput.value = next % 1 === 0 ? next : next.toFixed(1);
          saveWeight();
        });
      });
    }

    const timerBtn = $("#timer-btn", body);
    if (timerBtn){
      timerBtn.addEventListener("click", toggleTimer);
    }
    const timerResetBtn = $("#timer-reset", body);
    if (timerResetBtn){
      timerResetBtn.addEventListener("click", resetTimer);
    }
  }

  // ---------- Temporizador de descanso ----------
  let timerInterval = null;
  let timerTotal = 0;
  let timerRemaining = 0;

  function formatTimer(sec){
    const m = Math.floor(sec/60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2,"0")}`;
  }

  function stopTimer(){
    if (timerInterval){
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function initTimerState(totalSec){
    stopTimer();
    timerTotal = totalSec;
    timerRemaining = totalSec;
  }

  function renderTimerUI(){
    const ring = $("#timer-ring");
    const display = $("#timer-display");
    const btn = $("#timer-btn");
    if (!ring || !display) return;
    display.textContent = formatTimer(timerRemaining);
    const pct = timerTotal > 0 ? (timerRemaining / timerTotal) * 100 : 0;
    ring.style.setProperty("--pct", pct);
    if (btn) btn.textContent = timerInterval ? "⏸" : "▶";
  }

  function toggleTimer(){
    if (timerInterval){
      stopTimer();
      renderTimerUI();
      return;
    }
    if (timerRemaining <= 0) timerRemaining = timerTotal;
    timerInterval = setInterval(() => {
      timerRemaining -= 1;
      if (timerRemaining <= 0){
        timerRemaining = 0;
        stopTimer();
        renderTimerUI();
        if (navigator.vibrate) navigator.vibrate(200);
        return;
      }
      renderTimerUI();
    }, 1000);
    renderTimerUI();
  }

  function resetTimer(){
    timerRemaining = timerTotal;
    stopTimer();
    renderTimerUI();
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
