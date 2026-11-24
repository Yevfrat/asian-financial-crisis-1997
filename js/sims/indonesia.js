/* Индонезия: валютное несоответствие и дефляция долга — 3D-блоки баланса. Сценарий, не прогноз. */
window.Sims = window.Sims || {};
Sims.indonesia = {
  mount: function (stage, ui, ctx) {
    var T = THREE, s = ctx.Sim3D.create(stage, { ty: 1.5 }), g = new T.Group(); s.scene.add(g);
    function box(x, c, name) {
      var b = new T.Mesh(new T.BoxGeometry(1.1, 1, 1.1), new T.MeshPhongMaterial({ color: c })); b.position.x = x; g.add(b);
      var l = ctx.Sim3D.label(name); l.position.set(x, -.5, 1); g.add(l); return b;
    }
    var A = box(-3, 0x4ab0ff, "Активы"), D = box(-1, 0xff5d6c, "Долг в рупиях"), K = box(1, 0x27c2a5, "Капитал банка"), Y = box(3, 0xffd166, "Кредит→ВВП");
    var base = new T.Mesh(new T.BoxGeometry(8, .1, 2), new T.MeshPhongMaterial({ color: 0x1a2650 })); base.position.y = -.05; g.add(base);
    s.onFrame(function () { g.rotation.y = Math.sin(performance.now() / 4500) * .3; });

    SimUtil.row(ui, '<label>Падение рупии: <b id="dv">40</b>%</label><input type="range" id="dp" min="0" max="81" value="40">');
    var out = SimUtil.out(ui), chain = SimUtil.note(ui, "");
    SimUtil.note(ui, "Единицы условные: активы банка = 100, долг в $ = 70 (до падения). Максимум слайдера 81% — потеря рупии к началу 1998 г. (GAO, S-004). Механика — гипотетический пример скрипта (сл. 8).");
    function calc(dep) {
      var d0 = 70, A0 = 100, rate = 1 / (1 - dep / 100);          // курс в рупиях за $ растёт
      var Dr = d0 * rate, K0 = A0 - d0, Kn = Math.max(0, A0 - Dr), loan = Kn / K0 * 100;
      function sc(b, v, mx) { var h = Math.max(.04, Math.min(v / mx, 1.6) * 2.4); b.scale.y = h; b.position.y = h / 2; }
      sc(A, A0, 100); sc(D, Dr, 100); sc(K, Kn, 30); sc(Y, loan, 100);
      out([["Курс (раз к исходному)", "×" + SimUtil.f1(rate)], ["Долг в рупиях", SimUtil.f1(Dr)], ["Капитал банка", SimUtil.f1(Kn)], ["Кредит/ВВП (индекс)", SimUtil.f1(loan)]]);
      chain.textContent = Kn <= 0 ? "Капитал исчерпан → банк неплатёжеспособен → кредит и инвестиции схлопываются → ВВП падает (сценарий)." : "Курс ↑ → долг в рупиях ↑ → капитал ↓ → кредит ↓ → инвестиции ↓ → ВВП ↓ (сценарий).";
      s.render();
    }
    ui.querySelector("#dp").addEventListener("input", function (e) { ui.querySelector("#dv").textContent = e.target.value; calc(+e.target.value); });
    calc(40);
    return { dispose: function () { s.dispose(); } };
  }
};
