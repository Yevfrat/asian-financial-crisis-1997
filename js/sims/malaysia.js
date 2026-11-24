/* Малайзия: внезапная остановка притока; свободный капитал vs контроль. Сценарий, не прогноз. */
window.Sims = window.Sims || {};
Sims.malaysia = {
  mount: function (stage, ui, ctx) {
    var T = THREE, s = ctx.Sim3D.create(stage, { ty: 1 }), g = new T.Group(); s.scene.add(g);
    var base = new T.Mesh(new T.BoxGeometry(7, .1, 3), new T.MeshPhongMaterial({ color: 0x1a2650 })); base.position.y = -.05; g.add(base);
    var defs = [["Отток (А)", 0xff5d6c, -2.4], ["Ринггит (А)", 0xffb02e, -1.2], ["Отток (Б)", 0x27c2a5, 1.2], ["Ринггит (Б)", 0x4ab0ff, 2.4]], bars = defs.map(function (d) {
      var b = new T.Mesh(new T.BoxGeometry(.9, 1, .9), new T.MeshPhongMaterial({ color: d[1] })); b.position.x = d[2]; g.add(b);
      var l = ctx.Sim3D.label(d[0]); l.position.set(d[2], -.5, 1.1); g.add(l); return b;
    });
    var pts = [], N = 60; for (var i = 0; i < N; i++) { var m = new T.Mesh(new T.SphereGeometry(.05, 6, 6), new T.MeshBasicMaterial({ color: i % 2 ? 0xff5d6c : 0x27c2a5 })); m.userData = { u: Math.random(), side: i % 2 }; g.add(m); pts.push(m); }
    s.onFrame(function (dt) {
      g.rotation.y = Math.sin(performance.now() / 4200) * .3;
      pts.forEach(function (p) { p.userData.u += dt * (p.userData.side ? .15 : .5); if (p.userData.u > 1) p.userData.u = 0; var u = p.userData.u, x = p.userData.side ? 1.8 : -1.8; p.position.set(x + (p.userData.side ? 0 : 0), .3 + u * 2.6, (p.userData.u * 7 % 1) - .5); });
    });

    SimUtil.row(ui, '<label>Интенсивность паники: <b id="pv">80</b>%</label><input type="range" id="pr" min="0" max="100" value="80">');
    SimUtil.row(ui, '<span>Слева А: свободный капитал · Справа Б: контроль с 1.09.1998</span>');
    var out = SimUtil.out(ui);
    SimUtil.note(ui, "Калибровка: при 100% в сценарии А ринггит ≈ −45% (первые полгода, S-009); в Б курс фиксирован 3,80 (S-036). Цена контроля — упущенный приток капитала (NBER, S-038); МВФ: ни крупных выгод, ни крупных издержек (S-037). Объёмы — условные единицы.");
    function calc() {
      var p = +ui.querySelector("#pr").value / 100; ui.querySelector("#pv").textContent = Math.round(p * 100);
      var outA = 100 * p * p, fxA = -45 * p, outB = 100 * p * .25, fxB = 0, missed = 20 * p;
      [[0, outA / 100], [1, Math.abs(fxA) / 45], [2, outB / 100], [3, Math.abs(fxB) / 45]].forEach(function (v) { var h = Math.max(.05, v[1] * 2.8); bars[v[0]].scale.y = h; bars[v[0]].position.y = h / 2; });
      out([["Отток А (усл.)", SimUtil.f1(outA)], ["Ринггит А, %", SimUtil.f1(fxA)], ["Отток Б (усл.)", SimUtil.f1(outB)], ["Ринггит Б, %", "0 (3,80)"], ["Упущ. приток Б (усл.)", SimUtil.f1(missed)]]);
      s.render();
    }
    ui.querySelector("#pr").addEventListener("input", calc); calc();
    return { dispose: function () { s.dispose(); } };
  }
};
