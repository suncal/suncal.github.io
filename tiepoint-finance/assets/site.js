/* TiePoint Finance: navigation, reveal-on-scroll and the hero tie-out card. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // mobile menu
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("site-nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", open ? "false" : "true");
      nav.classList.toggle("open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        burger.setAttribute("aria-expanded", "false");
        nav.classList.remove("open");
        burger.focus();
      }
    });
  }

  // reveal on scroll
  var items = document.querySelectorAll(".rv");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  }

  // year
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // hero tie-out card: checks resolve one by one, then loop
  var card = document.querySelector("[data-tiecard]");
  if (card) {
    var rows = card.querySelectorAll(".tc-row");
    var status = card.querySelector(".tc-status");
    var finalVals = Array.prototype.map.call(rows, function (r) { return r.querySelector(".tc-val").textContent; });
    function setAll(done) {
      rows.forEach(function (r, i) {
        r.classList.toggle("ok", done); r.classList.remove("run");
        r.querySelector(".tc-val").textContent = done ? finalVals[i] : "queued";
      });
      status.textContent = done ? "All 5 tied" : "Running";
      status.classList.toggle("done", done);
    }
    if (reduce) { setAll(true); return; }
    var i = 0;
    function tick() {
      if (i === 0) setAll(false);
      if (i < rows.length) {
        var r = rows[i];
        r.classList.add("run"); r.querySelector(".tc-val").textContent = "checking";
        setTimeout(function () {
          r.classList.remove("run"); r.classList.add("ok");
          r.querySelector(".tc-val").textContent = finalVals[i];
          i++;
          if (i === rows.length) { status.textContent = "All 5 tied"; status.classList.add("done"); }
          setTimeout(tick, i === rows.length ? 5200 : 380);
        }, 900);
      } else { i = 0; tick(); }
    }
    setTimeout(tick, 700);
  }
})();
