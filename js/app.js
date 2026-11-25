/* Навигация, разделы, интерактивность. */
(function () {
  var D = window.DATA, S = window.SOURCES, RED = window.REDUCED || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var byId = {}; S.forEach(function (s) { byId[s.id] = s; });
  window.Sims = window.Sims || {};
  var $ = function (s) { return document.querySelector(s); };
  var body = document.body, panelBody = $("#panelBody"), tabs = $("#tabs");
  var st = { mode: "intro", ci: 0, si: 0, busy: false }, sim = null, timers = [], srcFilter = { f: "country", o: "all", hl: null };

  function later(fn, ms) { var id = setTimeout(fn, RED ? 0 : ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function key() { return D.order[st.ci]; }
  function C() { return D.countries[key()]; }
  function setMode(m) { var s = body.classList.contains("show-src"); st.mode = m; body.className = "mode-" + m + (s ? " show-src" : ""); }

  function chips(ids) {
    return (ids || []).map(function (i) { var s = byId[i]; return '<a href="#" class="src o-' + (s ? s.origin : "") + '" data-sid="' + i + '" title="' + (s ? s.publisher.replace(/"/g, "'") + " · " + s.origin : "") + '">' + i + '</a>'; }).join("");
  }
  function num(el, target, dec) {
    if (RED) { el.textContent = target.toFixed(dec).replace(".", ","); return; }
    var t0 = performance.now();
    (function f(t) { var k = Math.min((t - t0) / 800, 1); el.textContent = (target * k).toFixed(dec).replace(".", ","); if (k < 1) requestAnimationFrame(f); })(t0);
  }
  function disposeSim() { if (sim && sim.dispose) sim.dispose(); sim = null; }


  /* ---------- SVG-карта страны (неон), клик — приближение ---------- */
  function countryMap(k) {
    var G_ = window.GEO; if (!G_) return "";
    var c = D.countries[k], rings = G_.detail[k] || [], x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    rings.forEach(function (r) { for (var i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } });
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = Math.max(x1 - x0, 5) * 1.5, hgt = Math.max(y1 - y0, 3) * 1.5;
    var cs = Math.cos(cy * Math.PI / 180), W = w * cs, H = hgt;
    if (W / H < 1.5) W = H * 1.5; else if (W / H > 2.4) H = W / 2.4;
    function px(lon) { return ((lon - cx) * cs + W / 2).toFixed(2); }
    function py(lat) { return (H / 2 - (lat - cy)).toFixed(2); }
    function d(r) { var s = ""; for (var i = 0; i < r.length; i += 2) s += (i ? "L" : "M") + px(r[i]) + " " + py(r[i + 1]); return s + "Z"; }
    var ctx = "", e;
    G_.world.forEach(function (r) { ctx += '<path d="' + d(r) + '" fill="#0a1230" stroke="#4a63b8" stroke-width="1" vector-effect="non-scaling-stroke"/>'; });
    for (e = 0; e < 7; e++) (G_.detail["x" + e] || []).forEach(function (r) { ctx += '<path d="' + d(r) + '" fill="#18244f" stroke="#8d9fe0" stroke-width="1.2" vector-effect="non-scaling-stroke"/>'; });
    D.order.forEach(function (o) { if (o !== k) (G_.detail[o] || []).forEach(function (r) { ctx += '<path d="' + d(r) + '" fill="#1a2c63" stroke="' + D.countries[o].color + '" stroke-opacity=".6" stroke-width="1.2" vector-effect="non-scaling-stroke"/>'; }); });
    var me = rings.map(function (r) { return '<path d="' + d(r) + '" fill="' + c.color + '" fill-opacity=".38" stroke="' + c.color + '" stroke-width="2.6" vector-effect="non-scaling-stroke" style="filter:drop-shadow(0 0 5px ' + c.color + ')"/>'; }).join("");
    var fs = H * .075, X = px(c.lon), Y = py(c.lat);
    var rip = RED ? "" : [0, 1.2].map(function (b) { return '<circle class="rip" cx="' + X + '" cy="' + Y + '" r="0" fill="none" stroke="' + c.color + '" stroke-width="2.4" vector-effect="non-scaling-stroke"><animate attributeName="r" from="0" to="' + H * .16 + '" dur="2.6s" begin="' + b + 's" repeatCount="indefinite"/><animate attributeName="opacity" from="1" to="0" dur="2.6s" begin="' + b + 's" repeatCount="indefinite"/></circle>'; }).join("");
    var city = rip + '<circle cx="' + X + '" cy="' + Y + '" r="' + H * .022 + '" fill="#fff" style="filter:drop-shadow(0 0 4px ' + c.color + ')"/><text x="' + X + '" y="' + (+Y - H * .045) + '" text-anchor="middle" font-size="' + fs + '" font-weight="700" fill="#fff" stroke="#04050f" stroke-width="' + fs * .12 + '" paint-order="stroke">' + c.city + '</text>';
    return '<div class="map" id="cmap" data-ox="' + (X / W * 100) + '" data-oy="' + (Y / H * 100) + '"><svg viewBox="0 0 ' + W.toFixed(2) + ' ' + H.toFixed(2) + '" preserveAspectRatio="xMidYMid slice"><g class="z" id="mapG">' + ctx + me + city + '</g></svg><span class="hint">🔍 нажмите</span></div>';
  }

  /* ---------- панель ---------- */
  function renderHead() {
    var c = C();
    $("#panelHead").innerHTML = '<h2>' + (st.ci + 1) + '. ' + c.name + '</h2><p>' + c.lead + '</p>';
    document.documentElement.style.setProperty("--c", c.color);
    tabs.innerHTML = D.sections.map(function (s, i) { return '<button role="tab" data-i="' + i + '" class="' + (i === st.si ? "on" : "") + '">' + s.t + '</button>'; }).join("");
    renderProgress();
  }
  function renderProgress() {
    var h = "", i;
    for (i = 0; i < 6; i++) h += '<i class="' + (st.mode === "final" || i < st.ci ? "done" : "") + (st.mode === "country" && i === st.ci ? " on" : "") + '"></i>';
    h += '<i class="' + (st.mode === "final" ? "on" : "") + '"></i>';
    $("#progress").innerHTML = h;
  }
  function renderSection() {
    disposeSim(); Charts.destroyAll(); clearTimers();
    var id = D.sections[st.si].id, c = C();
    var html = ({ history: secHistory, heroes: secHeroes, model: secModel, solutions: secSolutions, sources: secSources })[id](c);
    panelBody.innerHTML = html; panelBody.scrollTop = 0;
    panelBody.classList.remove("fade"); void panelBody.offsetWidth; panelBody.classList.add("fade");
    tabs.querySelectorAll("button").forEach(function (b, i) { b.classList.toggle("on", i === st.si); });
    ({ history: afterHistory, heroes: afterHeroes, model: afterModel, solutions: afterSolutions, sources: afterSources })[id](c);
    document.documentElement.style.setProperty("--c", c.color);
  }

  /* --- общие помощники --- */
  function photo(k) { return (window.IMG || {})[k]; }
  function cred(k) { var p = photo(k); return p && p.sid ? '<a href="#" class="cr" data-sid="' + p.sid + '" title="Автор и лицензия фото">©</a>' : ""; }
  function pills(items) { return '<div class="pills">' + items.map(function (t, i) { return '<button class="pill-b" data-p="' + i + '">' + t + '</button>'; }).join("") + '</div>'; }
  function subs(onShow) {
    var bs = panelBody.querySelectorAll(".pill-b"), ps = panelBody.querySelectorAll(".sub");
    function show(i) { bs.forEach(function (b, k) { b.classList.toggle("on", k === i); }); ps.forEach(function (p, k) { p.hidden = k !== i; }); panelBody.scrollTop = 0; if (onShow) onShow(i); }
    bs.forEach(function (b, i) { b.addEventListener("click", function () { show(i); }); });
    show(0);
  }
  function numFT(el, from, to, dec) {
    function f(v) { return v.toFixed(dec).replace(".", ","); }
    if (RED) { el.textContent = f(to); return; }
    var t0 = performance.now();
    (function s(t) { var k = Math.min((t - t0) / 1600, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = f(from + (to - from) * e); if (k < 1) requestAnimationFrame(s); })(t0);
  }
  function tile(t, i) {
    var col = t.to < 0 ? "var(--bad)" : "var(--ok)", vis;
    if (t.shape === "ring") vis = '<svg viewBox="0 0 100 100"><circle class="rb" cx="50" cy="50" r="42"/><circle class="rf" cx="50" cy="50" r="42"/></svg>';
    else if (t.shape === "tank") vis = '<div class="tank"><i></i></div>';
    else vis = '<div class="hbar"><i></i></div>';
    return '<div class="tile" data-i="' + i + '" style="--tc:' + col + '"><div class="tv">' + vis + '</div><div class="tn"><span class="num">0</span>' + (t.suffix || "") + '</div><div class="tl2">' + t.label + '</div></div>';
  }
  function animTiles(c, rootEl) {
    (rootEl || panelBody).querySelectorAll(".tile").forEach(function (el, i) {
      var t = c.tiles[i], fr = t.from === undefined ? 0 : t.from, frac = function (v) { return Math.min(Math.abs(v) / t.max, 1); };
      var rf = el.querySelector(".rf"), tk = el.querySelector(".tank i"), hb = el.querySelector(".hbar i");
      if (rf) rf.style.strokeDashoffset = 264;
      if (tk) { tk.style.transition = "none"; tk.style.height = frac(fr) * 100 + "%"; }
      if (hb) hb.style.width = "0%";
      setTimeout(function () {
        if (rf) rf.style.strokeDashoffset = 264 * (1 - frac(t.to));
        if (tk) { tk.style.transition = ""; tk.style.height = frac(t.to) * 100 + "%"; }
        if (hb) hb.style.width = Math.max(frac(t.to) * 100, 3) + "%";
        numFT(el.querySelector(".num"), fr, t.to, t.dec);
      }, RED ? 0 : 150 + i * 250);
    });
  }

  /* --- История --- */
  function secHistory(c) {
    var k = key(), ph = photo(k);
    var h = pills(["Главное", "Карта", "График", "События"]);
    h += '<div class="sub"><div class="banner">' + (ph ? '<img class="bimg" src="' + ph.file + '" alt="' + c.city + '">' : "") + '<div class="bn-in"><h3>' + c.city + '</h3></div>' + cred(k) + '</div><div class="tiles">' + c.tiles.map(tile).join("") + '</div></div>';
    h += '<div class="sub">' + countryMap(k) + '</div>';
    h += '<div class="sub">' + c.charts.map(function (ch, i) {
      return '<div class="chart"><h4>' + ch.title + '</h4><canvas data-ch="' + i + '" height="220"></canvas>' + (ch.dashed ? '<div class="interp">Пунктир — интерполяция.</div>' : "") + '<div>' + chips(ch.src) + '</div></div>';
    }).join("") + '</div>';
    h += '<div class="sub"><div class="tl">' + c.timeline.map(function (e, i) {
      return '<div class="tl-item" style="--i:' + i + '" data-e="' + e.id + '"><button class="dot" aria-label="' + e.date + '"></button><button class="tl-btn"><div class="tl-date">' + e.date + '</div><div class="tl-title">' + e.title + '</div></button>' +
        '<div class="tl-card">' + (e.metric ? '<div class="num" data-v="' + e.metric.value + '" data-d="' + e.metric.dec + '">0</div><div class="numl">' + e.metric.label + '</div>' : "") + '<div>' + e.text + '</div><div>' + chips(e.src) + '</div></div></div>';
    }).join("") + '</div></div>';
    return h;
  }
  function afterHistory(c) {
    var rendered = false, pre = st.pendingEvent; st.pendingEvent = null;
    subs(function (i) {
      if (i === 0) animTiles(c);
      if (i === 2 && !rendered) { rendered = true; panelBody.querySelectorAll("canvas[data-ch]").forEach(function (cv) { Charts.render(cv, c.charts[+cv.dataset.ch]); }); }
    });
    var mp = $("#cmap");
    if (mp) mp.addEventListener("click", function () {
      var g = $("#mapG"), z = mp.classList.toggle("zoomed");
      g.style.transformOrigin = mp.dataset.ox + "% " + mp.dataset.oy + "%"; g.style.transformBox = "view-box";
      g.style.transform = z ? "scale(2.6)" : "none"; mp.querySelector(".hint").textContent = z ? "🔍 назад" : "🔍 нажмите";
    });
    panelBody.querySelectorAll(".tl-item").forEach(function (it) {
      it.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { selectEvent(it); }); });
    });
    if (pre) { panelBody.querySelectorAll(".pill-b")[3].click(); var it = panelBody.querySelector('[data-e="' + pre + '"]'); if (it) selectEvent(it); }
  }
  function selectEvent(it) {
    panelBody.querySelectorAll(".tl-item").forEach(function (x) { x.classList.remove("on"); });
    it.classList.add("on");
    var n = it.querySelector(".num"); if (n) num(n, +n.dataset.v, +n.dataset.d);
    Globe.nudge();
  }

  /* --- Герои --- */
  function secHeroes(c) {
    var h = '<div class="heroes">';
    c.heroes.forEach(function (p, i) {
      var ph = p.photo && photo(p.photo);
      h += '<button class="hero" data-h="' + i + '" style="--hc:' + p.color + '"><div class="pf">' + (ph ? '<img src="' + ph.file + '" alt="' + p.name + '" onerror="this.remove()">' : "") + '<span>' + p.initials + '</span></div>' + (ph ? cred(p.photo) : "") +
        '<b>' + p.name + '</b><small>' + p.role + '</small>' +
        '<div class="more"><p><b>Что сделал?</b><br>' + p.did + '</p><p><b>Какое решение затронул?</b><br>' + p.decision + '</p><div>' + chips(p.src) + '</div></div></button>';
    });
    h += '</div><h3>Когда это было</h3><div class="mini-tl" id="miniTl">' + c.timeline.map(function (e) { return '<span data-e="' + e.id + '">' + e.date + '</span>'; }).join("") + '</div>';
    return h;
  }
  function afterHeroes(c) {
    panelBody.querySelectorAll(".pf").forEach(function (pf) { if (pf.querySelector("img")) pf.querySelector("span").style.display = "none"; });
    panelBody.querySelectorAll(".hero").forEach(function (b) {
      b.addEventListener("click", function (ev) {
        if (ev.target.closest(".src,.cr")) return;
        var on = b.classList.contains("on");
        panelBody.querySelectorAll(".hero").forEach(function (x) { x.classList.remove("on"); });
        panelBody.querySelectorAll("#miniTl span").forEach(function (s) { s.classList.remove("mark"); });
        if (!on) { b.classList.add("on"); var evs = c.heroes[+b.dataset.h].events; panelBody.querySelectorAll("#miniTl span").forEach(function (s) { if (evs.indexOf(s.dataset.e) >= 0) s.classList.add("mark"); }); }
      });
    });
    panelBody.querySelectorAll("#miniTl span").forEach(function (s) { s.style.cursor = "pointer"; s.addEventListener("click", function () { st.pendingEvent = s.dataset.e; st.si = 0; renderSection(); }); });
  }

  /* --- Макроанализ --- */
  function secModel(c) {
    var m = c.model;
    return pills(["Схема", "3D", "Обсудим"]) +
      '<div class="sub"><h3 class="mname">' + m.name + '</h3><div class="flow" id="flow">' + m.steps.map(function (s, i) { return '<div class="fstep' + (i === m.steps.length - 1 ? " crash" : "") + '"><span class="bd">' + (i + 1) + '</span>' + s + '</div>'; }).join("") + '</div><button class="btn small" id="replay">▶ Ещё раз</button> ' + chips(m.src) + '</div>' +
      '<div class="sub"><span class="pill">Упрощённая модель. Числа — сценарий, не прогноз.</span><div class="sim"><div class="st" id="simStage"></div><div id="simUI"></div></div></div>' +
      '<div class="sub">' + m.questions.map(function (q) { return '<div class="qcard">' + q + '</div>'; }).join("") + '<details><summary>Формула и калибровка</summary><div class="formula">' + m.formula + '</div><p>' + m.calib + '</p></details></div>';
  }
  function light() {
    var fl = $("#flow"), steps = panelBody.querySelectorAll(".fstep"); clearTimers();
    steps.forEach(function (s) { s.classList.remove("lit"); }); fl.style.setProperty("--p", "0%");
    steps.forEach(function (s, i) { later(function () { s.classList.add("lit"); fl.style.setProperty("--p", ((i + 1) / steps.length * 100) + "%"); }, 900 * (i + 1)); });
  }
  function afterModel(c) {
    var S_ = window.Sims[c.model.sim];
    subs(function (i) {
      disposeSim();
      if (i === 0) light();
      if (i === 1 && S_) { var ui = $("#simUI"); ui.innerHTML = ""; $("#simStage").innerHTML = ""; sim = S_.mount($("#simStage"), ui, { Charts: Charts, Sim3D: Sim3D, THREE: THREE, reduced: RED }); }
    });
    $("#replay").addEventListener("click", light);
  }

  /* --- Решения --- */
  function secSolutions(c) {
    return '<p>Нажмите «Плюсы и минусы».</p>' +
      c.solutions.map(function (s, i) {
        return '<div class="sol" data-s="' + i + '"><h4>' + s.t + '</h4><div>' + s.text + '</div><button class="btn small tgl">Плюсы и минусы</button><div class="sw"><div class="good"><b>Сильная:</b> ' + s.strong + '</div><div class="bad"><b>Слабая:</b> ' + s.weak + '</div></div><div>' + chips(s.src) + '</div></div>';
      }).join("");
  }
  function afterSolutions() { panelBody.querySelectorAll(".sol .tgl").forEach(function (b) { b.addEventListener("click", function () { b.closest(".sol").classList.toggle("on"); }); }); }

  /* --- Источники страны --- */
  function secSources(c) {
    var k = key(), list = S.filter(function (s) { return s.used_in.some(function (u) { return u.indexOf(k + "/") === 0; }); });
    return '<div class="filters" style="margin-bottom:8px"><button class="btn small on" data-o="all">все</button><button class="btn small" data-o="docs">docs</button><button class="btn small" data-o="web">web</button></div><div id="cs">' + srcItems(list) + '</div>' +
      '<p style="margin-top:14px"><button class="btn" id="toGlobe">🌍 Вернуться к глобусу</button> <button class="btn primary" id="toNext">' + (st.ci < 5 ? "Следующая страна: " + D.countries[D.order[st.ci + 1]].name + " →" : "Итоговый глобус →") + '</button></p>';
  }
  function srcItems(list) {
    return list.map(function (s) {
      return '<div class="src-item' + (srcFilter.hl === s.id ? " hl" : "") + '" id="si-' + s.id + '"><b>' + s.id + '</b> <span class="src o-' + s.origin + '">origin: ' + s.origin + '</span> ' + s.fact + '<br><i>' + s.value + '</i> · ' + s.date + '<br>' + s.publisher + ' · доступ ' + s.accessed + (s.url ? '<br><a href="' + s.url + '" target="_blank" rel="noopener">' + s.url + '</a>' : "") + (s.note ? '<br><span class="warn">⚠ ' + s.note + '</span>' : "") + '</div>';
    }).join("");
  }
  function afterSources(c) {
    var k = key();
    panelBody.querySelectorAll("[data-o]").forEach(function (b) {
      b.addEventListener("click", function () {
        panelBody.querySelectorAll("[data-o]").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on");
        var o = b.dataset.o;
        $("#cs").innerHTML = srcItems(S.filter(function (s) { return s.used_in.some(function (u) { return u.indexOf(k + "/") === 0; }) && (o === "all" || s.origin === o); }));
      });
    });
    $("#toGlobe").addEventListener("click", toGlobe); $("#toNext").addEventListener("click", next);
  }

  /* ---------- финал ---------- */
  function renderFinal() {
    disposeSim(); Charts.destroyAll(); clearTimers();
    document.documentElement.style.setProperty("--c", "#ff5d6c");
    $("#panelHead").innerHTML = '<h2>' + D.final.title + '</h2><p>Падение ВВП в 1998 г.</p>';
    tabs.innerHTML = "";
    var max = 14;
    var h = '<div class="bars">' + D.final.bars.map(function (k) {
      var c = D.countries[k], v = c.gdp1998;
      return '<button class="barrow" data-k="' + k + '"><span>' + c.name + '</span><span><div class="bar" style="width:' + Math.abs(v.value) / max * 100 + '%"></div></span><b>' + String(v.value).replace(".", ",") + '%</b></button><div class="alt" id="alt-' + k + '" hidden style="margin:0 0 6px 118px;font-size:13px;color:var(--mut)">' +
        (v.alt !== undefined ? 'Другая оценка: ' + String(v.alt).replace(".", ",") + '%. ' : 'Единственная оценка в источниках. ') + chips(v.src) + '</div>';
    }).join("") + '</div><h3>Общие выводы</h3><div class="cards3">' + D.final.cards.map(function (c) { return '<div class="sol"><h4>' + c.t + '</h4><div>' + c.text + '</div><div>' + chips(c.src) + '</div></div>'; }).join("") + '</div>' +
      '<h3>Вопросы для обсуждения</h3><ol class="qs">' + D.final.questions.map(function (q) { return '<li>' + q + '</li>'; }).join("") + '</ol>' +
      '<p><button class="btn" id="fGlobe">🌍 К глобусу</button> <button class="btn" id="fAgain">↺ Сначала</button></p>';
    panelBody.innerHTML = h; panelBody.scrollTop = 0; panelBody.classList.remove("fade"); void panelBody.offsetWidth; panelBody.classList.add("fade");
    panelBody.querySelectorAll(".barrow").forEach(function (b) { b.addEventListener("click", function () { var a = $("#alt-" + b.dataset.k); a.hidden = !a.hidden; }); });
    $("#fGlobe").addEventListener("click", toGlobe); $("#fAgain").addEventListener("click", function () { goCountry(0); });
    renderProgress();
  }

  /* ---------- переходы ---------- */
  function wide() { return window.innerWidth >= 900 && window.innerHeight >= 420; }
  function goCountry(i, si) {
    if (i < 0 || i > 5) return;
    var fromCountry = st.mode === "country" || st.mode === "final", w = wide();
    st.ci = i; st.si = si || 0; Globe.setBars(false); Globe.light(false);
    clearTimers(); if (window.Dash) Dash.unmount();
    setMode("country"); if (w) body.classList.add("dash");
    renderHead(); panelBody.innerHTML = "";
    var after = function () { if (w) Dash.mount(key()); else renderSection(); };
    if (w) { later(function () { Globe.focusOn(key(), after); }, fromCountry ? 0 : 150); }
    else if (fromCountry) { Globe.flyTo(key(), function () {}); later(renderSection, RED ? 0 : 900); }
    else { Globe.cam.updateProjectionMatrix(); later(function () { Globe.flyTo(key(), after); }, 800); }
    $("#btnNext").textContent = "Дальше →";
  }
  function toFinal() { if (window.Dash) Dash.unmount(); clearTimers(); disposeSim(); Charts.destroyAll(); setMode("final"); Globe.flyHome(true); Globe.setBars(true); Globe.light(true); renderFinal(); $("#btnNext").textContent = "Сначала ↺"; }
  function toGlobe() {
    if (window.Dash) Dash.unmount(); clearTimers(); disposeSim(); Charts.destroyAll(); setMode("globe"); Globe.setBars(false); Globe.light(false); Globe.flyHome();
    document.documentElement.style.setProperty("--c", "#ff6b4a"); renderProgress();
  }
  function next() {
    if (st.mode === "intro" || st.mode === "globe") return goCountry(0);
    if (st.mode === "final") return goCountry(0);
    if (body.classList.contains("dash")) { if (st.ci < 5) return goCountry(st.ci + 1); return toFinal(); }
    if (st.si < D.sections.length - 1) { st.si++; renderSection(); }
    else if (st.ci < 5) goCountry(st.ci + 1);
    else toFinal();
  }
  function prev() {
    if (st.mode === "final") return goCountry(5, 4);
    if (st.mode !== "country") return;
    if (body.classList.contains("dash")) { if (st.ci > 0) return goCountry(st.ci - 1); return toGlobe(); }
    if (st.si > 0) { st.si--; renderSection(); }
    else if (st.ci > 0) goCountry(st.ci - 1, 4);
    else toGlobe();
  }

  /* ---------- источники (модальное окно) ---------- */
  function openSources(hl) {
    srcFilter.hl = hl || null;
    srcFilter.f = (st.mode === "country" && !hl) ? "country" : "all";
    $("#modal").hidden = false; fillModal();
    if (hl) { var el = $("#si-" + hl); if (el) el.scrollIntoView({ block: "center" }); }
  }
  function fillModal() {
    var k = key();
    var list = S.filter(function (s) {
      var okC = srcFilter.f === "all" || st.mode !== "country" || s.used_in.some(function (u) { return u.indexOf(k + "/") === 0; });
      return okC && (srcFilter.o === "all" || s.origin === srcFilter.o);
    });
    $("#srcList").innerHTML = srcItems(list) || "<p>Нет источников.</p>";
    document.querySelectorAll("#modal [data-f]").forEach(function (b) { b.classList.toggle("on", b.dataset.f === srcFilter.f); });
    document.querySelectorAll("#modal [data-o]").forEach(function (b) { b.classList.toggle("on", b.dataset.o === srcFilter.o); });
  }

  /* ---------- события ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-sid]"); if (a) { e.preventDefault(); openSources(a.dataset.sid); }
  });
  document.querySelectorAll("#modal [data-f]").forEach(function (b) { b.addEventListener("click", function () { srcFilter.f = b.dataset.f; srcFilter.hl = null; fillModal(); }); });
  document.querySelectorAll("#modal [data-o]").forEach(function (b) { b.addEventListener("click", function () { srcFilter.o = b.dataset.o; fillModal(); }); });
  $("#modalClose").addEventListener("click", function () { $("#modal").hidden = true; });
  $("#modal").addEventListener("click", function (e) { if (e.target.id === "modal") $("#modal").hidden = true; });
  $("#btnSources").addEventListener("click", function () { openSources(); });
  $("#btnGlobe").addEventListener("click", toGlobe);
  $("#btnChips").addEventListener("click", function () { body.classList.toggle("show-src"); });
  $("#btnStart").addEventListener("click", function () { goCountry(0); });
  $("#btnExplore").addEventListener("click", function () { setMode("globe"); renderProgress(); });
  $("#btnNext").addEventListener("click", next);
  $("#btnPrev").addEventListener("click", prev);
  tabs.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && st.mode === "country") { st.si = +b.dataset.i; renderSection(); } });
  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input,select,textarea")) return;
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === "Escape") { if (!$("#modal").hidden) $("#modal").hidden = true; else toGlobe(); }
    else if (/^[1-6]$/.test(e.key)) goCountry(+e.key - 1);
  });

  /* ---------- глобус ---------- */
  Globe.init($("#globeCanvas"), $("#globeWrap"));
  $("#chips").innerHTML = D.order.map(function (k, i) { return '<button class="chip" data-i="' + i + '" style="border-color:' + D.countries[k].color + '">' + (i + 1) + ' ' + D.countries[k].name + '</button>'; }).join("") +
    '<button class="chip" id="chipFinal">Итог</button>';
  $("#chips").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return; if (b.id === "chipFinal") toFinal(); else goCountry(+b.dataset.i); });
  Globe.onPick = function (u) {
    var tip = $("#tip");
    if (u.main) { if (body.classList.contains("dash") && D.order[st.ci] === u.key && st.mode === "country") return; goCountry(D.order.indexOf(u.key)); return; }
    var x = D.extras[u.extra];
    tip.hidden = false; tip.innerHTML = '<b>' + x.name + '</b> (' + x.city + ')<br>' + D.extraNote + ' <button class="btn small" id="tipX">ок</button>';
    $("#tipX").addEventListener("click", function () { tip.hidden = true; });
  };
  renderProgress();
  window.AppUI = { go: goCountry, fin: toFinal, glob: toGlobe, tile: tile, animTiles: animTiles, chips: chips, photo: photo, cred: cred, numFT: numFT };
  window.__app = { st: st, goCountry: goCountry, next: next, prev: prev, toFinal: toFinal, toGlobe: toGlobe };
})();
