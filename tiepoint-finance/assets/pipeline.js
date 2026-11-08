/* TiePoint Finance: animated tie-out pipeline (canvas, no dependencies).
   Renders into any element with [data-pipeline]. Every colour is read from the
   CSS custom properties in site.css (:root), so palette changes apply here too.
   Illustration only: every figure drawn here is simulated. */
(function () {
  "use strict";
  var SOURCES = ["NetSuite", "Business Central", "SAP", "Sage Intacct", "QuickBooks", "Xero", "Oracle", "Salesforce", "Workday", "Bank feeds"];
  var STAGES = [
    { k: "CONNECT", s: "Read-only feeds" },
    { k: "MAP", s: "Chart of accounts" },
    { k: "CONSOLIDATE", s: "FX + intercompany" },
    { k: "TIE OUT", s: "Reconcile to GL" }
  ];
  var OUTPUTS = ["P&L", "Budget vs Actual", "Cash Position", "KPIs", "Board Pack"];

  function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function bez(a, b, c, d, t) { var u = 1 - t; return { x: u*u*u*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t*t*t*d.x, y: u*u*u*a.y + 3*u*u*t*b.y + 3*u*t*t*c.y + t*t*t*d.y }; }
  function ease(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2; }
  function sprite(color, r) {
    var c = document.createElement("canvas"), s = r * 2; c.width = c.height = s;
    var g = c.getContext("2d"), grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, color); grd.addColorStop(0.25, color); grd.addColorStop(1, "transparent");
    g.globalAlpha = 0.55; g.fillStyle = grd; g.fillRect(0, 0, s, s); return c;
  }

  function init(host) {
    var cv = document.createElement("canvas");
    cv.setAttribute("role", "img");
    cv.setAttribute("aria-label", "Animated illustration: records from ERP, CRM, HR and bank systems move through connect, map, consolidate and tie-out stages before reaching P&L, budget versus actual, cash, KPI and board pack reports. A few records are held as exceptions and resolved before release. All figures are simulated.");
    host.appendChild(cv);
    var ctx = cv.getContext("2d");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var C = {}, SP = {};
    function readColors() {
      C = { fg: tok("--on-ink"), line: tok("--line-ink"), mut: tok("--on-ink-faint"), tie: tok("--accent"), tie2: tok("--accent-2"), flow: tok("--flow"), card: tok("--ink-3"), card2: tok("--ink-2"), warn: tok("--warning") };
      SP = { flow: sprite(C.flow, 14), tie: sprite(C.tie, 14), warn: sprite(C.warn, 16), big: sprite(C.tie, 60) };
    }
    readColors();

    var W = 0, H = 0, dpr = 1, vert = false, L = null, K = 1;
    function F(w, px, fam) { return w + " " + Math.round(px * K) + "px " + fam; }
    var MONO = "'IBM Plex Mono', ui-monospace, monospace", DISP = "'Space Grotesk', system-ui, sans-serif", BODY = "'Inter', system-ui, sans-serif";
    var parts = [], flashes = [], pulses = STAGES.map(function () { return 0; }), glow = OUTPUTS.map(function () { return 0; });
    var series = OUTPUTS.map(function () { var a = []; for (var i = 0; i < 14; i++) a.push(0.35 + Math.random() * 0.5); return a; });
    var shown = series.map(function (s) { return s.slice(); });
    var records = 482000 + Math.floor(Math.random() * 9000), shownRecords = records, held = 0, cleared = 0, last = 0, acc = 0, running = false, t0 = performance.now();

    function layout() {
      var r = host.getBoundingClientRect();
      W = Math.max(300, r.width);
      vert = W < 760;
      K = vert ? 1 : Math.max(1, Math.min(1.45, W / 1300));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      var src = [], stg = [], out = [], statY;
      if (!vert) {
        H = Math.max(480, Math.min(600, W * 0.45));
        var sw = Math.min(152 * K, W * 0.14), sh = 28 * K, gap = (H - 40) / SOURCES.length;
        SOURCES.forEach(function (n, i) { src.push({ n: n, x: W * 0.015, y: 20 + gap * i + (gap - sh) / 2, w: sw, h: sh }); });
        var x0 = W * 0.31, x1 = W * 0.69;
        STAGES.forEach(function (s, i) { stg.push({ k: s.k, s: s.s, x: x0 + (x1 - x0) * i / (STAGES.length - 1), y: H * 0.43, r: Math.min(32 * K, W * 0.027) }); });
        var ow = Math.min(196 * K, W * 0.17), oh = (H - 40) / OUTPUTS.length - 12;
        OUTPUTS.forEach(function (n, i) { out.push({ n: n, x: W - ow - W * 0.015, y: 20 + i * (oh + 12) + 6, w: ow, h: oh }); });
        statY = H - 32 * K;
      } else {
        var cols = 2, cw = (W - 44) / cols, rows = Math.ceil(SOURCES.length / cols);
        SOURCES.forEach(function (n, i) { src.push({ n: n, x: 14 + (i % cols) * (cw + 16), y: 14 + Math.floor(i / cols) * 38, w: cw, h: 28 }); });
        var y0 = 14 + rows * 38 + 60, y1 = y0 + 290;
        STAGES.forEach(function (s, i) { stg.push({ k: s.k, s: s.s, x: W * 0.3, y: y0 + (y1 - y0) * i / (STAGES.length - 1), r: 24 }); });
        var oy = y1 + 90, ow2 = (W - 44) / 2, oh2 = 66;
        OUTPUTS.forEach(function (n, i) {
          var full = i === OUTPUTS.length - 1;
          out.push({ n: n, x: full ? 14 : 14 + (i % 2) * (ow2 + 16), y: oy + Math.floor(i / 2) * (oh2 + 12), w: full ? W - 28 : ow2, h: oh2 });
        });
        var oy2 = oy + 3 * (oh2 + 12);
        H = oy2 + 52; statY = oy2 + 12;
      }
      L = { src: src, stg: stg, out: out, statY: statY };
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function sA(s) { return vert ? { x: s.x + s.w / 2, y: s.y + s.h } : { x: s.x + s.w, y: s.y + s.h / 2 }; }
    function oA(o) { return vert ? { x: o.x + o.w / 2, y: o.y } : { x: o.x, y: o.y + o.h / 2 }; }
    function curve(a, b) {
      if (vert) { var my = (a.y + b.y) / 2; return [a, { x: a.x, y: my }, { x: b.x, y: my }, b]; }
      var mx = (a.x + b.x) / 2; return [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b];
    }
    function spawn() {
      parts.push({ si: Math.floor(Math.random() * SOURCES.length), oi: Math.floor(Math.random() * OUTPUTS.length), leg: 0, t: 0, sp: 0.55 + Math.random() * 0.7, exc: Math.random() < 0.055, done: false, orbit: 0, j: (Math.random() - 0.5) * 6, tr: [] });
    }
    function pos(p) {
      var st = L.stg, c;
      if (p.leg === 0) { c = curve(sA(L.src[p.si]), st[0]); return bez(c[0], c[1], c[2], c[3], ease(p.t)); }
      if (p.leg >= 1 && p.leg <= 3) {
        var a = st[p.leg - 1], b = st[p.leg];
        if (p.orbit > 0) {
          var ang = p.orbit * Math.PI * 2, R = a.r + 20;
          return vert ? { x: a.x + Math.cos(ang) * 16 - 62, y: a.y + Math.sin(ang) * R * 0.6 } : { x: a.x + Math.cos(ang) * R, y: a.y - 48 * K + Math.sin(ang) * 16 };
        }
        var t = ease(p.t);
        return { x: a.x + (b.x - a.x) * t + (vert ? p.j : 0), y: a.y + (b.y - a.y) * t + (vert ? 0 : p.j) };
      }
      c = curve(st[3], oA(L.out[p.oi])); return bez(c[0], c[1], c[2], c[3], ease(p.t));
    }
    function step(dt, quiet) {
      acc += dt;
      while (acc > 0.05) { acc -= 0.05; if (parts.length < 230) spawn(); }
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        if (p.orbit > 0) {
          p.orbit += dt * 0.8;
          if (p.orbit >= 1.999) { p.orbit = 0; p.done = true; cleared++; if (!quiet) { var q = pos(p); flashes.push({ x: q.x, y: q.y, t: 0 }); } }
        } else {
          p.t += dt * p.sp * (p.leg === 0 || p.leg === 4 ? 0.55 : 1.1);
          if (p.t >= 1) {
            p.t = 0; p.leg++;
            if (p.leg >= 1 && p.leg <= 4) pulses[p.leg - 1] = 1;
            if (p.leg === 2 && p.exc && !p.done) { p.orbit = 0.001; held++; }
            if (p.leg === 5) {
              glow[p.oi] = 1;
              var s = series[p.oi], lv = s[s.length - 1];
              s.push(Math.max(0.15, Math.min(0.95, lv + (0.58 - lv) * 0.2 + (Math.random() - 0.5) * 0.26))); s.shift();
              shown[p.oi].push(0); shown[p.oi].shift();
              records += 23 + Math.floor(Math.random() * 70);
              parts.splice(i, 1); continue;
            }
          }
        }
        if (!quiet) { var pp = pos(p); p.tr.push(pp); if (p.tr.length > 7) p.tr.shift(); }
      }
      for (var k = 0; k < pulses.length; k++) pulses[k] = Math.max(0, pulses[k] - dt * 2.2);
      for (var m = 0; m < glow.length; m++) glow[m] = Math.max(0, glow[m] - dt * 1.4);
      for (var f = flashes.length - 1; f >= 0; f--) { flashes[f].t += dt; if (flashes[f].t > 0.9) flashes.splice(f, 1); }
      var lerp = quiet ? 1 : Math.min(1, dt * 6);
      shown.forEach(function (s, a) { s.forEach(function (v, b) { s[b] = v + (series[a][b] - v) * lerp; }); });
      shownRecords += (records - shownRecords) * (quiet ? 1 : Math.min(1, dt * 4));
    }
    function draw(now) {
      var time = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      // connectors
      ctx.lineWidth = 1; ctx.strokeStyle = C.line;
      L.src.forEach(function (s) { var c = curve(sA(s), L.stg[0]); ctx.beginPath(); ctx.moveTo(c[0].x, c[0].y); ctx.bezierCurveTo(c[1].x, c[1].y, c[2].x, c[2].y, c[3].x, c[3].y); ctx.stroke(); });
      L.out.forEach(function (o) { var c = curve(L.stg[3], oA(o)); ctx.beginPath(); ctx.moveTo(c[0].x, c[0].y); ctx.bezierCurveTo(c[1].x, c[1].y, c[2].x, c[2].y, c[3].x, c[3].y); ctx.stroke(); });
      ctx.setLineDash([3, 7]); ctx.lineDashOffset = -time * 32;
      for (var i = 0; i < 3; i++) { var a = L.stg[i], b = L.stg[i + 1]; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      ctx.setLineDash([]);
      // ambient glow behind tie-out stage
      var ts = L.stg[3], br = 0.55 + 0.25 * Math.sin(time * 1.6);
      ctx.globalAlpha = 0.35 * br; ctx.drawImage(SP.big, ts.x - 60 * K * 1.4, ts.y - 60 * K * 1.4, 120 * K * 1.4, 120 * K * 1.4); ctx.globalAlpha = 1;

      // sources
      ctx.textBaseline = "middle";
      L.src.forEach(function (s, i) {
        rr(ctx, s.x, s.y, s.w, s.h, 6); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
        var on = Math.sin(time * 2.6 + i * 1.9);
        ctx.fillStyle = on > 0 ? C.flow : C.mut; ctx.globalAlpha = on > 0 ? 0.6 + on * 0.4 : 0.8;
        ctx.beginPath(); ctx.arc(s.x + 12 * K, s.y + s.h / 2, 3 * K, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = C.fg; ctx.textAlign = "left"; ctx.font = F("500", 11.5, MONO);
        ctx.fillText(s.n, s.x + 22 * K, s.y + s.h / 2 + 1);
      });

      // particles: trails + glow
      ctx.lineCap = "round";
      parts.forEach(function (p) {
        var col = p.orbit > 0 ? C.warn : (p.leg >= 4 ? C.tie : C.flow);
        if (p.tr.length > 1) {
          ctx.strokeStyle = col; ctx.lineWidth = 1.6 * K; ctx.globalAlpha = 0.28;
          ctx.beginPath(); ctx.moveTo(p.tr[0].x, p.tr[0].y);
          for (var q = 1; q < p.tr.length; q++) ctx.lineTo(p.tr[q].x, p.tr[q].y);
          ctx.stroke(); ctx.globalAlpha = 1;
        }
      });
      ctx.globalCompositeOperation = "lighter";
      parts.forEach(function (p) {
        var q = pos(p), spr = p.orbit > 0 ? SP.warn : (p.leg >= 4 ? SP.tie : SP.flow), r = (p.orbit > 0 ? 16 : 11) * K;
        ctx.drawImage(spr, q.x - r, q.y - r, r * 2, r * 2);
      });
      ctx.globalCompositeOperation = "source-over";
      parts.forEach(function (p) {
        var q = pos(p); ctx.fillStyle = p.orbit > 0 ? C.warn : (p.leg >= 4 ? C.tie : C.fg);
        ctx.beginPath(); ctx.arc(q.x, q.y, (p.orbit > 0 ? 2.6 : 1.9) * K, 0, 6.283); ctx.fill();
      });
      // exception resolved flashes
      flashes.forEach(function (f) {
        var k = f.t / 0.9;
        ctx.strokeStyle = C.tie; ctx.globalAlpha = 1 - k; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(f.x, f.y, 4 + k * 16, 0, 6.283); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(f.x - 4, f.y); ctx.lineTo(f.x - 1, f.y + 3); ctx.lineTo(f.x + 5, f.y - 4); ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // stages
      L.stg.forEach(function (s, i) {
        var lastS = i === 3, pr = pulses[i], wave = 0.5 + 0.5 * Math.sin(time * 2.2 - i * 0.9);
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(time * (i % 2 ? -0.45 : 0.45));
        ctx.setLineDash([2, 6]); ctx.strokeStyle = lastS ? C.tie : C.mut; ctx.globalAlpha = 0.45 + wave * 0.4; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(0, 0, s.r + 9, 0, 6.283); ctx.stroke(); ctx.restore(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        if (pr > 0) { ctx.strokeStyle = lastS ? C.tie : C.flow; ctx.globalAlpha = pr * 0.55; ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 9 + (1 - pr) * 18, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
        var g = ctx.createRadialGradient(s.x, s.y - s.r * 0.5, 2, s.x, s.y, s.r);
        g.addColorStop(0, C.card); g.addColorStop(1, C.card2);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
        ctx.strokeStyle = lastS ? C.tie : C.fg; ctx.globalAlpha = lastS ? 1 : 0.7 + wave * 0.3; ctx.lineWidth = 1.4; ctx.stroke(); ctx.lineWidth = 1; ctx.globalAlpha = 1;
        if (lastS) {
          ctx.strokeStyle = C.tie2; ctx.lineWidth = 1.6; var hw = s.r * 0.45;
          ctx.beginPath(); ctx.moveTo(s.x - hw, s.y + 4); ctx.lineTo(s.x + hw, s.y + 4); ctx.moveTo(s.x - hw, s.y + 8); ctx.lineTo(s.x + hw, s.y + 8); ctx.stroke(); ctx.lineWidth = 1;
        }
        ctx.fillStyle = lastS ? C.tie : C.fg; ctx.textAlign = "center"; ctx.font = F("600", 12.5, DISP);
        ctx.fillText(String(i + 1).padStart(2, "0"), s.x, lastS ? s.y - 6 : s.y + 1);
        var lx = vert ? s.x + s.r + 20 : s.x, ly = vert ? s.y - 7 : s.y + s.r + 27 * K;
        ctx.textAlign = vert ? "left" : "center";
        ctx.fillStyle = C.fg; ctx.font = F("500", 11, MONO); ctx.fillText(s.k, lx, ly);
        ctx.fillStyle = C.mut; ctx.font = F("400", 11, BODY); ctx.fillText(s.s, lx, ly + 15 * K);
      });

      // outputs (dashboards update smoothly)
      L.out.forEach(function (o, i) {
        rr(ctx, o.x, o.y, o.w, o.h, 8); ctx.fillStyle = C.card; ctx.fill();
        var gl = glow[i];
        ctx.strokeStyle = gl > 0.05 ? C.tie : C.line; ctx.globalAlpha = gl > 0.05 ? 0.35 + gl * 0.65 : 1; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.textAlign = "left"; ctx.fillStyle = C.fg; ctx.font = F("600", 12, DISP); ctx.fillText(o.n, o.x + 12, o.y + 15 * K);
        ctx.fillStyle = gl > 0.05 ? C.tie : C.mut; ctx.globalAlpha = gl > 0.05 ? gl : 0.6; ctx.beginPath(); ctx.arc(o.x + o.w - 12, o.y + 15 * K, 2.6, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
        var s = shown[i], cx = o.x + 12, cw = o.w - 24, cy = o.y + 27 * K, ch = o.h - 35 * K;
        if (ch > 10) {
          if (i % 2 === 0) {
            var bw = cw / s.length;
            s.forEach(function (v, j) { var lb = j === s.length - 1; ctx.fillStyle = lb ? C.tie : C.mut; ctx.globalAlpha = lb ? 1 : 0.35; ctx.fillRect(cx + j * bw + 1, cy + ch - v * ch, bw - 3, v * ch); });
            ctx.globalAlpha = 1;
          } else {
            var grd = ctx.createLinearGradient(0, cy, 0, cy + ch); grd.addColorStop(0, C.tie); grd.addColorStop(1, "transparent");
            ctx.beginPath();
            s.forEach(function (v, j) { var x = cx + cw * j / (s.length - 1), y = cy + ch - v * ch; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
            ctx.strokeStyle = C.tie; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.lineTo(cx + cw, cy + ch); ctx.lineTo(cx, cy + ch); ctx.closePath(); ctx.globalAlpha = 0.16; ctx.fillStyle = grd; ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 1;
            var lv = s[s.length - 1]; ctx.fillStyle = C.tie; ctx.beginPath(); ctx.arc(cx + cw, cy + ch - lv * ch, 2.6, 0, 6.283); ctx.fill();
          }
        }
      });

      var stats = [["RECORDS (SIM.)", Math.round(shownRecords).toLocaleString("en-US")], [vert ? "EXCEPTIONS" : "EXCEPTIONS CLEARED", cleared + " / " + held], [vert ? "GL VARIANCE" : "VARIANCE TO GL", "$0.00"]];
      ctx.textAlign = vert ? "left" : "center";
      stats.forEach(function (st, i) {
        var x = vert ? 14 + i * ((W - 28) / 3) : W * 0.33 + i * W * 0.17;
        ctx.fillStyle = C.mut; ctx.font = F("400", 9.5, MONO); ctx.fillText(st[0], x, L.statY);
        ctx.fillStyle = i === 2 ? C.tie2 : C.fg; ctx.font = F("600", 15, DISP); ctx.fillText(st[1], x, L.statY + 18 * K);
      });
    }
    function frame(now) {
      if (!running) return;
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      step(dt, false); draw(now);
      requestAnimationFrame(frame);
    }
    layout();
    for (var w = 0; w < 200; w++) step(0.03, true);
    draw(performance.now());
    if (!reduce && "IntersectionObserver" in window) {
      var inView = false;
      var kick = function () { var was = running; running = inView && !document.hidden; if (running && !was) { last = 0; requestAnimationFrame(frame); } };
      new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; kick(); }); }, { threshold: 0.02 }).observe(host);
      document.addEventListener("visibilitychange", kick);
    }
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { layout(); draw(performance.now()); }, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(performance.now()); });
    window.addEventListener("tp:palette", function () { readColors(); draw(performance.now()); });
  }
  function boot() { document.querySelectorAll("[data-pipeline]").forEach(init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
