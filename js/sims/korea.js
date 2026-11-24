/* Южная Корея: сеть чеболей и банков — контагион. Сценарий, не прогноз. */
window.Sims = window.Sims || {};
Sims.korea = {
  mount: function (stage, ui, ctx) {
    var T = THREE, s = ctx.Sim3D.create(stage, { ty: 0 }), g = new T.Group(); s.scene.add(g);
    var N = 9, pos = [], nodes = [], i, j, adj = [];
    for (i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2, r = i === 0 ? 0 : 2.1;
      pos.push(new T.Vector3(i === 0 ? 0 : Math.cos(a) * r, (i % 3 - 1) * .5, i === 0 ? 0 : Math.sin(a) * r));
      var m = new T.Mesh(new T.SphereGeometry(i === 0 ? .42 : .3, 20, 20), new T.MeshPhongMaterial({ color: 0x4ab0ff })); m.position.copy(pos[i]); g.add(m); nodes.push(m); adj.push([]);
    }
    var links = [];
    function link(a, b) { adj[a].push(b); adj[b].push(a); var ln = new T.Line(new T.BufferGeometry().setFromPoints([pos[a], pos[b]]), new T.LineBasicMaterial({ color: 0x5568a0 })); g.add(ln); links.push(ln); }
    for (i = 1; i < N; i++) { link(0, i); link(i, i % (N - 1) + 1); }
    s.onFrame(function (dt) { g.rotation.y += dt * .2; });

    var start = 1, de = 400;
    SimUtil.row(ui, '<label>Долг/капитал (D/E): <b id="dv">400</b>%</label><input type="range" id="de" min="200" max="400" step="50" value="400">');
    SimUtil.row(ui, '<label>Первый упавший узел: <select id="st">' + [1, 2, 3, 4, 5, 6, 7, 8].map(function (k) { return '<option value="' + k + '">чеболь ' + k + '</option>'; }).join("") + '<option value="0">банк-центр</option></select></label><button class="btn small" id="go">▶ Запустить</button>');
    var out = SimUtil.out(ui);
    SimUtil.note(ui, "Калибровка: D/E 30 крупнейших чеболей ≈ 400% (конец 1996), цель 200% к концу 1999 (S-043). Правило: узел падает, если потери соседей > буфера 1/(1+D/E); доля передачи потерь — иллюстративная (0,35).");
    var timer = null;
    function color(failed) { nodes.forEach(function (m, k) { m.material.color.setHex(failed.indexOf(k) >= 0 ? 0xff5d6c : (k === 0 ? 0x9a7bff : 0x4ab0ff)); }); }
    function sim() {
      var buf = 1 / (1 + de / 100), loss = nodes.map(function () { return 0; }), failed = [+ui.querySelector("#st").value], waves = [[+ui.querySelector("#st").value]];
      var frontier = failed.slice(), w = .35;
      while (frontier.length) {
        var nf = [];
        frontier.forEach(function (f) { adj[f].forEach(function (nb) { if (failed.indexOf(nb) < 0) { loss[nb] += w * (1 - buf); } }); });
        // учитываем накопленные потери: падает, если потери > буфера * 0.6 (нормировка порога)
        for (var k = 0; k < N; k++) if (failed.indexOf(k) < 0 && loss[k] > buf * .6 * (k === 0 ? 1.5 : 1)) { nf.push(k); }
        nf.forEach(function (k) { failed.push(k); }); if (nf.length) waves.push(nf); frontier = nf;
      }
      return { failed: failed, waves: waves, buf: buf };
    }
    function show() {
      de = +ui.querySelector("#de").value; ui.querySelector("#dv").textContent = de;
      var r = sim(); color([]); s.render();
      out([["Буфер капитала", SimUtil.f1(r.buf * 100) + "%"], ["Упадёт узлов (из 9)", r.failed.length], ["Волн", r.waves.length]]);
      return r;
    }
    function play() {
      var r = show(), k = 0, shown = []; clearInterval(timer);
      if (window.REDUCED) { color(r.failed); s.render(); return; }
      timer = setInterval(function () { if (k >= r.waves.length) { clearInterval(timer); return; } shown = shown.concat(r.waves[k++]); color(shown); }, 650);
    }
    ui.querySelector("#de").addEventListener("input", show); ui.querySelector("#st").addEventListener("change", show);
    ui.querySelector("#go").addEventListener("click", play);
    show(); play();
    return { dispose: function () { clearInterval(timer); s.dispose(); } };
  }
};
