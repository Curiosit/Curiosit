/* Solaie landing page — sample model, sunlight computation and 2D views.
   Everything here is computed in the browser: NOAA sun position for Warsaw, 1-minute steps
   between 7:00 and 17:00 official time on both 2026 equinoxes, rays from each window against
   the neighbouring blocks. The 3D view (demo3d.js) reads the same data from window.SolaieDemo. */
(function () {
  "use strict";
  var D2R = Math.PI / 180, R2D = 180 / Math.PI, LAT = 52.2297, LON = 21.0122;

  /* ---------- sun position (NOAA) ---------- */
  function sun(ms) {
    var jd = ms / 86400000 + 2440587.5, T = (jd - 2451545) / 36525;
    var L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    var M = 357.52911 + T * (35999.05029 - 0.0001537 * T), Mr = M * D2R;
    var e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    var C = Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) + Math.sin(3 * Mr) * 0.000289;
    var om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * D2R);
    var eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * D2R);
    var decl = Math.asin(Math.sin(eps * D2R) * Math.sin(lam * D2R));
    var y = Math.pow(Math.tan(eps * D2R / 2), 2), L0r = L0 * D2R;
    var eqt = 4 * R2D * (y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr) + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r) - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr));
    var d = new Date(ms), utcMin = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
    var ha = ((utcMin + eqt + 4 * LON) / 4 - 180) * D2R, la = LAT * D2R;
    var cz = Math.sin(la) * Math.sin(decl) + Math.cos(la) * Math.cos(decl) * Math.cos(ha);
    var zen = Math.acos(Math.max(-1, Math.min(1, cz)));
    var az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(la) - Math.tan(decl) * Math.cos(la)) * R2D + 180;
    return { az: (az + 360) % 360, alt: 90 - zen * R2D };
  }

  /* ---------- site: local frame u (along facade), v (out of facade), h (up) ---------- */
  var NAZ = 165;                                   /* facade faces SSE */
  var U = [Math.sin((NAZ - 90) * D2R), Math.cos((NAZ - 90) * D2R)];   /* world [east, north] */
  var N = [Math.sin(NAZ * D2R), Math.cos(NAZ * D2R)];
  var BOXES = [
    { id: "A", own: true, u: [0, 36], v: [-12, 0], h: [0, 13] },
    { id: "B", u: [-26, 18], v: [14, 26], h: [0, 25] },
    { id: "C", u: [18, 46], v: [15, 25], h: [0, 13] },
    { id: "D", u: [38, 50], v: [-12, 8], h: [0, 19] }
  ];
  var FLOORS = 4, PER = 9, FH = 3.1, WW = 1.6, WH = 1.5, SILL = 0.9;

  function toWorld(u, v) { return [u * U[0] + v * N[0], u * U[1] + v * N[1]]; }
  function localDir(s) {
    var ca = Math.cos(s.alt * D2R), ex = Math.sin(s.az * D2R) * ca, ny = Math.cos(s.az * D2R) * ca;
    return [ex * U[0] + ny * U[1], ex * N[0] + ny * N[1], Math.sin(s.alt * D2R)];
  }
  /* distance to first obstacle along ray, or Infinity */
  function hit(p, d) {
    var best = Infinity;
    for (var b = 0; b < BOXES.length; b++) {
      var B = BOXES[b], t0 = 1e-6, t1 = Infinity, ax = [B.u, B.v, B.h], ok = true;
      for (var k = 0; k < 3; k++) {
        if (Math.abs(d[k]) < 1e-12) { if (p[k] < ax[k][0] || p[k] > ax[k][1]) { ok = false; break; } continue; }
        var ta = (ax[k][0] - p[k]) / d[k], tb = (ax[k][1] - p[k]) / d[k];
        if (ta > tb) { var tmp = ta; ta = tb; tb = tmp; }
        if (ta > t0) t0 = ta; if (tb < t1) t1 = tb;
        if (t0 > t1) { ok = false; break; }
      }
      if (ok && t0 < best) best = t0;
    }
    return best;
  }

  var SEASONS = [
    { key: "spring", pl: "Równonoc wiosenna, 20 marca 2026", en: "Spring equinox, 20 March 2026", short: { pl: "20 marca", en: "20 March" }, start: Date.UTC(2026, 2, 20, 6, 0), tz: 1 },
    { key: "autumn", pl: "Równonoc jesienna, 23 września 2026", en: "Autumn equinox, 23 September 2026", short: { pl: "23 września", en: "23 September" }, start: Date.UTC(2026, 8, 23, 5, 0), tz: 2 }
  ];
  var STEPS = 600;   /* minutes 7:00–17:00 */
  SEASONS.forEach(function (S) {
    S.sun = []; S.dir = []; S.front = new Uint8Array(STEPS);
    for (var i = 0; i < STEPS; i++) {
      var s = sun(S.start + (i + 0.5) * 60000), d = localDir(s);
      S.sun.push(s); S.dir.push(d);
      S.front[i] = s.alt > 0 && d[1] > 0 ? 1 : 0;
    }
  });

  function runs(a) { var best = 0, cur = 0, sum = 0; for (var i = 0; i < a.length; i++) { if (a[i]) { cur++; sum++; if (cur > best) best = cur; } else cur = 0; } return [sum, best]; }

  var windows = [];
  for (var f = 0; f < FLOORS; f++) for (var j = 0; j < PER; j++) {
    var w = { floor: f, idx: j, u: 2 + j * 4, h: f * FH + SILL + WH / 2, code: f + "." + String(j + 1).padStart(2, "0"), res: {} };
    var pts = [[w.u, 0.02, w.h], [w.u - WW / 2 + 0.05, 0.02, w.h], [w.u + WW / 2 - 0.05, 0.02, w.h]];
    SEASONS.forEach(function (S) {
      var c = new Uint8Array(STEPS), any = new Uint8Array(STEPS);
      for (var i = 0; i < STEPS; i++) {
        if (!S.front[i]) continue;
        for (var k = 0; k < 3; k++) {
          if (hit(pts[k], S.dir[i]) === Infinity) { any[i] = 1; if (k === 0) c[i] = 1; }
        }
      }
      var rc = runs(c), ra = runs(any);
      w.res[S.key] = { centre: c, any: any, A: ra[0], B: rc[0], C: ra[1], D: rc[1] };
    });
    w.min = {}; ["A", "B", "C", "D"].forEach(function (r) { w.min[r] = Math.min(w.res.spring[r], w.res.autumn[r]); });
    var passN = ["A", "B", "C", "D"].filter(function (r) { return w.min[r] >= 180; }).length;
    w.verdict = passN === 4 ? "pass" : passN === 0 ? "fail" : "flip";
    windows.push(w);
  }

  function hm(m) { return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }
  function clock(S, i) { var m = 7 * 60 + i; return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }

  /* ---------- shared state ---------- */
  var state = { season: 0, minute: 300, sel: windows.findIndex(function (w) { return w.verdict === "flip"; }) };
  if (state.sel < 0) state.sel = 0;
  var listeners = [];
  function set(patch) { for (var k in patch) state[k] = patch[k]; listeners.forEach(function (fn) { fn(state); }); }

  window.SolaieDemo = { sun: sun, BOXES: BOXES, windows: windows, SEASONS: SEASONS, STEPS: STEPS, state: state, set: set,
    on: function (fn) { listeners.push(fn); }, hit: hit, toWorld: toWorld, NAZ: NAZ, U: U, N: N, dims: { WW: WW, WH: WH, FH: FH }, hm: hm, clock: clock };

  /* ---------- DOM ---------- */
  var SVGNS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function lang() { return document.documentElement.getAttribute("data-lang") || "pl"; }
  var VCOL = { pass: "var(--pass)", flip: "var(--warn)", fail: "var(--fail)" };

  /* plan */
  var plan = document.getElementById("plan2d");
  var allPts = []; BOXES.forEach(function (B) { [[B.u[0], B.v[0]], [B.u[1], B.v[0]], [B.u[1], B.v[1]], [B.u[0], B.v[1]]].forEach(function (p) { allPts.push(toWorld(p[0], p[1])); }); });
  var PAD = 26, xs = allPts.map(function (p) { return p[0]; }), ys = allPts.map(function (p) { return p[1]; });
  var minX = Math.min.apply(0, xs) - PAD, maxX = Math.max.apply(0, xs) + PAD, minY = Math.min.apply(0, ys) - PAD, maxY = Math.max.apply(0, ys) + PAD;
  plan.setAttribute("viewBox", minX + " " + (-maxY) + " " + (maxX - minX) + " " + (maxY - minY));
  var gB = el("g", {}, plan), gFan = el("g", {}, plan), gTop = el("g", {}, plan);
  BOXES.forEach(function (B) {
    var p = [[B.u[0], B.v[0]], [B.u[1], B.v[0]], [B.u[1], B.v[1]], [B.u[0], B.v[1]]].map(function (q) { var w = toWorld(q[0], q[1]); return w[0].toFixed(2) + "," + (-w[1]).toFixed(2); }).join(" ");
    el("polygon", { points: p, "class": B.own ? "b-own" : "b-nb" }, gB);
    var c = toWorld((B.u[0] + B.u[1]) / 2, (B.v[0] + B.v[1]) / 2);
    var t = el("text", { x: c[0], y: -c[1] + 1.2, "class": "b-lab" }, gB); t.textContent = B.own ? "" : B.h[1] + " m";
  });
  /* facade line */
  var f0 = toWorld(0, 0), f1 = toWorld(36, 0);
  el("line", { x1: f0[0], y1: -f0[1], x2: f1[0], y2: -f1[1], "class": "facade" }, gB);
  /* north arrow */
  var na = el("g", { transform: "translate(" + (maxX - 9) + "," + (-maxY + 12) + ")" }, gB);
  el("path", { d: "M0,-7 L3.2,4 L0,2 L-3.2,4 Z", "class": "north" }, na);
  var nt = el("text", { x: 0, y: -9, "class": "north-t" }, na); nt.textContent = "N";

  function drawPlan() {
    while (gFan.firstChild) gFan.removeChild(gFan.firstChild);
    while (gTop.firstChild) gTop.removeChild(gTop.firstChild);
    var S = SEASONS[state.season], w = windows[state.sel], p = toWorld(w.u, 0), L = 34;
    var cen = w.res[S.key].centre;
    for (var i = 0; i < STEPS; i += 10) {
      if (!S.front[i]) continue;
      var s = S.sun[i], ex = Math.sin(s.az * D2R), ny = Math.cos(s.az * D2R);
      var lit = cen[i] === 1, d = S.dir[i];
      var len = lit ? L : Math.min(L, hit([w.u, 0.02, w.h], d) * Math.hypot(d[0], d[1]));
      el("line", { x1: p[0], y1: -p[1], x2: p[0] + ex * len, y2: -(p[1] + ny * len), "class": lit ? "ray-lit" : "ray-off" }, gFan);
      if (!lit) el("line", { x1: p[0] + ex * len, y1: -(p[1] + ny * len), x2: p[0] + ex * L, y2: -(p[1] + ny * L), "class": "ray-ghost" }, gFan);
      if (i % 60 === 0) { var t = el("text", { x: p[0] + ex * (L + 4), y: -(p[1] + ny * (L + 4)) + 1.3, "class": "hour" }, gFan); t.textContent = String(7 + i / 60); }
    }
    /* current sun */
    var ci = state.minute;
    if (S.front[ci]) {
      var s2 = S.sun[ci], ex2 = Math.sin(s2.az * D2R), ny2 = Math.cos(s2.az * D2R);
      el("line", { x1: p[0], y1: -p[1], x2: p[0] + ex2 * (L + 9), y2: -(p[1] + ny2 * (L + 9)), "class": "ray-now" }, gTop);
      el("circle", { cx: p[0] + ex2 * (L + 9), cy: -(p[1] + ny2 * (L + 9)), r: 2.6, "class": "sun-dot" }, gTop);
    }
    el("circle", { cx: p[0], cy: -p[1], r: 1.6, "class": "win-dot" }, gTop);
  }

  /* elevation */
  var elev = document.getElementById("elev2d");
  var EW = 36, EH = 13;
  elev.setAttribute("viewBox", "-1.5 " + (-EH - 1.5) + " " + (EW + 3) + " " + (EH + 2.6));
  el("rect", { x: 0, y: -EH, width: EW, height: EH, "class": "facade-fill" }, elev);
  el("line", { x1: -1.5, y1: 0, x2: EW + 1.5, y2: 0, "class": "ground" }, elev);
  var winEls = windows.map(function (w, n) {
    var g = el("g", { "class": "ew", tabindex: "0", role: "button" }, elev);
    el("rect", { x: w.u - WW / 2, y: -(w.h + WH / 2), width: WW, height: WH, rx: 0.12, fill: VCOL[w.verdict] }, g);
    var t = el("text", { transform: "translate(" + w.u + "," + (-(w.h - 0.2)) + ") scale(0.1)", "class": "ew-t" }, g); t.textContent = hm(w.min.D);
    g.addEventListener("click", function () { set({ sel: n }); });
    g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set({ sel: n }); } });
    return g;
  });
  var selRect = el("rect", { "class": "ew-sel", width: WW + 0.5, height: WH + 0.5, rx: 0.3 }, elev);
  function drawElev() {
    var w = windows[state.sel];
    selRect.setAttribute("x", w.u - WW / 2 - 0.25); selRect.setAttribute("y", -(w.h + WH / 2) - 0.25);
    var S = SEASONS[state.season];
    winEls.forEach(function (g, n) { g.classList.toggle("lit", windows[n].res[S.key].centre[state.minute] === 1); });
  }

  /* detail */
  var det = document.getElementById("detail");
  function bar(S, w) {
    var r = w.res[S.key], segs = "", i, st;
    function spans(a, cls) { var o = ""; for (i = 0; i < STEPS; i++) { if (a[i] && (i === 0 || !a[i - 1])) st = i; if (a[i] && (i === STEPS - 1 || !a[i + 1])) o += '<span class="' + cls + '" style="left:' + (st / 6) + "%;width:" + ((i + 1 - st) / 6) + '%"></span>'; } return o; }
    segs = spans(r.any, "seg-any") + spans(r.centre, "seg-c");
    var now = state.season === SEASONS.indexOf(S) ? '<i class="now" style="left:' + (state.minute / 6) + '%"></i>' : "";
    return '<div class="tl"><span class="tl-l">' + S.short[lang()] + '</span><div class="tl-bar">' + segs + now + '</div></div>';
  }
  function drawDetail() {
    var w = windows[state.sel], L = lang();
    var floorTxt = L === "pl" ? (w.floor === 0 ? "parter" : "piętro " + w.floor) : (w.floor === 0 ? "ground floor" : "floor " + w.floor);
    var vtxt = { pass: { pl: "spełnia przy każdym odczycie", en: "passes under every reading" }, flip: { pl: "wynik zależy od odczytu", en: "result depends on the reading" }, fail: { pl: "nie spełnia przy żadnym odczycie", en: "fails under every reading" } }[w.verdict][L];
    var rows = [["A", L === "pl" ? "dowolny punkt okna, suma okresów" : "any point of the window, summed"],
                ["B", L === "pl" ? "środek okna, suma okresów" : "window centre, summed"],
                ["C", L === "pl" ? "dowolny punkt okna, najdłuższy ciągły okres" : "any point, longest continuous period"],
                ["D", L === "pl" ? "środek okna, najdłuższy ciągły okres" : "window centre, longest continuous period"]];
    var h = '<div class="det-h"><b>' + (L === "pl" ? "Okno " : "Window ") + w.code + "</b> · " + floorTxt + ' · <span class="verdict v-' + w.verdict + '">' + vtxt + "</span></div>";
    h += '<table class="mx det"><thead><tr><th></th><th>' + (L === "pl" ? "Odczyt przepisu" : "Reading of the rule") + "</th><th>" + SEASONS[0].short[L] + "</th><th>" + SEASONS[1].short[L] + "</th></tr></thead><tbody>";
    rows.forEach(function (r) {
      var a = w.res.spring[r[0]], b = w.res.autumn[r[0]];
      h += "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + '</td><td class="t ' + (a >= 180 ? "ok" : "no") + '">' + hm(a) + '</td><td class="t ' + (b >= 180 ? "ok" : "no") + '">' + hm(b) + "</td></tr>";
    });
    h += "</tbody></table>" + bar(SEASONS[0], w) + bar(SEASONS[1], w);
    h += '<p class="legend">' + (L === "pl" ? "Pasek: 7:00–17:00 czasu urzędowego. Ciemny: słońce w środku okna. Jasny: słońce tylko na części okna." : "Bar: 7:00–17:00 official time. Dark: sun on the window centre. Light: sun on part of the window only.") + "</p>";
    det.innerHTML = h;
  }

  /* controls */
  var seg = document.querySelectorAll("[data-season]"), slider = document.getElementById("tslider"), tout = document.getElementById("tout"), play = document.getElementById("tplay");
  seg.forEach(function (b) { b.addEventListener("click", function () { set({ season: +b.getAttribute("data-season") }); }); });
  slider.addEventListener("input", function () { set({ minute: +slider.value }); });
  var timer = null;
  function stop() { if (timer) { cancelAnimationFrame(timer); timer = null; } play.setAttribute("aria-pressed", "false"); }
  play.addEventListener("click", function () {
    if (timer) { stop(); return; }
    play.setAttribute("aria-pressed", "true");
    var last = performance.now();
    (function step(t) {
      var adv = Math.round((t - last) / 1000 * 60); /* 60 min of day per second */
      if (adv > 0) { last = t; var m = state.minute + adv; if (m >= STEPS) m = 0; set({ minute: m }); }
      timer = requestAnimationFrame(step);
    })(last);
  });
  function drawControls() {
    seg.forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-season") === state.season)); });
    slider.value = state.minute;
    var S = SEASONS[state.season], s = S.sun[state.minute];
    tout.textContent = clock(S, state.minute) + " · " + (lang() === "pl" ? "azymut " : "azimuth ") + Math.round(s.az) + "° · " + (lang() === "pl" ? "wysokość " : "altitude ") + Math.max(0, Math.round(s.alt)) + "°";
  }

  /* hero table: real values from the sample model */
  function fillHero() {
    var pick = ["pass", "flip", "fail"].map(function (v) {
      var c = windows.filter(function (w) { return w.verdict === v; });
      return c.length ? c[Math.floor(c.length / 2)] : null;
    });
    var rows = document.querySelectorAll(".preview tbody tr");
    pick.forEach(function (w, n) {
      if (!w || !rows[n]) return;
      var td = rows[n].querySelectorAll("td");
      td[0].textContent = w.code;
      ["A", "B", "C", "D"].forEach(function (r, k) { td[k + 1].textContent = hm(w.min[r]); td[k + 1].className = "t " + (w.min[r] >= 180 ? "ok" : "no"); });
    });
  }

  function all() { drawControls(); drawPlan(); drawElev(); drawDetail(); }
  listeners.push(all);
  fillHero();
  all();
  document.getElementById("lang").addEventListener("click", function () { setTimeout(all, 0); });
})();
