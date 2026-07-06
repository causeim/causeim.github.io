/* =============================================================
   CauseIM — client-side behaviors
   - Theme toggle (light / dark) with system + localStorage
   - Mobile nav toggle
   - BibTeX copy buttons
   - Active nav highlighting
   - Year stamp
   ============================================================ */

(function () {
  "use strict";

  // ---------- Theme ----------
  var root = document.documentElement;
  var THEME_KEY = "causeim-theme";

  function getInitialTheme() {
    try {
      var stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") return stored;
    } catch (e) {}
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }

  applyTheme(getInitialTheme());

  // Theme toggles (there can be more than one on a page)
  document.addEventListener("click", function (e) {
    var target = e.target.closest(".theme-toggle");
    if (!target) return;
    var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  // ---------- Mobile nav ----------
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest(".nav-toggle");
    if (!toggle) return;
    var links = document.getElementById("nav-links");
    if (!links) return;
    var isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close mobile nav when a link is clicked
  document.addEventListener("click", function (e) {
    var link = e.target.closest(".nav-links a");
    if (!link) return;
    var links = document.getElementById("nav-links");
    if (links && links.classList.contains("open")) {
      links.classList.remove("open");
      var toggle = document.querySelector(".nav-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  });

  // ---------- BibTeX copy ----------
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".copy-btn");
    if (!btn) return;
    var id = btn.getAttribute("data-copy");
    var pre = id ? document.getElementById(id) : null;
    if (!pre) return;

    var text = pre.innerText;
    var done = function () {
      var prev = btn.textContent;
      btn.textContent = "Copied";
      btn.classList.add("copied");
      setTimeout(function () {
        btn.textContent = prev;
        btn.classList.remove("copied");
      }, 1600);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(done)
        .catch(function () {
          fallbackCopy(text);
          done();
        });
    } else {
      fallbackCopy(text);
      done();
    }
  });

  function fallbackCopy(text) {
    var t = document.createElement("textarea");
    t.value = text;
    t.style.position = "fixed";
    t.style.left = "-9999px";
    document.body.appendChild(t);
    t.select();
    try {
      document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(t);
  }

  // ---------- Year stamp ----------
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // ---------- Active nav highlighting (by filename) ----------
  try {
    var path = window.location.pathname.split("/").pop() || "index.html";
    var links = document.querySelectorAll(".nav-links a[href]");
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.indexOf("#") === 0) return;
      if (href === path) a.classList.add("active");
    });
  } catch (e) {}

  // ---------- Site view counter (GoatCounter public counter) ----------
  // Requires "Public statistics" or the counter endpoint enabled on
  // https://causeim.goatcounter.com/settings/main
  var counterEl = document.getElementById("site-views");
  if (counterEl && "fetch" in window) {
    fetch("https://causeim.goatcounter.com/counter/TOTAL.json", { mode: "cors" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        // GoatCounter returns { count: "N", count_unique: "M" } (strings)
        var n = parseInt(data.count_unique || data.count || "0", 10);
        if (!isNaN(n)) counterEl.textContent = n.toLocaleString();
      })
      .catch(function () { /* silently fail — counter stays as '—' */ });
  }
  // ---------- Per-paper click tracking (GoatCounter events) ----------
  // Every <a data-track-paper="ID"> fires a GoatCounter event on click.
  // Events show up in the GoatCounter dashboard under "Paths" prefixed
  // with 'paper-click/'.
  //
  // Strategy: prefer window.goatcounter.count() (loaded by count.js) so
  // GoatCounter's own encoding + endpoint handling is used. Fall back to
  // a GET Image beacon with e=t (the standard "this is an event" flag).
  function trackPaperClick(paperId) {
    var path = "paper-click/" + paperId;
    var title = "Paper click: " + paperId;

    // Preferred: use GoatCounter's own count() (same code path as pageviews)
    if (window.goatcounter && typeof window.goatcounter.count === "function") {
      try {
        window.goatcounter.count({ path: path, title: title, event: true });
        return;
      } catch (e) { /* fall through */ }
    }

    // Fallback: GET Image beacon (works cross-origin without CORS issues)
    try {
      var q = "p=" + encodeURIComponent(path) +
              "&t=" + encodeURIComponent(title) +
              "&e=t" +
              "&rnd=" + Math.random().toString(36).slice(2);
      var img = new Image(1, 1);
      img.src = "https://causeim.goatcounter.com/count?" + q;
    } catch (e) { /* ignore */ }
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("a[data-track-paper]");
    if (!link) return;
    var paperId = link.getAttribute("data-track-paper");
    if (paperId) trackPaperClick(paperId);
  }, true);

  // ---------- Per-paper click count display ----------
  // Each <span class="paper-clicks" data-paper-id="ID"> shows the total
  // click count fetched from GoatCounter's public counter endpoint.
  // Requires "Public statistics" enabled in GoatCounter settings.
  document.querySelectorAll(".paper-clicks[data-paper-id]").forEach(function (el) {
    var id = el.getAttribute("data-paper-id");
    if (!id || !("fetch" in window)) return;
    var url = "https://causeim.goatcounter.com/counter/paper-click/" +
              encodeURIComponent(id) + ".json";
    fetch(url, { mode: "cors" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var raw = data.count_unique || data.count || "0";
        var n = parseInt(String(raw).replace(/[^0-9]/g, ""), 10);
        if (isNaN(n)) return;
        var countEl = el.querySelector(".paper-clicks-count");
        if (countEl) countEl.textContent = n.toLocaleString();
      })
      .catch(function () { /* silently keep '—' */ });
  });

})();
