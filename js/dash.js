/* Панель-«дашборд» для широких экранов: карта страны с регионами в центре, вокруг — панели.
   Наведение мыши увеличивает панель, уход — возвращает. Всё связано единым временем 1997-06 … 1998-12. */
(function () {
  var D = window.DATA, RED = window.REDUCED, NM = 19;
  var MON = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var MONF = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var S = { k: null, t: 0, play: false, raf: 0, sim: null, regs: [], fx: null, flowI: 0, flowTimer: 0, cleanup: [] };
  window.Dash = { mounted: false, scale: 1 };
  /* дашборд рисуется в «виртуальном» кадре 1440×800 и масштабируется под окно */
  function layout() {
    var W = window.innerWidth, H = window.innerHeight - 54 - 60, s = Math.max(.4, Math.min(W / 1440, H / 800, 1.5));
    var left = (W - 1440 * s) / 2, top = 54 + (H - 800 * s) / 2, root = $("#dash"), st = document.documentElement.style;
    window.Dash.scale = s; root.style.left = left + "px"; root.style.top = top + "px"; root.style.transform = "scale(" + s + ")";
    st.setProperty("--gl", (left + .395 * 1440 * s) + "px"); st.setProperty("--gt", top + "px");
    st.setProperty("--gw", (.265 * 1440 * s) + "px"); st.setProperty("--gh", ((800 - 118) * s) + "px");
  }
  window.addEventListener("resize", function () { if (window.Dash.mounted) layout(); });

  function ym(s) { var p = s.split("-"); return (+p[0] - 1997) * 12 + (+p[1] - 6); }
  function mlab(i) { var m = (5 + i) % 12, y = 1997 + Math.floor((5 + i) / 12); return { s: MON[m] + " " + String(y).slice(2), f: MONF[m] + " " + y }; }
  function series(k) {
    var f = D.countries[k].fx, a = [], i;
    if (f.flat) { for (i = 0; i < NM; i++) a.push({ v: 0, a: true }); return a; }
    var an = f.anchors.map(function (x) { return [ym(x[0]), x[1]]; });
    for (i = 0; i < NM; i++) {
      var v = null, isA = an.some(function (x) { return x[0] === i; });
      if (i <= an[an.length - 1][0]) {
        var j = 0; while (j < an.length - 1 && an[j + 1][0] < i) j++;
        var p = an[j], q = an[Math.min(j + 1, an.length - 1)];
        v = i <= p[0] ? p[1] : p[1] + (q[1] - p[1]) * (i - p[0]) / (q[0] - p[0]);
      }
      a.push({ v: v, a: isA });
    }
    return a;
  }
  function valAt(ser, t) {
    var last = -1, i; for (i = 0; i < NM; i++) if (ser[i].v !== null) last = i;
    t = Math.max(0, Math.min(t, last)); var i0 = Math.floor(t), i1 = Math.min(i0 + 1, last);
    return ser[i0].v + (ser[i1].v - ser[i0].v) * (t - i0);
  }
  function stress(k, t) { return Math.min(Math.abs(valAt(S.ser[k], t)) / 60, 1); }
  function col(s) { return "hsl(" + Math.round(130 - 130 * s) + ",95%,52%)"; }
  function pct(v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(0) + "%"; }

  /* ---------- панели ---------- */
  var RECTS = {
    country: [1, 2, 25.5, 36, 1, 2, 48, 70], heroes: [1, 40, 25.5, 16, 1, 26, 58, 70], gdp: [1, 58, 25.5, 40, 1, 30, 60, 68],
    time: [27.5, 2, 11.5, 25, 27.5, 2, 34, 42], events: [27.5, 29, 11.5, 69, 27.5, 12, 36, 86],
    fx: [66, 2, 33, 22, 36, 2, 63, 56], sim: [66, 26, 33, 48, 36, 16, 63, 82], sol: [66, 76, 33, 22, 38, 30, 61, 68]
  };
  function panel(id, title, html) {
    var r = RECTS[id], st = "--l:" + r[0] + "%;--t:" + r[1] + "%;--w:" + r[2] + "%;--h:" + r[3] + "%;--el:" + r[4] + "%;--et:" + r[5] + "%;--ew:" + r[6] + "%;--eh:" + r[7] + "%";
    return '<section class="dp" id="dp-' + id + '" style="' + st + '"><h4>' + title + '</h4><div class="pb">' + html + '</div></section>';
  }

  function mount(k) {
    unmount(true);
    var c = D.countries[k], U = window.AppUI, ph = U.photo(k);
    S.k = k; S.t = 0; S.play = false;
    S.ser = {}; D.order.forEach(function (o) { S.ser[o] = series(o); });
    var root = $("#dash"); root.hidden = false; layout();
    var h = "";
    // 1 Страна
    h += panel("country", c.name, '<div class="banner dbn">' + (ph ? '<img class="bimg" src="' + ph.file + '" alt="">' : "") + '<div class="bn-in"><h3>' + c.city + '</h3></div>' + U.cred(k) + '</div>' +
      '<div class="tiles">' + c.tiles.map(U.tile).join("") + '</div>' +
      '<div class="ex"><table class="t">' + c.pre.rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + ' ' + U.chips(r[2]) + '</td></tr>'; }).join("") + '</table></div>');
    // 2 Время
    h += panel("time", "Время", '<div id="dDate" class="dDate">Июнь 1997</div><div class="dVal" id="dVal">0%</div><div class="dLab">курс к доллару</div>' +
      '<div class="dCtl"><button class="btn small" id="dPlay">▶</button><input type="range" id="dRange" min="0" max="' + (NM - 1) + '" step="0.02" value="0" aria-label="Время"></div>' +
      '<div class="ex"><p>' + c.fx.note + ' ' + U.chips(c.fx.src) + '</p></div>');
    // 3 События
    h += panel("events", "События", '<div class="tl dtl">' + c.timeline.map(function (e, i) {
      return '<div class="tl-item" style="--i:' + i + '" data-e="' + e.id + '"' + (e.ym ? ' data-ym="' + e.ym + '"' : "") + '><button class="dot" aria-label="' + e.date + '"></button><button class="tl-btn"><div class="tl-date">' + e.date + '</div><div class="tl-title">' + e.title + '</div></button>' +
        '<div class="tl-card ex">' + (e.metric ? '<div class="num" data-v="' + e.metric.value + '" data-d="' + e.metric.dec + '">0</div><div class="numl">' + e.metric.label + '</div>' : "") + '<div>' + e.text + '</div><div>' + U.chips(e.src) + '</div></div></div>';
    }).join("") + '</div>');
    // 4 Герои
    h += panel("heroes", "Герои", '<div class="heroes">' + c.heroes.map(function (p, i) {
      var pp = p.photo && U.photo(p.photo);
      return '<button class="hero" data-h="' + i + '" style="--hc:' + p.color + '"><div class="pf">' + (pp ? '<img src="' + pp.file + '" alt="' + p.name + '" onerror="this.remove()">' : "") + '<span' + (pp ? ' style="display:none"' : "") + '>' + p.initials + '</span></div>' + (pp ? U.cred(p.photo) : "") + '<b>' + p.name + '</b><small>' + p.role + '</small>' +
        '<div class="more"><p><b>Что сделал?</b><br>' + p.did + '</p><p><b>Решение:</b><br>' + p.decision + '</p></div></button>';
    }).join("") + '</div>');
    // 5 ВВП
    h += panel("gdp", "Экономика", c.charts.map(function (ch, i) { return '<div class="dch"><canvas data-ch="' + i + '"></canvas></div>'; }).join(""));
    // 6 Курс
    h += panel("fx", "Курс к доллару, 1997–1998", '<div class="fxw"><canvas id="fxc"></canvas></div><div class="ex fxnote">Нажмите и ведите по графику. Пунктир — промежуточные значения (интерполяция). ' + U.chips(c.fx.src) + '</div>');
    // 7 3D
    h += panel("sim", "3D · " + c.model.name, '<div class="st" id="simStage"></div><div class="simui"><span class="pill">Упрощённая модель. Числа — сценарий, не прогноз.</span><div id="simUI"></div></div>');
    // 8 Решения
    h += panel("sol", "Решения сегодня", c.solutions.map(function (s) {
      return '<div class="sol"><h4>' + s.t + '</h4><div class="ex"><div>' + s.text + '</div><div class="sw" style="display:grid"><div class="good"><b>＋</b> ' + s.strong + '</div><div class="bad"><b>−</b> ' + s.weak + '</div></div><div>' + U.chips(s.src) + '</div></div></div>';
    }).join(""));
    // центр: карта регионов + схема
    h += '<div class="gTop" id="gTop"><div id="gChips">' + D.order.map(function (o, i) { return '<button class="chip' + (o === k ? " on" : "") + '" data-i="' + i + '" title="' + D.countries[o].name + '" style="border-color:' + D.countries[o].color + '">' + (i + 1) + '</button>'; }).join("") + '<button class="chip" data-i="f" title="Итог">Итог</button></div><div class="rgLeg"><span>норма</span><i></i><span>сильный спад курса</span></div></div><div id="rgTip" class="rgTip" hidden></div><div id="flowStrip"></div>';
    root.innerHTML = h;
    buildRegions(k); buildFlow(c);
    wire(c);
    window.Dash.mounted = true;
    setT(0);
    if (!RED) setTimeout(function () { play(true); }, 900); else setT(NM - 1);
  }

  function unmount(keep) {
    cancelAnimationFrame(S.raf); clearInterval(S.flowTimer); S.play = false;
    if (S.sim && S.sim.dispose) S.sim.dispose(); S.sim = null;
    window.Charts && Charts.destroyAll();
    if (window.Globe && Globe.clearRegions) { Globe.clearRegions(); Globe.onRegionHover = null; }
    var root = $("#dash"); if (!keep) root.hidden = true; root.innerHTML = "";
    window.Dash.mounted = false;
  }

  /* ---------- регионы на самом глобусе ---------- */
  function buildRegions(k) {
    var R = (window.REGIONS || {})[k] || [], c = D.countries[k];
    function inR(r, lon, lat) { var cc = false, a, b; for (a = 0, b = r.length - 2; a < r.length; b = a, a += 2) { var xi = r[a], yi = r[a + 1], xj = r[b], yj = r[b + 1]; if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) cc = !cc; } return cc; }
    var cap = -1, maxd = 0, bb = 1e9;
    R.forEach(function (g, i) { if (g.r.some(function (r) { return inR(r, c.lon, c.lat); })) cap = i; g.d = Math.hypot(g.c[0] - c.lon, g.c[1] - c.lat); maxd = Math.max(maxd, g.d); });
    if (cap < 0) R.forEach(function (g, i) { if (g.d < bb) { bb = g.d; cap = i; } });
    S.regs = R.map(function (g, i) { return { n: g.n, d: g.d / (maxd || 1), cap: i === cap }; });
    Globe.showRegions(R, cap);
    Globe.onRegionHover = function (i, e) {
      var tip = $("#rgTip"); if (!tip) return;
      if (i < 0) { tip.hidden = true; return; }
      var box = $("#dash").getBoundingClientRect(); tip.hidden = false;
      var sc = window.Dash.scale || 1; tip.style.left = ((e.clientX - box.left) / sc + 14) + "px"; tip.style.top = ((e.clientY - box.top) / sc + 14) + "px";
      tip.innerHTML = "<b>" + S.regs[i].n + "</b><br>" + pct(valAt(S.ser[S.k], S.t) * (1 - .45 * S.regs[i].d)) + " <small>(иллюстрация)</small>";
    };
    $("#gChips").addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return; if (b.dataset.i === "f") window.AppUI.fin(); else window.AppUI.go(+b.dataset.i); });
  }
  function paintRegions() {
    Globe.setRegionHues(S.regs.map(function (r) { return Math.round(130 - 130 * stress(S.k, Math.max(0, S.t - 1.6 * r.d)) * (1 - .45 * r.d)); }));
  }

  /* ---------- схема механизма (в центре внизу) ---------- */
  function buildFlow(c) {
    var st = c.model.steps;
    $("#flowStrip").innerHTML = '<div class="fbs">' + st.map(function (s, i) { return '<button class="fb" data-i="' + i + '">' + (i + 1) + '</button>'; }).join("") + '</div><div class="ftx" id="ftx"></div>';
    function act(i) { S.flowI = i; document.querySelectorAll("#flowStrip .fb").forEach(function (b, j) { b.classList.toggle("lit", j <= i); b.classList.toggle("now", j === i); }); $("#ftx").textContent = st[i]; $("#ftx").classList.toggle("crash", i === st.length - 1); }
    act(0);
    document.querySelectorAll("#flowStrip .fb").forEach(function (b) { b.addEventListener("click", function () { act(+b.dataset.i); }); });
    if (!RED) S.flowTimer = setInterval(function () { act((S.flowI + 1) % st.length); }, 2200);
  }

  /* ---------- график курса (canvas) ---------- */
  function drawFx() {
    var cv = $("#fxc"); if (!cv) return;
    var par = cv.parentNode, w = par.clientWidth, h = par.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!w || !h) return;
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px"; }
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    var L = 44, R = 14, T = 12, B = 24, YMIN = -90, YMAX = 5;
    function X(i) { return L + (w - L - R) * i / (NM - 1); } function Y(v) { return T + (h - T - B) * (YMAX - v) / (YMAX - YMIN); }
    g.font = "12px system-ui"; g.fillStyle = "#a9b8ea"; g.strokeStyle = "#1d2b66"; g.lineWidth = 1;
    [0, -30, -60, -90].forEach(function (v) { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(w - R, Y(v)); g.stroke(); g.textAlign = "right"; g.fillText(v + "%", L - 6, Y(v) + 4); });
    g.textAlign = "center"; [0, 3, 6, 9, 12, 15, 18].forEach(function (i) { g.fillText(mlab(i).s, X(i), h - 6); });
    // события
    document.querySelectorAll("#dp-events [data-ym]").forEach(function (el) { var i = ym(el.dataset.ym); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(X(i) - 1, T, 2, h - T - B); });
    // чужие линии
    D.order.forEach(function (o) { if (o === S.k) return; drawLine(g, S.ser[o], D.countries[o].color, .28, 1.5, X, Y, false); });
    drawLine(g, S.ser[S.k], D.countries[S.k].color, 1, 3.4, X, Y, true);
    // курсор
    g.strokeStyle = "#fff"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(S.t), T); g.lineTo(X(S.t), h - B); g.stroke();
  }
  function drawLine(g, ser, color, alpha, lw, X, Y, glow) {
    g.save(); g.strokeStyle = color; g.globalAlpha = alpha; g.lineWidth = lw; g.lineJoin = "round";
    if (glow) { g.shadowColor = color; g.shadowBlur = 14; }
    var i, lastPt = null;
    for (i = 0; i < NM - 1; i++) {
      var a = ser[i], b = ser[i + 1]; if (a.v === null || b.v === null || i > S.t) break;
      var f = Math.min(1, S.t - i), bv = a.v + (b.v - a.v) * f;
      g.setLineDash(a.a && b.a || (ser === S.ser[S.k] && false) ? [] : [7, 6]);
      g.beginPath(); g.moveTo(X(i), Y(a.v)); g.lineTo(X(i + f), Y(bv)); g.stroke(); lastPt = [X(i + f), Y(bv), bv];
    }
    g.setLineDash([]); g.shadowBlur = 0;
    if (glow && lastPt) {
      g.globalAlpha = 1; g.fillStyle = color; g.beginPath(); g.arc(lastPt[0], lastPt[1], 6, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.font = "bold 16px system-ui"; g.textAlign = "left"; g.fillText(pct(lastPt[2]), Math.min(lastPt[0] + 10, X(NM - 1) - 36), lastPt[1] - 10);
    }
    g.restore();
  }

  /* ---------- время ---------- */
  function setT(t, fromRange) {
    S.t = Math.max(0, Math.min(NM - 1, t));
    var i = Math.floor(S.t + .0001), ml = mlab(i);
    var dd = $("#dDate"); if (!dd) return;
    dd.textContent = ml.f; var v = valAt(S.ser[S.k], S.t), last = lastIdx(S.ser[S.k]);
    var el = $("#dVal"); el.textContent = pct(v); el.style.color = col(Math.min(Math.abs(v) / 60, 1));
    $("#dLabX") && 0;
    if (!fromRange) $("#dRange").value = S.t;
    paintRegions(); drawFx();
    document.querySelectorAll("#dp-events [data-ym]").forEach(function (e) { e.classList.toggle("now", Math.abs(ym(e.dataset.ym) - S.t) < .5); });
  }
  function lastIdx(ser) { var l = 0; ser.forEach(function (x, i) { if (x.v !== null) l = i; }); return l; }
  function play(on) {
    S.play = on; $("#dPlay").textContent = on ? "❚❚" : "▶"; cancelAnimationFrame(S.raf);
    if (!on) return;
    if (S.t >= NM - 1) S.t = 0;
    var last = performance.now();
    (function f(now) { var dt = (now - last) / 1000; last = now; setT(S.t + dt * 1.25);
      if (S.t >= NM - 1) { play(false); return; } S.raf = requestAnimationFrame(f); })(last);
  }

  /* ---------- связи, события ---------- */
  function wire(c) {
    var U = window.AppUI;
    $("#dPlay").addEventListener("click", function () { play(!S.play); });
    $("#dRange").addEventListener("input", function (e) { play(false); setT(+e.target.value, true); });
    // график курса: клик/перетаскивание
    var cv = $("#fxc"), drag = false;
    function scrub(e) { var r = cv.getBoundingClientRect(), x = (e.clientX - r.left - 44) / (r.width - 58); play(false); setT(Math.max(0, Math.min(1, x)) * (NM - 1)); }
    cv.addEventListener("pointerdown", function (e) { drag = true; cv.setPointerCapture(e.pointerId); scrub(e); });
    cv.addEventListener("pointermove", function (e) { if (drag) scrub(e); });
    cv.addEventListener("pointerup", function () { drag = false; });
    new ResizeObserver(drawFx).observe(cv.parentNode);
    // события
    document.querySelectorAll("#dp-events .tl-item").forEach(function (it) {
      it.querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () {
        document.querySelectorAll("#dp-events .tl-item").forEach(function (x) { x.classList.remove("on"); }); it.classList.add("on");
        var n = it.querySelector(".num"); if (n) U.numFT(n, 0, +n.dataset.v, +n.dataset.d);
        if (it.dataset.ym) { play(false); setT(ym(it.dataset.ym)); }
        Globe.nudge();
      }); });
    });
    // герои → подсветка событий
    document.querySelectorAll("#dp-heroes .hero").forEach(function (b) {
      b.addEventListener("click", function (ev) {
        if (ev.target.closest(".cr")) return;
        var on = b.classList.contains("on");
        document.querySelectorAll("#dp-heroes .hero").forEach(function (x) { x.classList.remove("on"); });
        document.querySelectorAll("#dp-events .tl-item").forEach(function (t) { t.classList.remove("mark"); });
        if (!on) { b.classList.add("on"); var evs = c.heroes[+b.dataset.h].events; document.querySelectorAll("#dp-events .tl-item").forEach(function (t) { if (evs.indexOf(t.dataset.e) >= 0) t.classList.add("mark"); });
          var first = c.timeline.filter(function (e) { return evs.indexOf(e.id) >= 0 && e.ym; })[0]; if (first) { play(false); setT(ym(first.ym)); } }
      });
    });
    // решения: клик — закрепить раскрытие
    document.querySelectorAll("#dp-sol .sol").forEach(function (s) { s.addEventListener("click", function () { s.classList.toggle("on"); }); });
    // тайлы и графики
    U.animTiles(c, $("#dp-country"));
    var charts = document.querySelectorAll("#dp-gdp canvas");
    charts.forEach(function (cv2) { Charts.render(cv2, c.charts[+cv2.dataset.ch]); });
    // 3D
    var Sm = window.Sims[c.model.sim];
    if (Sm) S.sim = Sm.mount($("#simStage"), $("#simUI"), { Charts: Charts, Sim3D: Sim3D, THREE: THREE, reduced: RED });
    // тач-устройства: нажатие раскрывает панель
    if (window.matchMedia("(hover:none)").matches) document.querySelectorAll(".dp h4").forEach(function (h4) { h4.addEventListener("click", function () { var p = h4.parentNode, o = p.classList.contains("open"); document.querySelectorAll(".dp").forEach(function (x) { x.classList.remove("open"); }); if (!o) p.classList.add("open"); }); });
  }

  window.Dash.mount = mount; window.Dash.unmount = function () { unmount(false); };
})();
