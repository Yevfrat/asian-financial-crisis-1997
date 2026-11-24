/* Chart.js 4.x: графики разделов «История» и простых линий для симуляторов. */
(function () {
  var live = [];
  window.Charts = {
    destroyAll: function () { live.forEach(function (c) { try { c.destroy(); } catch (e) {} }); live = []; },
    render: function (canvas, spec) {
      var bad = "#ff5d6c", ok = "#27c2a5", red = !!window.REDUCED;
      var cfg;
      if (spec.type === "line") {
        cfg = { type: "line", data: { labels: spec.labels, datasets: [{ label: spec.label || "", data: spec.data, borderColor: "#ffd166", backgroundColor: "#ffd166", pointRadius: 5, tension: 0,
          segment: { borderDash: function () { return spec.dashed ? [6, 5] : undefined; } } }] } };
      } else {
        cfg = { type: "bar", data: { labels: spec.labels, datasets: [{ data: spec.data, backgroundColor: spec.data.map(function (v) { return v < 0 ? bad : ok; }) }] } };
      }
      cfg.options = { responsive: true, maintainAspectRatio: false, animation: red ? false : { duration: 800 },
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { color: "#9aa6c8" }, grid: { color: "#26345e" } }, y: { ticks: { color: "#9aa6c8" }, grid: { color: "#26345e" } } } };
      var ch = new Chart(canvas.getContext("2d"), cfg); live.push(ch); return ch;
    },
    /* мини-график для симулятора: несколько линий */
    multi: function (canvas, labels, sets) {
      var ch = new Chart(canvas.getContext("2d"), { type: "line",
        data: { labels: labels, datasets: sets.map(function (s) { return { label: s.label, data: s.data, borderColor: s.color, backgroundColor: s.color, pointRadius: 0, borderWidth: 2, tension: .2, borderDash: s.dash || [] }; }) },
        options: { responsive: true, maintainAspectRatio: false, animation: false,
          plugins: { legend: { labels: { color: "#9aa6c8", boxWidth: 12 } } },
          scales: { x: { ticks: { color: "#9aa6c8", maxTicksLimit: 6 }, grid: { color: "#26345e" } }, y: { ticks: { color: "#9aa6c8" }, grid: { color: "#26345e" } } } } });
      live.push(ch); return ch;
    }
  };
  /* общие мелочи для симуляторов */
  window.SimUtil = {
    row: function (ui, html) { var d = document.createElement("div"); d.className = "ctrl"; d.innerHTML = html; ui.appendChild(d); return d; },
    out: function (ui) {
      var d = document.createElement("div"); d.className = "out"; ui.appendChild(d);
      return function (arr) { d.innerHTML = arr.map(function (a) { return "<div>" + a[0] + "<b>" + a[1] + "</b></div>"; }).join(""); };
    },
    note: function (ui, txt) {
      var p = document.createElement("p");
      if (txt === "") { p.className = "warn"; ui.appendChild(p); return p; }
      var d = ui.querySelector("details.how");
      if (!d) { d = document.createElement("details"); d.className = "how"; d.innerHTML = "<summary>Как это считается</summary>"; ui.appendChild(d); }
      p.textContent = txt; d.appendChild(p); return p;
    },
    cv: function (ui, h) { var w = document.createElement("div"); w.style.cssText = "height:" + (h || 150) + "px;margin-top:6px"; var c = document.createElement("canvas"); w.appendChild(c); ui.appendChild(w); return c; },
    mat: function (hex, op) { return new THREE.MeshPhongMaterial({ color: hex, transparent: op !== undefined, opacity: op === undefined ? 1 : op }); },
    f1: function (x) { return (Math.round(x * 10) / 10).toString().replace(".", ","); }
  };
})();
