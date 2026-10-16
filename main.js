/* ==================================================================
 * Wellspring — main.js
 * Vanilla JavaScript only. One function per feature, guard clauses.
 * Content data (donation amounts, spending split, chart figures) lives
 * in the arrays below so it can be edited without touching the logic.
 * ================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------
   * DATA
   * ---------------------------------------------------------------- */

  // Quick-give card on the homepage.
  var QUICK_IMPACT = {
    once: {
      10: "£10 buys a field kit that tests a water source for E. coli and arsenic.",
      25: "£25 builds a handwashing station for a primary school classroom.",
      50: "£50 trains a village pump mechanic and gives them a full toolkit."
    },
    monthly: {
      10: "£10 a month keeps a school health club stocked with soap for a year.",
      25: "£25 a month keeps a hand pump serving 300 people repaired and running for a whole year.",
      50: "£50 a month funds a school latrine block with a private girls’ washroom."
    }
  };

  // Donate page preset amounts. Each one shows what it pays for.
  var DONATE_AMOUNTS = {
    once: [
      { v: 30,  text: "tests 40 village water sources for contamination" },
      { v: 60,  text: "builds a handwashing station for a school classroom" },
      { v: 150, text: "trains and equips one community pump mechanic" },
      { v: 500, text: "covers a village’s share of a protected spring box" }
    ],
    monthly: [
      { v: 10,  text: "keeps a school health club stocked with soap" },
      { v: 25,  text: "keeps a hand pump for 300 people running all year" },
      { v: 50,  text: "funds a school latrine block with a girls’ washroom" },
      { v: 100, text: "drills around five metres of borehole every month" }
    ]
  };
  var COST_PER_PERSON = 25;      // £ to bring safe water to one person
  var TAX_RELIEF_RATE = 0.25;    // extra a charity can reclaim on an eligible gift

  // Homepage "where your money goes" donut (must match the legend list).
  var SPEND = [
    { label: "Water points & sanitation", pct: 64, color: "#0b6782" },
    { label: "Hygiene & schools",          pct: 14, color: "#4fbccd" },
    { label: "Monitoring & repairs",       pct: 9,  color: "#3f8f5a" },
    { label: "Training local partners",    pct: 5,  color: "#f4b740" },
    { label: "Fundraising",                pct: 6,  color: "#c8623d" },
    { label: "Governance & admin",         pct: 2,  color: "#8fa1a6" }
  ];

  // Stories page: minutes per household per day spent collecting water.
  var COLLECTION_MINUTES = {
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    values: [205, 198, 190, 46, 16, 14, 12, 13, 12, 12, 11, 12],
    marker: 3 // index of the month the borehole opened
  };

  // About page: five years of income and expenditure, £ millions.
  var FINANCES = {
    years: ["2020/21", "2021/22", "2022/23", "2023/24", "2024/25"],
    income: [9.8, 10.9, 12.1, 13.4, 15.2],
    spend: [9.4, 10.5, 11.8, 13.1, 14.6]
  };

  var prefersReduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVGNS, name);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function money(n) {
    var fixed = Math.round(n * 100) / 100;
    var s = fixed % 1 === 0 ? String(fixed) : fixed.toFixed(2);
    return "£" + s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  /* ----------------------------------------------------------------
   * Mobile navigation: close the collapse after a link is tapped.
   * ---------------------------------------------------------------- */
  function initNav() {
    var collapse = document.getElementById("primary-nav");
    if (!collapse || !window.bootstrap) return;
    collapse.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (!collapse.classList.contains("show")) return;
        var inst = window.bootstrap.Collapse.getInstance(collapse);
        if (inst) inst.hide();
      });
    });
  }

  /* ----------------------------------------------------------------
   * Sticky navbar shadow once the page scrolls.
   * ---------------------------------------------------------------- */
  function initStickyNav() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 10); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----------------------------------------------------------------
   * Reveal-on-scroll and progress bars (IntersectionObserver).
   * ---------------------------------------------------------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal, .bar");
    if (!els.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        o.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ----------------------------------------------------------------
   * Count-up numbers. The final value is already in the HTML, so
   * nothing is lost without JavaScript.
   * ---------------------------------------------------------------- */
  function initCountUp() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length || prefersReduced || !("IntersectionObserver" in window)) return;

    function format(el, val) {
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var s = val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return (el.getAttribute("data-prefix") || "") + s + (el.getAttribute("data-suffix") || "");
    }
    function animate(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (isNaN(target)) return;
      var start = null;
      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / 1500, 1);
        el.textContent = format(el, target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        o.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { obs.observe(n); });
  }

  /* ----------------------------------------------------------------
   * Region tabs — WAI-ARIA tabs pattern with arrow / Home / End keys.
   * Without JavaScript every panel is simply shown in sequence.
   * ---------------------------------------------------------------- */
  function initTabs() {
    var lists = document.querySelectorAll("[data-tabs]");
    if (!lists.length) return;
    lists.forEach(function (list) {
      var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;
      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", on ? "true" : "false");
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { select(tab, false); });
        tab.addEventListener("keydown", function (e) {
          var next = null;
          if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
          else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (e.key === "Home") next = tabs[0];
          else if (e.key === "End") next = tabs[tabs.length - 1];
          if (next) { e.preventDefault(); select(next, true); }
        });
      });
      var current = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabs[0];
      select(current, false);
    });
  }

  /* ----------------------------------------------------------------
   * Quick-give card: updates the impact line as choices change.
   * The form itself is a plain GET to donate.html.
   * ---------------------------------------------------------------- */
  function initQuickGive() {
    var form = document.querySelector("[data-quick-give]");
    if (!form) return;
    var out = form.querySelector("[data-quick-impact]");
    if (!out) return;
    function update() {
      var freq = (form.querySelector('input[name="freq"]:checked') || {}).value || "monthly";
      var amt = (form.querySelector('input[name="amount"]:checked') || {}).value || "25";
      out.textContent = (QUICK_IMPACT[freq] || {})[amt] || "";
    }
    form.addEventListener("change", update);
    update();
  }

  /* ----------------------------------------------------------------
   * "Where your money goes" donut chart, drawn from SPEND.
   * Legend items and segments highlight each other.
   * ---------------------------------------------------------------- */
  function initSpendChart() {
    var wrap = document.querySelector("[data-spend-chart]");
    if (!wrap) return;
    var legend = document.querySelector("[data-spend-legend]");
    var size = 240, r = 92, stroke = 38, c = 2 * Math.PI * r, gap = 2;
    var svg = svgEl("svg", { viewBox: "0 0 " + size + " " + size, role: "img",
      "aria-label": "Donut chart of spending: " + SPEND.map(function (s) { return s.label + " " + s.pct + "%"; }).join(", ") });
    var g = svgEl("g", { transform: "rotate(-90 " + size / 2 + " " + size / 2 + ")" });
    var offset = 0;
    var segs = SPEND.map(function (s, i) {
      var len = c * s.pct / 100;
      var seg = svgEl("circle", {
        cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: s.color, "stroke-width": stroke,
        "stroke-dasharray": Math.max(len - gap, 0.5) + " " + (c - Math.max(len - gap, 0.5)),
        "stroke-dashoffset": String(-offset), "class": "seg", "data-i": i
      });
      offset += len;
      g.appendChild(seg);
      return seg;
    });
    svg.appendChild(g);
    wrap.insertBefore(svg, wrap.firstChild);

    var items = legend ? Array.prototype.slice.call(legend.querySelectorAll("li")) : [];
    function focus(i) {
      wrap.classList.toggle("has-focus", i !== null);
      segs.forEach(function (s, j) { s.classList.toggle("on", j === i); });
      items.forEach(function (li, j) { li.classList.toggle("on", j === i); });
    }
    segs.forEach(function (s, i) {
      s.addEventListener("mouseenter", function () { focus(i); });
      s.addEventListener("mouseleave", function () { focus(null); });
    });
    items.forEach(function (li, i) {
      li.addEventListener("mouseenter", function () { focus(i); });
      li.addEventListener("mouseleave", function () { focus(null); });
      li.addEventListener("focus", function () { focus(i); });
      li.addEventListener("blur", function () { focus(null); });
    });
  }

  /* ----------------------------------------------------------------
   * Shared front-end validation for simple forms (newsletter,
   * volunteer). Shows a success state; nothing is sent.
   * ---------------------------------------------------------------- */
  function checkField(field) {
    var ok;
    if (field.type === "checkbox") ok = field.checked;
    else {
      var val = (field.value || "").trim();
      ok = val.length > 0;
      if (ok && field.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }
    var errId = field.getAttribute("aria-describedby");
    var err = errId ? document.getElementById(errId.split(" ")[0]) : null;
    field.classList.toggle("is-invalid", !ok);
    field.setAttribute("aria-invalid", ok ? "false" : "true");
    if (err) err.classList.toggle("show", !ok);
    return ok;
  }

  function validateGroup(scope) {
    var firstBad = null;
    scope.querySelectorAll("[data-required]").forEach(function (f) {
      if (f.closest("[hidden]")) return;
      if (!checkField(f) && !firstBad) firstBad = f;
    });
    scope.querySelectorAll("[data-required-group]").forEach(function (grp) {
      var boxes = grp.querySelectorAll("input[type=checkbox]");
      var any = Array.prototype.some.call(boxes, function (b) { return b.checked; });
      var err = document.getElementById(grp.getAttribute("data-required-group"));
      if (err) err.classList.toggle("show", !any);
      if (!any && !firstBad) firstBad = boxes[0];
    });
    return firstBad;
  }

  function initForms() {
    var forms = document.querySelectorAll("form[data-validate]");
    if (!forms.length) return;
    forms.forEach(function (form) {
      var success = form.querySelector(".form-success");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var firstBad = validateGroup(form);
        if (firstBad) {
          if (success) success.classList.remove("show");
          firstBad.focus();
          return;
        }
        form.reset();
        if (success) { success.classList.add("show"); success.focus(); }
      });
      form.querySelectorAll("[data-required]").forEach(function (f) {
        f.addEventListener(f.type === "checkbox" ? "change" : "input", function () {
          if (f.classList.contains("is-invalid")) checkField(f);
        });
      });
    });
  }

  /* ----------------------------------------------------------------
   * Donation form: frequency toggle, preset amounts with impact,
   * custom amount, tax relief, dedication and a live summary.
   * Front-end only — no payment is taken.
   * ---------------------------------------------------------------- */
  function initDonate() {
    var form = document.querySelector("[data-donate]");
    if (!form) return;
    var grid = form.querySelector("[data-amounts]");
    var custom = form.querySelector("#d-custom");
    var boost = form.querySelector("#d-boost");
    var dedicate = form.querySelector("#d-dedicate");
    var dedicateBox = form.querySelector("#dedicate-box");
    var done = document.querySelector("[data-donate-done]");
    var q = function (sel) { return document.querySelector(sel); };
    var params = new URLSearchParams(window.location.search);

    function freq() { return (form.querySelector('input[name="freq"]:checked') || {}).value || "once"; }

    function renderAmounts(keep) {
      if (!grid) return;
      var f = freq();
      var list = DONATE_AMOUNTS[f];
      grid.innerHTML = "";
      list.forEach(function (a, i) {
        var id = "d-amt-" + a.v;
        var wrap = document.createElement("div");
        wrap.className = "amount-opt";
        wrap.innerHTML =
          '<input type="radio" name="amount" id="' + id + '" value="' + a.v + '">' +
          '<label for="' + id + '"><span class="amt">£' + a.v + '</span>' +
          '<span class="per">' + (f === "monthly" ? "Every month" : "One-off") + '</span>' +
          '<span class="imp">' + a.text.charAt(0).toUpperCase() + a.text.slice(1) + '</span></label>';
        grid.appendChild(wrap);
      });
      var pick = keep && grid.querySelector('input[value="' + keep + '"]');
      if (!pick && !(custom && custom.value)) pick = grid.querySelectorAll("input")[1];
      if (pick) pick.checked = true;
    }

    function amount() {
      var picked = form.querySelector('input[name="amount"]:checked');
      if (picked) return parseFloat(picked.value);
      var v = parseFloat((custom && custom.value) || "");
      return isNaN(v) ? 0 : v;
    }
    function impactFor(a) {
      var f = freq();
      var preset = DONATE_AMOUNTS[f].filter(function (x) { return x.v === a; })[0];
      if (preset) return money(a) + (f === "monthly" ? " a month " : " ") + preset.text + ".";
      if (!a) return "Choose an amount to see what it pays for.";
      var raw = (f === "monthly" ? a * 12 : a) / COST_PER_PERSON;
      if (raw < 1) return money(a) + " covers " + Math.round(raw * 100) + "% of the cost of bringing safe water to one person.";
      var people = Math.round(raw);
      return money(a) + (f === "monthly" ? " a month" : "") + " could bring safe water to about " +
        people + (people === 1 ? " person" : " people") + (f === "monthly" ? " every year." : ".");
    }

    function update() {
      var a = amount();
      var f = freq();
      var extra = boost && boost.checked ? a * TAX_RELIEF_RATE : 0;
      var set = function (sel, txt) { var el = q(sel); if (el) el.textContent = txt; };
      set("[data-sum-amount]", a ? money(a) : "£0");
      set("[data-sum-freq]", f === "monthly" ? "every month" : "one-off gift");
      set("[data-sum-year]", f === "monthly" ? money(a * 12) + " a year" : "Not applicable");
      set("[data-sum-boost]", extra ? "+" + money(extra) : "Not added");
      set("[data-sum-total]", money(a + extra) + (f === "monthly" ? "/month" : ""));
      set("[data-sum-impact]", impactFor(a));
      set("[data-boost-extra]", a ? money(a * TAX_RELIEF_RATE) : "25%");
      set("[data-submit-label]", a ? "Donate " + money(a) + (f === "monthly" ? " a month" : "") : "Donate");
      var ded = q("[data-sum-dedication]");
      if (ded) {
        var name = (form.querySelector("#d-hon-name") || {}).value || "";
        var type = (form.querySelector('input[name="dedication"]:checked') || {}).value || "honour";
        ded.hidden = !(dedicate && dedicate.checked && name.trim());
        ded.textContent = "In " + type + " of " + name.trim();
      }
    }

    // URL parameters from the quick-give card or appeal links.
    var pf = params.get("freq");
    if (pf === "monthly" || pf === "once") {
      var r = form.querySelector('input[name="freq"][value="' + pf + '"]');
      if (r) r.checked = true;
    }
    var pa = parseFloat(params.get("amount") || "");
    renderAmounts(isNaN(pa) ? null : pa);
    if (!isNaN(pa) && !form.querySelector('input[name="amount"]:checked') && custom) {
      custom.value = pa;
    } else if (!isNaN(pa) && !form.querySelector('input[name="amount"][value="' + pa + '"]') && custom) {
      form.querySelectorAll('input[name="amount"]').forEach(function (i) { i.checked = false; });
      custom.value = pa;
    }
    var appeal = form.querySelector("#d-appeal");
    if (appeal && params.get("appeal") === "drought") appeal.value = "drought";

    form.querySelectorAll('input[name="freq"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var keepIdx = Array.prototype.indexOf.call(grid.querySelectorAll("input"), form.querySelector('input[name="amount"]:checked'));
        renderAmounts(null);
        var inputs = grid.querySelectorAll("input");
        if (keepIdx > -1 && inputs[keepIdx]) inputs[keepIdx].checked = true;
        update();
      });
    });
    if (grid) grid.addEventListener("change", function () { if (custom) custom.value = ""; checkAmount(false); update(); });
    if (custom) custom.addEventListener("input", function () {
      if (custom.value) form.querySelectorAll('input[name="amount"]').forEach(function (i) { i.checked = false; });
      checkAmount(false);
      update();
    });

    if (dedicate && dedicateBox) {
      var syncDed = function () { dedicateBox.hidden = !dedicate.checked; update(); };
      dedicate.addEventListener("change", syncDed);
      syncDed();
    }
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    function checkAmount(show) {
      var err = q("#d-amount-err");
      var ok = amount() >= 2;
      if (err && (show || ok)) err.classList.toggle("show", !ok);
      if (custom) custom.setAttribute("aria-invalid", ok ? "false" : (show ? "true" : "false"));
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var okAmt = checkAmount(true);
      var firstBad = validateGroup(form);
      if (!okAmt) { (custom || form).focus(); return; }
      if (firstBad) { firstBad.focus(); return; }
      if (!done) return;
      var f = freq();
      var msg = done.querySelector("[data-done-text]");
      if (msg) {
        msg.textContent = "You chose to give " + money(amount()) + (f === "monthly" ? " every month" : " as a one-off gift") +
          ". " + impactFor(amount()) + " As this is a demo, no payment has been taken and nothing has been sent.";
      }
      form.hidden = true;
      done.hidden = false;
      done.setAttribute("tabindex", "-1");
      done.focus();
      window.scrollTo({ top: done.getBoundingClientRect().top + window.scrollY - 120, behavior: prefersReduced ? "auto" : "smooth" });
    });

    var again = done && done.querySelector("[data-donate-again]");
    if (again) again.addEventListener("click", function () {
      form.reset();
      renderAmounts(null);
      if (dedicateBox) dedicateBox.hidden = true;
      done.hidden = true;
      form.hidden = false;
      update();
      var first = form.querySelector('input[name="freq"]:checked');
      if (first) first.focus();
    });

    update();
  }

  /* ----------------------------------------------------------------
   * Stories filter by region, with a live result count.
   * ---------------------------------------------------------------- */
  function initStoryFilter() {
    var bar = document.querySelector("[data-filter-bar]");
    if (!bar) return;
    var btns = Array.prototype.slice.call(bar.querySelectorAll("[data-filter]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-region]"));
    var count = document.querySelector("[data-filter-count]");
    var empty = document.querySelector("[data-filter-empty]");
    if (!btns.length || !cards.length) return;
    function apply(key) {
      var shown = 0;
      cards.forEach(function (c) {
        var on = key === "all" || c.getAttribute("data-region") === key;
        c.hidden = !on;
        if (on) shown++;
      });
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filter") === key ? "true" : "false"); });
      if (count) count.textContent = shown + (shown === 1 ? " story" : " stories");
      if (empty) empty.classList.toggle("show", shown === 0);
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-filter")); });
    });
    apply("all");
  }

  /* ----------------------------------------------------------------
   * Draw an SVG chart at the container's real pixel width so labels
   * stay readable on phones; redraw when the width changes.
   * ---------------------------------------------------------------- */
  function responsiveChart(box, wrapper, draw) {
    wrapper.classList.add("drawn");
    var last = 0, timer = null;
    function render() {
      var w = Math.round(box.clientWidth);
      if (!w || w === last) return;
      last = w;
      box.innerHTML = "";
      box.appendChild(draw(w));
    }
    render();
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(render, 150);
    });
  }

  /* ----------------------------------------------------------------
   * Line chart for the full story (minutes spent collecting water).
   * The data table stays in the page for screen readers / no JS.
   * ---------------------------------------------------------------- */
  function initCollectionChart() {
    var box = document.querySelector("[data-collection-chart]");
    if (!box) return;
    var d = COLLECTION_MINUTES;
    responsiveChart(box, box.closest(".chart-card"), function (W) {
      var narrow = W < 520;
      var H = narrow ? 220 : 260, L = 36, R = 10, T = 22, B = 30, max = 240;
      var x = function (i) { return L + i * (W - L - R) / (d.values.length - 1); };
      var y = function (v) { return T + (H - T - B) * (1 - v / max); };
      var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
        "aria-label": "Line chart: daily minutes collecting water fell from about 200 to 12 after the borehole opened in April." });
      [0, 60, 120, 180, 240].forEach(function (v) {
        svg.appendChild(svgEl("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: "#d6e2e1", "stroke-dasharray": v ? "3 4" : "0" }));
        var t = svgEl("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end" }); t.textContent = v; svg.appendChild(t);
      });
      d.months.forEach(function (m, i) {
        var t = svgEl("text", { x: x(i), y: H - 8, "text-anchor": "middle" });
        t.textContent = narrow ? m.charAt(0) : m;
        svg.appendChild(t);
      });
      var mx = x(d.marker);
      svg.appendChild(svgEl("line", { x1: mx, x2: mx, y1: T - 8, y2: H - B, stroke: "#f4b740", "stroke-width": 2, "stroke-dasharray": "5 4" }));
      var lab = svgEl("text", { x: mx + 8, y: T + 4, style: "fill:#835a07;font-weight:700" }); lab.textContent = "Borehole opens"; svg.appendChild(lab);
      var pts = d.values.map(function (v, i) { return x(i) + "," + y(v); });
      svg.appendChild(svgEl("path", { d: "M" + x(0) + "," + y(0) + " L" + pts.join(" L") + " L" + x(d.values.length - 1) + "," + y(0) + " Z", fill: "rgba(79,188,205,.16)" }));
      svg.appendChild(svgEl("polyline", { points: pts.join(" "), fill: "none", stroke: "#0b6782", "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round" }));
      d.values.forEach(function (v, i) {
        svg.appendChild(svgEl("circle", { cx: x(i), cy: y(v), r: narrow ? 3 : 4, fill: "#fff", stroke: "#0b6782", "stroke-width": 2 }));
      });
      return svg;
    });
  }

  /* ----------------------------------------------------------------
   * About page: grouped bar chart of income vs spending.
   * ---------------------------------------------------------------- */
  function initFinanceChart() {
    var box = document.querySelector("[data-finance-chart]");
    if (!box) return;
    var f = FINANCES;
    responsiveChart(box, box.closest(".fin-chart"), function (W) {
      var narrow = W < 560;
      var H = narrow ? 240 : 330, L = 44, R = 6, T = 24, B = 34, max = 16;
      var y = function (v) { return T + (H - T - B) * (1 - v / max); };
      var band = (W - L - R) / f.years.length, bw = Math.min(52, band / 3.2);
      var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
        "aria-label": "Bar chart of income and expenditure over five years; both rise each year, income from £9.8m to £15.2m." });
      [0, 4, 8, 12, 16].forEach(function (v) {
        svg.appendChild(svgEl("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: "#d6e2e1" }));
        var t = svgEl("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end" }); t.textContent = "£" + v + "m"; svg.appendChild(t);
      });
      f.years.forEach(function (yr, i) {
        var cx = L + band * i + band / 2;
        [["income", "#0b6782", -1], ["spend", "#f4b740", 1]].forEach(function (s) {
          var v = f[s[0]][i];
          var bx = s[2] < 0 ? cx - bw - 2 : cx + 2;
          var rect = svgEl("rect", { x: bx, y: y(v), width: bw, height: y(0) - y(v), rx: Math.min(5, bw / 3), fill: s[1] });
          var title = svgEl("title", {}); title.textContent = yr + " " + (s[0] === "income" ? "income" : "expenditure") + ": £" + v + "m";
          rect.appendChild(title);
          svg.appendChild(rect);
          if (!narrow) {
            var lab = svgEl("text", { x: bx + bw / 2, y: y(v) - 8, "text-anchor": "middle", style: "font-weight:700;fill:#1a2b30" });
            lab.textContent = v.toFixed(1); svg.appendChild(lab);
          }
        });
        var t = svgEl("text", { x: cx, y: H - 10, "text-anchor": "middle" });
        t.textContent = narrow ? yr.slice(2) : yr;
        svg.appendChild(t);
      });
      return svg;
    });
  }

  /* ----------------------------------------------------------------
   * Strategy ring (programmes page): animate stroke to its value.
   * ---------------------------------------------------------------- */
  function initRing() {
    var rings = document.querySelectorAll("[data-ring]");
    if (!rings.length) return;
    rings.forEach(function (ring) {
      var fill = ring.querySelector(".fill");
      if (!fill) return;
      var r = parseFloat(fill.getAttribute("r"));
      var c = 2 * Math.PI * r;
      var target = c * (1 - parseFloat(ring.getAttribute("data-ring")) / 100);
      fill.style.strokeDasharray = c;
      if (prefersReduced || !("IntersectionObserver" in window)) { fill.style.strokeDashoffset = target; return; }
      fill.style.strokeDashoffset = c;
      var obs = new IntersectionObserver(function (entries, o) {
        if (!entries[0].isIntersecting) return;
        fill.style.strokeDashoffset = target;
        o.disconnect();
      }, { threshold: 0.4 });
      obs.observe(ring);
    });
  }

  /* ----------------------------------------------------------------
   * Sub-navigation highlight (programmes page).
   * ---------------------------------------------------------------- */
  function initSubnav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".subnav a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) { map[l.getAttribute("href").slice(1)] = l; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove("active"); l.removeAttribute("aria-current"); });
        var a = map[entry.target.id];
        if (a) { a.classList.add("active"); a.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
    window.addEventListener("scroll", function () {
      if (window.scrollY < 300) links.forEach(function (l) { l.classList.remove("active"); l.removeAttribute("aria-current"); });
    }, { passive: true });
  }

  /* ----------------------------------------------------------------
   * Copy-link button on the full story.
   * ---------------------------------------------------------------- */
  function initCopyLink() {
    var btn = document.querySelector("[data-copy-link]");
    if (!btn) return;
    var status = document.querySelector("[data-copy-status]");
    btn.addEventListener("click", function () {
      var url = window.location.href.split("#")[0] + "#full-story";
      var say = function (t) { if (status) status.textContent = t; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { say("Link copied to clipboard."); },
          function () { say("Copy this link: " + url); });
      } else {
        say("Copy this link: " + url);
      }
    });
  }

  /* ----------------------------------------------------------------
   * Footer year.
   * ---------------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function boot() {
    initNav();
    initStickyNav();
    initReveal();
    initCountUp();
    initTabs();
    initQuickGive();
    initSpendChart();
    initForms();
    initDonate();
    initStoryFilter();
    initCollectionChart();
    initFinanceChart();
    initRing();
    initSubnav();
    initCopyLink();
    initYear();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
