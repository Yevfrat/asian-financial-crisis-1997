/* Филиппины: плавающий курс, pass-through и ставка. Сценарий, не прогноз. */
window.Sims = window.Sims || {};
Sims.philippines = {
  mount: function (stage, ui, ctx) {
    var T = THREE, s = ctx.Sim3D.create(stage, { ty: 1 }), g = new T.Group(); s.scene.add(g);
    var names = ["Курс (падение)", "Цены импорта", "Инфляция", "Рост ВВП"], cols = [0x4ab0ff, 0xffd166, 0xff5d6c, 0x27c2a5], bars = [];
    var base = new T.Mesh(new T.BoxGeometry(7, .1, 3), new T.MeshPhongMaterial({ color: 0x1a2650 })); base.position.y = -.05; g.add(base);
    names.forEach(function (n, i) {
      var b = new T.Mesh(new T.CylinderGeometry(.5, .5, 1, 24), new T.MeshPhongMaterial({ color: cols[i] })); b.position.x = -2.4 + i * 1.6; g.add(b); bars.push(b);
      var l = ctx.Sim3D.label(n); l.position.set(-2.4 + i * 1.6, -.5, 1.1); g.add(l);
    });
    s.onFrame(function () { g.rotation.y = Math.sin(performance.now() / 4300) * .3; });
    var sc = "none";
    SimUtil.row(ui, '<label>Падение песо: <b id="fv">25</b>%</label><input type="range" id="fp" min="0" max="50" value="25">');
    SimUtil.row(ui, '<label>Доля переноса в цены θ: <b id="tv">30</b>%</label><input type="range" id="tp" min="0" max="80" value="30">');
    SimUtil.row(ui, '<button class="btn small on" data-sc="none">Сценарий 1: без реакции ставкой</button><button class="btn small" data-sc="hike">Сценарий 2: BSP повышает ставку</button>');
    var out = SimUtil.out(ui);
    SimUtil.note(ui, "Параметры θ и доли импорта (30%) — иллюстративные, не оценки. Качественная калибровка: песо плавает с 12.07.1997, BSP повышал ставки (S-052); итоговый спад ВВП 1998 ≈ −0,5% (S-023).");
    function calc() {
      var fx = +ui.querySelector("#fp").value / 100, th = +ui.querySelector("#tp").value / 100, imp = .3;
      var pi = fx * th * imp * 100, growth = 5 - fx * 12;           // условный рост
      if (sc === "hike") { pi *= .6; growth -= 2; }
      var vals = [fx / .5, fx * th * 100 / 20, pi / 10, Math.max(growth + 5, 0) / 10];
      bars.forEach(function (b, k) { var h = Math.max(.05, Math.min(vals[k], 1.5) * 2.4); b.scale.y = h; b.position.y = h / 2; });
      out([["Падение песо, %", SimUtil.f1(fx * 100)], ["Инфляция, п.п. (усл.)", SimUtil.f1(pi)], ["Рост ВВП, % (усл.)", SimUtil.f1(growth)]]);
      ui.querySelector("#fv").textContent = Math.round(fx * 100); ui.querySelector("#tv").textContent = Math.round(th * 100);
      s.render();
    }
    ui.querySelectorAll("input[type=range]").forEach(function (r) { r.addEventListener("input", calc); });
    ui.querySelectorAll("[data-sc]").forEach(function (b) { b.addEventListener("click", function () { sc = b.dataset.sc; ui.querySelectorAll("[data-sc]").forEach(function (x) { x.classList.toggle("on", x === b); }); calc(); }); });
    calc();
    return { dispose: function () { s.dispose(); } };
  }
};
