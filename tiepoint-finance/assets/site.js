/* TiePoint Finance: site behaviour. Vanilla JS, no dependencies. */
(function () {
  "use strict";

  /* ================================================================
     BOOKING EMAIL: the only place the address is defined.
     Every element with [data-book] becomes a mailto link, and every
     [data-email] element shows the address. Change it here only.
     ================================================================ */
  var BOOKING_EMAIL = "hello@tiepointfinance.com";
  var DEFAULT_SUBJECT = "Discovery call request - TiePoint Finance";
  var BODY = "Hello TiePoint Finance,\n\nCompany:\nRole:\nERP and other source systems:\nFP&A or BI tool (current or planned):\nNumber of entities and currencies:\nWhat we want to fix:\n\nA few times that suit us for a call:\n";

  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function mailto(subject) {
    return "mailto:" + BOOKING_EMAIL + "?subject=" + encodeURIComponent(subject || DEFAULT_SUBJECT) + "&body=" + encodeURIComponent(BODY);
  }
  /* BOOKING_URL: the Cal.com discovery-call page. Every [data-book] link opens it. */
  var BOOKING_URL = "https://cal.com/tiepoint/discovery";
  document.querySelectorAll("[data-book]").forEach(function (a) {
    a.setAttribute("href", BOOKING_URL);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });
  document.querySelectorAll("[data-mail]").forEach(function (a) {
    var subj = a.getAttribute("data-subject");
    a.setAttribute("href", mailto(subj ? "Discovery call request - " + subj : DEFAULT_SUBJECT));
  });
  document.querySelectorAll("[data-email]").forEach(function (el) {
    el.textContent = BOOKING_EMAIL;
    if (el.tagName === "A") el.setAttribute("href", "mailto:" + BOOKING_EMAIL);
  });
  document.querySelectorAll("[data-email-hide]").forEach(function (el) { el.hidden = true; });

  /* header + mobile menu */
  var head = document.querySelector(".site-head");
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("site-nav");
  function setMenu(open) {
    if (!burger || !nav) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  }
  if (burger && nav) {
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); burger.focus(); } });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1180) setMenu(false); });
  }
  var onScroll = function () { if (head) head.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* reveal choreography: children of [data-stagger] cascade */
  document.querySelectorAll("[data-stagger]").forEach(function (box) {
    var step = parseFloat(box.getAttribute("data-stagger")) || 0.08;
    box.querySelectorAll(":scope > .rv, :scope > .rv-clip").forEach(function (el, i) { el.style.setProperty("--rd", (i * step).toFixed(2) + "s"); });
  });
  var reveal = document.querySelectorAll(".rv, .rv-clip");
  if (reduce || !("IntersectionObserver" in window)) {
    reveal.forEach(function (el) { el.classList.add("in"); });
  } else {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    reveal.forEach(function (el) { rio.observe(el); });
  }

  /* run CSS/SVG animations only while on screen */
  function watch(el, cb) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { threshold: 0.02 }).observe(el);
  }
  if (!reduce) {
    document.querySelectorAll(".anim").forEach(function (el) { watch(el, function (on) { el.classList.toggle("is-on", on); }); });
  }
  document.addEventListener("visibilitychange", function () {
    document.querySelectorAll(".anim").forEach(function (el) { if (document.hidden) el.classList.remove("is-on"); });
  });

  /* process timeline: progresses phase by phase, gates sign off, loops */
  document.querySelectorAll("[data-timeline]").forEach(function (tl) {
    var phases = tl.querySelectorAll(".phase");
    var n = phases.length, i = 0, timer = null, visible = false;
    function paint(k) {
      phases.forEach(function (p, j) {
        p.classList.toggle("done", j < k);
        p.classList.toggle("active", j === k);
      });
      tl.style.setProperty("--p", Math.min(1, k / (n - 1 || 1)).toFixed(3));
    }
    if (reduce) { tl.classList.add("static"); phases.forEach(function (p) { p.classList.add("done"); }); tl.style.setProperty("--p", 1); return; }
    function stepTl() {
      paint(i);
      var wait = i === n ? 3200 : 2300;
      i = i >= n ? 0 : i + 1;
      timer = setTimeout(function () { if (visible) stepTl(); else timer = null; }, wait);
    }
    paint(0);
    watch(tl, function (on) { visible = on; if (on && !timer) stepTl(); });
  });

  /* hero tie-out console: rows reconcile, variance settles to $0.00, loops by entity */
  var con = document.querySelector("[data-console]");
  if (con) {
    var ENT = [
      { k: "US", c: "USD", rows: [["4000 Product revenue", 2841650], ["4100 Services revenue", 612480], ["5000 Cost of goods sold", 1288310], ["6100 Payroll", 734920], ["6400 Software", 88140], ["1200 Intercompany receivable", 156000]] },
      { k: "UK", c: "GBP", rows: [["4000 Product revenue", 1104230], ["5000 Cost of goods sold", 498760], ["6100 Payroll", 402110], ["6300 Rent", 61500], ["7200 FX gain or loss", 8240], ["2200 Intercompany payable", 123100]] },
      { k: "DE", c: "EUR", rows: [["4100 Services revenue", 1482500], ["6100 Payroll", 914200], ["6300 Rent", 89500], ["6400 Software", 41800], ["6900 Other expenses", 26400], ["2200 Intercompany payable", 33000]] },
      { k: "Group", c: "USD", rows: [["Revenue, consolidated", 5482110], ["Cost of goods sold", 1922040], ["Operating expenses", 1980330], ["FX translation", 12460], ["IC eliminations", 0], ["Net income", 1567280]] }
    ];
    var tabs = con.querySelectorAll(".con-tabs span");
    var tbody = con.querySelector("tbody");
    var total = con.querySelector(".con-total");
    var status = con.querySelector(".con-status");
    var checks = con.querySelectorAll(".con-checks i");
    var cur = con.querySelector("[data-cur]");
    var fmt = function (v) { return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var CK = '<svg class="ck" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7.5l2.5 2.5L11 4.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
    var e = 0, running = false, timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearAll() { timers.forEach(clearTimeout); timers = []; }
    function build(ent, settled) {
      tabs.forEach(function (t, j) { t.classList.toggle("on", j === e); });
      if (cur) cur.textContent = ent.c;
      var html = "", diffs = [], sum = 0;
      ent.rows.forEach(function (r, j) {
        var d = settled ? 0 : (j % 2 === 1 || j === 4 ? Math.round((Math.random() * 2400 + 180) * 100) / 100 * (j === 4 ? -1 : 1) : 0);
        diffs.push(d); sum += Math.abs(d);
        var cls = d ? "var" : (settled ? "ok" : "");
        html += '<tr class="' + cls + '"><td>' + r[0] + "</td><td>" + fmt(r[1] + d) + "</td><td>" + fmt(r[1]) + '</td><td class="d">' + (d ? (d > 0 ? "+" : "−") + fmt(Math.abs(d)) : "0.00") + CK + "</td></tr>";
      });
      tbody.innerHTML = html;
      return { diffs: diffs, sum: sum };
    }
    function setTotal(v) { total.textContent = "$" + fmt(v); total.classList.toggle("zero", v === 0); }
    function finalState() {
      build(ENT[e], true); setTotal(0);
      status.textContent = "All 5 checks tied"; status.classList.add("done");
      checks.forEach(function (c) { c.classList.add("on"); });
    }
    function cycle() {
      clearAll();
      var ent = ENT[e], b = build(ent, false), rows = tbody.querySelectorAll("tr"), remaining = b.sum;
      status.textContent = "Reconciling " + ent.k; status.classList.remove("done");
      checks.forEach(function (c) { c.classList.remove("on"); });
      setTotal(remaining);
      var t = 700;
      rows.forEach(function (tr, j) {
        later(function () {
          rows.forEach(function (x) { x.classList.remove("scan"); });
          tr.classList.add("scan");
          var d = Math.abs(b.diffs[j]);
          if (d) {
            var cells = tr.querySelectorAll("td"), start = performance.now(), from = remaining;
            (function anim(now) {
              var k = Math.min(1, (now - start) / 520), v = d * (1 - k);
              cells[3].firstChild.nodeValue = (b.diffs[j] > 0 ? "+" : "−") + fmt(v);
              cells[1].textContent = fmt(ent.rows[j][1] + Math.sign(b.diffs[j]) * v);
              setTotal(Math.max(0, Math.round((from - d * k) * 100) / 100));
              if (k < 1) requestAnimationFrame(anim);
              else { cells[3].firstChild.nodeValue = "0.00"; tr.classList.remove("var"); tr.classList.add("ok"); }
            })(start);
            remaining -= d;
          } else { tr.classList.add("ok"); }
          var ci = Math.floor((j + 1) * checks.length / rows.length) - 1;
          for (var q = 0; q <= ci; q++) checks[q].classList.add("on");
        }, t);
        t += b.diffs[j] ? 900 : 420;
      });
      later(function () {
        rows.forEach(function (x) { x.classList.remove("scan"); });
        setTotal(0); status.textContent = "All 5 checks tied"; status.classList.add("done");
        checks.forEach(function (c) { c.classList.add("on"); });
      }, t + 200);
      later(function () { e = (e + 1) % ENT.length; if (running) cycle(); }, t + 3400);
    }
    if (reduce) finalState();
    else {
      finalState();
      watch(con, function (on) {
        if (on && !running) { running = true; cycle(); }
        else if (!on && running) { running = false; clearAll(); finalState(); }
      });
    }
  }

  /* print buttons */
  document.querySelectorAll("[data-print]").forEach(function (b) { b.addEventListener("click", function () { window.print(); }); });

  /* article: table-of-contents scroll-spy and reading progress */
  var toc = document.querySelector(".toc");
  if (toc) {
    var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    var bar = document.querySelector(".progress");
    var art = document.querySelector(".article");
    var spy = function () {
      var y = window.scrollY + 120, idx = 0;
      targets.forEach(function (t, i) { if (t.offsetTop <= y) idx = i; });
      links.forEach(function (a, i) { a.classList.toggle("on", i === idx); });
      if (bar && art) {
        var r = art.getBoundingClientRect(), h = art.offsetHeight - window.innerHeight * 0.6;
        bar.style.setProperty("--read", Math.max(0, Math.min(1, -r.top / Math.max(1, h))).toFixed(4));
      }
    };
    window.addEventListener("scroll", spy, { passive: true }); spy();
  }
})();
