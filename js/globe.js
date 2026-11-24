/* Глобус (Three.js r128) + общий помощник Sim3D для симуляторов. */
(function () {
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOBILE = Math.min(window.innerWidth, 900) < 700;
  var PR = Math.min(window.devicePixelRatio || 1, 2);
  window.REDUCED = REDUCED;

  function ll(lat, lon, r) {
    var p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
  }
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  var G = { cities: {}, picks: [], bars: [], labels: [], arcLines: [], extraM: [], onPick: null, fly: null, cur: null };
  window.Globe = G;

  G.init = function (canvas, wrap) {
    var D = window.DATA;
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(45, 1, .1, 100);
    cam.position.copy(ll(18, 112, 3.4));
    var rn = new THREE.WebGLRenderer({ canvas: canvas, antialias: !MOBILE, alpha: true });
    rn.setPixelRatio(PR);
    G.scene = scene; G.cam = cam; G.rn = rn; G.wrap = wrap;

    scene.add(new THREE.AmbientLight(0x8899cc, .9));
    var dl = new THREE.DirectionalLight(0xffffff, .9); dl.position.set(3, 2, 4); scene.add(dl);

    var globe = new THREE.Group(); scene.add(globe); G.globe = globe;
    // карта на сфере: холст (equirectangular) с неоновыми контурами
    var MW = MOBILE ? 1024 : 2048, MH = MW / 2, mc = document.createElement("canvas"); mc.width = MW; mc.height = MH;
    var mx = mc.getContext("2d"), mtex = new THREE.CanvasTexture(mc); mtex.anisotropy = 4;
    function X(lon) { return (lon + 180) / 360 * MW; } function Y(lat) { return (90 - lat) / 180 * MH; }
    function path(r) { mx.beginPath(); for (var q = 0; q < r.length; q += 2) { if (q) mx.lineTo(X(r[q]), Y(r[q + 1])); else mx.moveTo(X(r[q]), Y(r[q + 1])); } mx.closePath(); }
    G.paint = function (active) {
      var GEO = window.GEO; if (!GEO) return;
      mx.shadowBlur = 0; mx.globalAlpha = 1; mx.fillStyle = "#050816"; mx.fillRect(0, 0, MW, MH);
      mx.strokeStyle = "rgba(0,229,255,.10)"; mx.lineWidth = 1;
      for (var a = -150; a <= 150; a += 30) { mx.beginPath(); mx.moveTo(X(a), 0); mx.lineTo(X(a), MH); mx.stroke(); }
      for (var b = -60; b <= 60; b += 30) { mx.beginPath(); mx.moveTo(0, Y(b)); mx.lineTo(MW, Y(b)); mx.stroke(); }
      mx.lineJoin = "round";
      GEO.world.forEach(function (r) { path(r); mx.fillStyle = "#0a1230"; mx.fill(); mx.strokeStyle = "rgba(110,150,255,.40)"; mx.lineWidth = 1.2; mx.stroke(); });
      for (var e = 0; e < 7; e++) (GEO.detail["x" + e] || []).forEach(function (r) { path(r); mx.fillStyle = "#18244f"; mx.fill(); mx.strokeStyle = "rgba(160,175,220,.7)"; mx.lineWidth = 1.5; mx.stroke(); });
      window.DATA.order.forEach(function (k) {
        var col = window.DATA.countries[k].color, on = active === k;
        (GEO.detail[k] || []).forEach(function (r) {
          path(r); mx.shadowColor = col; mx.shadowBlur = on ? 34 : 16;
          mx.globalAlpha = on ? .6 : .32; mx.fillStyle = col; mx.fill();
          mx.globalAlpha = 1; mx.strokeStyle = col; mx.lineWidth = on ? 4 : 2.5; mx.stroke();
        });
      });
      mx.shadowBlur = 0; mx.globalAlpha = 1; mtex.needsUpdate = true;
    };
    var earth = new THREE.Mesh(new THREE.SphereGeometry(1, MOBILE ? 48 : 64, MOBILE ? 48 : 64), new THREE.MeshBasicMaterial({ map: mtex }));
    globe.add(earth); G.earth = earth; G.paint(null);
    // сетка широт/долгот (границ стран нет — geodata не подключена)
    var pts = [], i, j;
    for (i = -60; i <= 60; i += 30) for (j = 0; j < 72; j++) { pts.push(ll(i, j * 5 - 180, 1.003), ll(i, (j + 1) * 5 - 180, 1.003)); }
    for (i = -180; i < 180; i += 30) for (j = -17; j < 17; j++) { pts.push(ll(j * 5, i, 1.003), ll((j + 1) * 5, i, 1.003)); }
    globe.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: .06 })));
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.08, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: .14, side: THREE.BackSide })));
    // звёзды
    var sp = [], n = MOBILE ? 150 : 400;
    for (i = 0; i < n; i++) { var v = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(14 + Math.random() * 6); sp.push(v); }
    scene.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(sp), new THREE.PointsMaterial({ color: 0xffffff, size: .05, transparent: true, opacity: .6 })));

    // города
    D.order.forEach(function (k) {
      var c = D.countries[k], p = ll(c.lat, c.lon, 1.015);
      var m = new THREE.Mesh(new THREE.SphereGeometry(.028, 16, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(c.color) }));
      m.position.copy(p); globe.add(m);
      var ring = new THREE.Mesh(new THREE.RingGeometry(.035, .042, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(c.color), transparent: true, opacity: .8, side: THREE.DoubleSide }));
      ring.position.copy(p); ring.lookAt(p.clone().multiplyScalar(2)); globe.add(ring);
      var hit = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(p); hit.userData = { key: k, main: true }; globe.add(hit); G.picks.push(hit);
      G.cities[k] = { pos: p, mesh: m, ring: ring, color: c.color };
      var lc = document.createElement("canvas"); lc.width = 384; lc.height = 96; var lx = lc.getContext("2d");
      lx.font = "bold 44px system-ui,sans-serif"; lx.textAlign = "center"; lx.textBaseline = "middle"; lx.shadowColor = c.color; lx.shadowBlur = 14; lx.fillStyle = "#fff"; lx.fillText(c.city, 192, 48);
      var sprL = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(lc), transparent: true, depthWrite: false }));
      sprL.scale.set(.62, .155, 1); sprL.position.copy(ll(c.lat, c.lon, 1.13)); sprL.userData = { key: k }; globe.add(sprL); G.labels.push(sprL);
    });
    D.extras.forEach(function (e, idx) {
      var p = ll(e.lat, e.lon, 1.012);
      var m = new THREE.Mesh(new THREE.SphereGeometry(.018, 12, 12), new THREE.MeshBasicMaterial({ color: 0x8a93aa }));
      m.position.copy(p); globe.add(m); G.extraM.push(m);
      var hit = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(p); hit.userData = { extra: idx }; globe.add(hit); G.picks.push(hit);
    });

    // дуги (иллюстрация)
    G.arcs = [];
    [["thailand", "hongkong"], ["thailand", "indonesia"], ["indonesia", "malaysia"], ["korea", "hongkong"], ["philippines", "hongkong"], ["malaysia", "thailand"], ["korea", "philippines"], ["hongkong", "malaysia"]].forEach(function (pr) {
      var a = G.cities[pr[0]].pos, b = G.cities[pr[1]].pos;
      var mid = a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(1.0 + a.distanceTo(b) * .55);
      var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      var aln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: .55 })); globe.add(aln); G.arcLines.push(aln);
      var dot = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      globe.add(dot); G.arcs.push({ curve: curve, dot: dot, t: Math.random() });
    });

    // ОрбитКонтролс
    var oc = new THREE.OrbitControls(cam, canvas);
    oc.enablePan = false; oc.enableZoom = false; oc.enableDamping = true; oc.autoRotate = !REDUCED; oc.autoRotateSpeed = .8;
    G.oc = oc;

    // выбор: по маркеру или по самой стране (контур на карте)
    function inRing(r, lon, lat) { var c = false, a, b; for (a = 0, b = r.length - 2; a < r.length; b = a, a += 2) { var xi = r[a], yi = r[a + 1], xj = r[b], yj = r[b + 1]; if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) c = !c; } return c; }
    function which(lat, lon) {
      var GEO = window.GEO, k, e, best = null, bd = 1e9;
      if (GEO) {
        for (k = 0; k < D.order.length; k++) if ((GEO.detail[D.order[k]] || []).some(function (r) { return inRing(r, lon, lat); })) return { key: D.order[k], main: true };
        for (e = 0; e < 7; e++) if ((GEO.detail["x" + e] || []).some(function (r) { return inRing(r, lon, lat); })) return { extra: e };
      }
      D.order.forEach(function (k) { var c = D.countries[k], d = Math.hypot(c.lat - lat, (c.lon - lon) * Math.cos(lat * Math.PI / 180)); if (d < 1.6 && d < bd) { bd = d; best = { key: k, main: true }; } });
      return best;
    }
    function hitAt(e) {
      var r = canvas.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, cam);
      var hit = ray.intersectObjects(G.picks)[0];
      if (hit) { var wp = hit.object.getWorldPosition(new THREE.Vector3()); if (wp.dot(cam.position) > 0.2) return hit.object.userData; }
      var eh = ray.intersectObject(earth)[0];
      if (!eh) return null;
      var q = eh.point.clone().normalize(), lat = Math.asin(q.y) * 180 / Math.PI, lon = Math.atan2(q.z, -q.x) * 180 / Math.PI - 180;
      if (lon < -180) lon += 360;
      return which(lat, lon);
    }
    var ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), down = null, lastMove = 0;
    canvas.addEventListener("pointerdown", function (e) { down = [e.clientX, e.clientY]; });
    canvas.addEventListener("pointerup", function (e) {
      if (!down || Math.abs(e.clientX - down[0]) + Math.abs(e.clientY - down[1]) > 6) return;
      var u = hitAt(e); if (u && G.onPick) G.onPick(u);
    });
    canvas.addEventListener("pointermove", function (e) {
      var n = performance.now(); if (n - lastMove < 60 || e.buttons) return; lastMove = n;
      if (G.regGroup && G.onRegionHover) {
        var r = canvas.getBoundingClientRect();
        mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(mouse, cam);
        var rh = ray.intersectObject(G.regGroup, true).filter(function (h) { return h.object.isMesh; })[0];
        if (rh && rh.point.dot(cam.position) > .2) { G.onRegionHover(rh.object.userData.i, e); canvas.style.cursor = "pointer"; return; }
        G.onRegionHover(-1, e);
      }
      canvas.style.cursor = hitAt(e) ? "pointer" : "grab";
    });
    canvas.addEventListener("pointerleave", function () { if (G.onRegionHover) G.onRegionHover(-1); });

    function resize() {
      var w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      rn.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(wrap); resize();

    var clock = new THREE.Clock(), vis = true;
    document.addEventListener("visibilitychange", function () { vis = !document.hidden; });
    function loop() {
      requestAnimationFrame(loop);
      if (!vis) return;
      var dt = clock.getDelta(), t = clock.elapsedTime;
      if (G.fly) {
        var f = G.fly; f.t += dt / f.d; var k = ease(Math.min(f.t, 1));
        var dir = f.from.clone().lerp(f.to, k).normalize();
        cam.position.copy(dir.multiplyScalar(f.r0 + (f.r1 - f.r0) * k));
        cam.lookAt(0, 0, 0);
        if (f.t >= 1) { G.fly = null; if (f.done) f.done(); }
      } else oc.update();
      if (!REDUCED) {
        G.arcs.forEach(function (a) { a.t = (a.t + dt * .15) % 1; a.dot.position.copy(a.curve.getPoint(a.t)); });
        D.order.forEach(function (k, i) { var r = G.cities[k].ring; var s = (1 + .25 * Math.sin(t * 2 + i)) * (G._near ? .12 : 1); r.scale.set(s, s, s); });
      }
      var near = !!G.cur && cam.position.length() < 3.3;
      if (near !== G._near) {
        G._near = near;
        G.labels.forEach(function (l) { l.visible = !near || l.userData.key === G.cur; l.scale.set(near ? .13 : .62, near ? .033 : .155, 1); });
        G.arcLines.forEach(function (l) { l.visible = !near; }); G.arcs.forEach(function (a) { a.dot.visible = !near; });
        D.order.forEach(function (k) { G.cities[k].mesh.scale.setScalar(near ? .12 : 1); G.cities[k].ring.visible = true; });
        G.extraM.forEach(function (m) { m.scale.setScalar(near ? .2 : 1); });
      }
      rn.render(scene, cam);
    }
    if (REDUCED) { G.arcs.forEach(function (a) { a.dot.position.copy(a.curve.getPoint(.5)); }); }
    loop();
  };

  G.flyTo = function (key, done, opts) {
    var c = G.cities[key]; if (!c) return;
    opts = opts || {};
    G.cur = key; G.paint(key); G.oc.autoRotate = false; G.oc.enabled = false;
    var to = opts.lat !== undefined ? ll(opts.lat, opts.lon, 1).normalize() : c.pos.clone().normalize();
    var r1 = opts.r1 || (G.cam.aspect > 1.5 ? 1.9 : 2.6);
    if (REDUCED) { G.cam.position.copy(to.clone().multiplyScalar(r1)); G.cam.lookAt(0, 0, 0); if (done) done(); return; }
    G.fly = { from: G.cam.position.clone().normalize(), to: to, r0: G.cam.position.length(), r1: r1, d: 1.5, t: 0, done: done };
  };
  /* приблизиться к стране так, чтобы она целиком (с регионами) помещалась в центральном окне */
  G.focusOn = function (k, done) {
    var R = (window.REGIONS || {})[k] || [], x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    R.forEach(function (g) { g.r.forEach(function (r) { for (var i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } }); });
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rad = Math.PI / 180;
    var w = (x1 - x0) * Math.cos(cy * rad) * rad, h = (y1 - y0) * rad;
    var asp = Math.max(.4, (window.innerWidth * .265) / Math.max(300, window.innerHeight - 234));
    var th = Math.tan(22.5 * rad), tw = Math.tan(Math.atan(th * asp));
    var d = 1 + Math.max(w * 1.5 / (2 * tw), h * 1.5 / (2 * th));
    d = Math.max(1.4, Math.min(d, 3.2));
    G.flyTo(k, function () { G.oc.enabled = true; if (done) done(); }, { lat: cy, lon: cx, r1: d });
  };
  /* регионы (admin-1) на самом глобусе */
  G.clearRegions = function () {
    if (G.regGroup) { G.globe.remove(G.regGroup); G.regGroup.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
    G.regGroup = null; G.regMats = [];
  };
  G.showRegions = function (regs, cap) {
    G.clearRegions();
    var grp = new THREE.Group(); G.regGroup = grp; G.regMats = []; G.globe.add(grp);
    regs.forEach(function (g, i) {
      var mat = new THREE.MeshBasicMaterial({ color: 0x20c060, transparent: true, opacity: REDUCED ? .86 : 0, side: THREE.DoubleSide, depthWrite: false });
      G.regMats.push(mat);
      var lmat = new THREE.LineBasicMaterial({ color: i === cap ? 0xffffff : 0x04050f, transparent: true, opacity: i === cap ? 1 : .55 });
      var rg = new THREE.Group(); rg.userData = { i: i }; grp.add(rg);
      g.r.forEach(function (ring) {
        var pts = [], q; for (q = 0; q < ring.length; q += 2) pts.push(new THREE.Vector2(ring[q], ring[q + 1]));
        if (pts.length > 2 && pts[0].equals(pts[pts.length - 1])) pts.pop();
        if (pts.length < 3) return;
        var geo = new THREE.ShapeGeometry(new THREE.Shape(pts)), pos = geo.attributes.position, v;
        for (v = 0; v < pos.count; v++) { var p = ll(pos.getY(v), pos.getX(v), 1.006); pos.setXYZ(v, p.x, p.y, p.z); }
        pos.needsUpdate = true; geo.computeBoundingSphere();
        var m = new THREE.Mesh(geo, mat); m.userData = { i: i }; rg.add(m);
        rg.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts.map(function (p) { return ll(p.y, p.x, 1.0075); })), lmat));
      });
    });
    if (!REDUCED) { var t0 = performance.now(); (function f(t) { var k = Math.min((t - t0) / 700, 1); G.regMats.forEach(function (m) { m.opacity = .86 * k; }); if (k < 1 && G.regGroup === grp) requestAnimationFrame(f); })(t0); }
  };
  G.setRegionHues = function (hues) {
    (G.regMats || []).forEach(function (m, i) { if (hues[i] !== undefined) m.color.setHSL(hues[i] / 360, .95, .52); });
  };
  G.flyHome = function (asia) {
    G.cur = null; G.paint(null); G.oc.enabled = true; G.oc.autoRotate = !REDUCED && !asia;
    var to = ll(18, 112, 1).normalize();
    if (asia) { to = ll(14, 114, 1).normalize(); to.y += .25; to.normalize(); }
    if (REDUCED) { G.cam.position.copy(to.clone().multiplyScalar(3.4)); G.cam.lookAt(0, 0, 0); return; }
    G.fly = { from: G.cam.position.clone().normalize(), to: to, r0: G.cam.position.length(), r1: 3.4, d: 1.2, t: 0 };
  };
  /* «камера к дате»: короткое приближение/отдаление */
  G.nudge = function () {
    if (REDUCED || !G.cur || G.fly) return;
    var c = G.cities[G.cur].pos.clone().normalize();
    var side = new THREE.Vector3(0, 1, 0).cross(c).multiplyScalar(.25);
    G.fly = { from: G.cam.position.clone().normalize(), to: c.clone().add(side).normalize(), r0: G.cam.position.length(), r1: 2.2, d: .5, t: 0,
      done: function () { G.fly = { from: G.cam.position.clone().normalize(), to: c, r0: G.cam.position.length(), r1: 2.6, d: .6, t: 0 }; } };
  };
  G.setBars = function (on) {
    G.bars.forEach(function (b) { G.globe.remove(b); }); G.bars = [];
    if (!on) return;
    var D = window.DATA;
    D.order.forEach(function (k) {
      var c = D.countries[k], h = Math.abs(c.gdp1998.value) * .03;
      var p = G.cities[k].pos.clone().normalize();
      var m = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, h, 12), new THREE.MeshBasicMaterial({ color: 0xff5d6c }));
      m.position.copy(p.clone().multiplyScalar(1 + h / 2)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p);
      G.globe.add(m); G.bars.push(m);
      if (!REDUCED) { m.scale.y = .01; (function (mm) { var s = 0, id = setInterval(function () { s += .06; mm.scale.y = Math.min(1, s); if (s >= 1) clearInterval(id); }, 30); })(m); }
    });
  };
  G.light = function (all) {
    window.DATA.order.forEach(function (k) { G.cities[k].mesh.scale.setScalar(all ? 1.6 : 1); });
  };

  /* ---------- Sim3D: мини-сцена для симуляторов ---------- */
  window.Sim3D = {
    create: function (el, opts) {
      opts = opts || {};
      var sc = new THREE.Scene();
      var cm = new THREE.PerspectiveCamera(45, 1, .1, 100);
      cm.position.set(0, 2.2, 6.2);
      var rn = new THREE.WebGLRenderer({ antialias: !MOBILE, alpha: true });
      rn.setPixelRatio(PR); el.appendChild(rn.domElement);
      sc.add(new THREE.AmbientLight(0xffffff, .75));
      var l = new THREE.DirectionalLight(0xffffff, .8); l.position.set(3, 5, 4); sc.add(l);
      var oc = new THREE.OrbitControls(cm, rn.domElement); oc.enablePan = false; oc.enableZoom = false; oc.enableDamping = true;
      oc.target.set(0, opts.ty || .8, 0);
      var fns = [], alive = true, clock = new THREE.Clock();
      function size() { var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; rn.setSize(w, h, false); cm.aspect = w / h; cm.updateProjectionMatrix(); render(); }
      var ro = new ResizeObserver(size); ro.observe(el);
      function render() { rn.render(sc, cm); }
      oc.addEventListener("change", function () { if (REDUCED) render(); });
      function loop() {
        if (!alive) return; requestAnimationFrame(loop);
        var dt = clock.getDelta(), t = clock.elapsedTime;
        if (!REDUCED) { fns.forEach(function (f) { f(dt, t); }); oc.update(); render(); }
      }
      loop(); size();
      return {
        THREE: THREE, scene: sc, camera: cm, renderer: rn, render: render,
        onFrame: function (f) { fns.push(f); },
        dispose: function () { alive = false; ro.disconnect(); oc.dispose(); rn.dispose(); if (rn.domElement.parentNode) rn.domElement.parentNode.removeChild(rn.domElement); }
      };
    },
    label: function (text, color) {
      var c = document.createElement("canvas"); c.width = 256; c.height = 64;
      var x = c.getContext("2d"); x.fillStyle = color || "#e8ecf8"; x.font = "bold 26px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 32);
      var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
      s.scale.set(1.6, .4, 1); return s;
    }
  };
})();
