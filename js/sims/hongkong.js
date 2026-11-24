/* Гонконг: валютный совет — два сценария (сохранить привязку / отпустить). Сценарий, не прогноз. */
window.Sims = window.Sims || {};
Sims.hongkong = {
  mount: function (stage, ui, ctx) {
    var T = THREE, s = ctx.Sim3D.create(stage, { ty: 1 }), g = new T.Group(); s.scene.add(g);
    var sc = "peg", press = 70, bars = [], lab = ["Ставка", "ВВП (спад)", "Безработица*", "Курс HK$"], cols = [0xffd166, 0xff5d6c, 0x9a7bff, 0x4ab0ff], i;
    var floor = new T.Mesh(new T.BoxGeometry(7, .1, 3), new T.MeshPhongMaterial({ color: 0x1a2650 })); floor.position.y = -.05; g.add(floor);
    for (i = 0; i < 4; i++) {
      var b = new T.Mesh(new T.BoxGeometry(.9, 1, .9), new T.MeshPhongMaterial({ color: cols[i] })); b.position.x = -2.4 + i * 1.6; g.add(b); bars.push(b);
      var l = ctx.Sim3D.label(lab[i]); l.position.set(-2.4 + i * 1.6, -.55, 1.1); g.add(l);
    }
    s.onFrame(function (dt) { g.rotation.y = Math.sin(performance.now() / 4000) * .35; });

    SimUtil.row(ui, '<button class="btn small on" data-sc="peg">Сценарий А: сохранить привязку</button><button class="btn small" data-sc="float">Сценарий Б: отпустить курс</button>');
    SimUtil.row(ui, '<label>Давление спекулянтов: <b id="pv">70</b>% </label><input type="range" min="0" max="100" value="70" id="pr">');
    var out = SimUtil.out(ui);
    SimUtil.note(ui, "Калибровка: при давлении 100% в сценарии А ставка овернайт ≈ 250% (S-018), ВВП ≈ −5,1…−5,9% (S-025, S-026). *Безработица — условный индекс 0–100, не данные. Параметры сценария Б (отпустить курс) — условные, без эмпирической калибровки.");

    function calc() {
      var p = press / 100, r;
      if (sc === "peg") r = { rate: 5 + 245 * p * p, gdp: -5.1 * p, un: 20 + 60 * p, fx: 0 };      // курс HK$ неизменен
      else r = { rate: 5 + 25 * p, gdp: -3 * p, un: 20 + 35 * p, fx: -35 * p };                     // условные параметры
      var vals = [r.rate / 250, Math.abs(r.gdp) / 5.9, r.un / 100, Math.abs(r.fx) / 35];
      bars.forEach(function (b, k) { var h = Math.max(.05, vals[k] * 3); b.scale.y = h; b.position.y = h / 2; });
      out([["Ставка овернайт, %", SimUtil.f1(r.rate)], ["ВВП, % (сценарий)", SimUtil.f1(r.gdp)], ["Безработица (усл.)", SimUtil.f1(r.un)], ["Курс HK$, % (сценарий)", SimUtil.f1(r.fx)]]);
      s.render();
    }
    ui.querySelectorAll("[data-sc]").forEach(function (b) { b.addEventListener("click", function () { sc = b.dataset.sc; ui.querySelectorAll("[data-sc]").forEach(function (x) { x.classList.toggle("on", x === b); }); calc(); }); });
    ui.querySelector("#pr").addEventListener("input", function (e) { press = +e.target.value; ui.querySelector("#pv").textContent = press; calc(); });
    calc();
    return { dispose: function () { s.dispose(); } };
  }
};
