/* Таиланд: «невозможная троица» — 3D-тетраэдр. Сценарий, не прогноз. */
window.Sims = window.Sims || {};
Sims.thailand = {
  mount: function (stage, ui, ctx) {
    var T = THREE, s = ctx.Sim3D.create(stage, { ty: 1.2 }), g = new T.Group(); s.scene.add(g);
    var V = [new T.Vector3(-1.9, 0, 1.2), new T.Vector3(1.9, 0, 1.2), new T.Vector3(0, 0, -2), new T.Vector3(0, 3, 0)];
    var names = ["Фикс. курс", "Своб. капитал", "Своя ден. политика", "КРИЗИС"], sel = [true, true, true];
    var sph = V.map(function (v, i) {
      var m = new T.Mesh(new T.SphereGeometry(i === 3 ? .3 : .24, 20, 20), new T.MeshPhongMaterial({ color: 0x556 })); m.position.copy(v); g.add(m);
      var l = ctx.Sim3D.label(names[i]); l.position.copy(v).add(new T.Vector3(0, i === 3 ? .55 : -.5, 0)); g.add(l); return m;
    });
    var pairs = [[0, 1], [0, 2], [1, 2], [3, 0], [3, 1], [3, 2]], edges = pairs.map(function (p) {
      var geo = new T.BufferGeometry().setFromPoints([V[p[0]], V[p[1]]]), ln = new T.Line(geo, new T.LineBasicMaterial({ color: 0x445 })); g.add(ln); return ln;
    });
    var faceMat = new T.MeshBasicMaterial({ color: 0xff5d6c, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false });
    var face = new T.Mesh(new T.BufferGeometry().setFromPoints([V[3], V[0], V[1], V[3], V[1], V[2], V[3], V[2], V[0]]), faceMat); g.add(face);
    s.onFrame(function (dt, t) { g.rotation.y += dt * .25; sph[3].scale.setScalar(sel[0] && sel[1] && sel[2] ? 1 + .15 * Math.sin(t * 6) : 1); });

    SimUtil.row(ui, '<b>Выберите цели политики:</b>' + names.slice(0, 3).map(function (n, i) { return '<label><input type="checkbox" data-i="' + i + '" checked> ' + n + '</label>'; }).join(""));
    var info = SimUtil.note(ui, ""), out = SimUtil.out(ui);
    var labels = ["Ноя 96", "Дек", "Янв 97", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт"];
    var ch = ["Резервы, млрд $", "Ставка, индекс (усл.)", "Курс бата, индекс 100 = до 2.07.1997"].map(function (t, i) {
      var c = ui.appendChild(document.createElement("div")); c.style.cssText = "height:130px;margin-top:6px"; var cv = document.createElement("canvas"); c.appendChild(cv);
      return ctx.Charts.multi(cv, labels, [{ label: t, data: [], color: ["#27c2a5", "#ffd166", "#ff6b4a"][i] }]);
    });
    function run() {
      var n = sel.filter(Boolean).length, all = n === 3, R = [], I = [], E = [], k = Math.log(39) / 8, t;
      for (t = 0; t < 12; t++) {
        if (all) { R.push(t <= 8 ? 39 * Math.exp(-k * t) : 1); I.push(100 + .8 * (39 - R[t])); E.push(t >= 8 ? 80 : 100); }
        else if (sel[0] && sel[1]) { R.push(39); I.push(100); E.push(100); }
        else if (sel[0] && sel[2]) { R.push(39); I.push(90); E.push(100); }
        else if (sel[1] && sel[2]) { R.push(39); I.push(95); E.push(t >= 8 ? 80 : 100); }
        else { R.push(39); I.push(100); E.push(100); }
      }
      [R, I, E].forEach(function (d, i) { ch[i].data.datasets[0].data = d; ch[i].update("none"); });
      info.textContent = all ? "Все три цели сразу невозможны: резервы 39 → ≈1 млрд $ (S-001), затем отказ от привязки 2.07.1997 и бат ≈ −20% (S-002). Сценарий." :
        n === 2 ? "Две цели совместимы: отказ от третьей снимает давление на резервы. Сценарий." : "Выберите минимум две цели.";
      out([["Резервы, мин., млрд $", SimUtil.f1(Math.min.apply(null, R))], ["Ставка, макс. (усл.)", SimUtil.f1(Math.max.apply(null, I))], ["Курс, мин.", SimUtil.f1(Math.min.apply(null, E))]]);
      V.forEach(function (_, i) { if (i < 3) sph[i].material.color.setHex(sel[i] ? 0x27c2a5 : 0x556); });
      sph[3].material.color.setHex(all ? 0xff5d6c : 0x334);
      pairs.forEach(function (p, i) {
        var c = 0x445;
        if (i < 3) c = all ? 0xff5d6c : (sel[p[0]] && sel[p[1]] ? 0x27c2a5 : 0x445); else c = all ? 0xff5d6c : 0x223;
        edges[i].material.color.setHex(c);
      });
      faceMat.opacity = all ? .18 : 0; s.render();
    }
    ui.querySelectorAll("input[type=checkbox]").forEach(function (c) { c.addEventListener("change", function () { sel[+c.dataset.i] = c.checked; run(); }); });
    run();
    return { dispose: function () { s.dispose(); } };
  }
};
