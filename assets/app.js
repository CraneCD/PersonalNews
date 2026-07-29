/**
 * Renders a daily brief. Each edition lives in data/briefs/<date>.js and
 * calls NewsDesk.register() when its script tag loads, so the whole site
 * works from file:// as well as from a static host.
 */
(function () {
  "use strict";

  var briefs = {};

  window.NewsDesk = {
    register: function (brief) {
      briefs[brief.date] = brief;
      if (brief.date === current) render(brief);
    }
  };

  var manifest = window.NewsDeskManifest || [];
  var current = pickDate();

  function pickDate() {
    var fromHash = location.hash.replace(/^#/, "").trim();
    var known = manifest.map(function (e) { return e.date; });
    if (fromHash && known.indexOf(fromHash) !== -1) return fromHash;
    return known[0] || null;
  }

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function longDate(iso) {
    var parts = iso.split("-");
    var months = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return Number(parts[2]) + " de " + months[Number(parts[1]) - 1] + " de " + parts[0];
  }

  function render(brief) {
    document.title = "Brief · " + brief.date;

    var dateline = document.getElementById("dateline");
    dateline.textContent = "";
    [brief.weekday, longDate(brief.date), brief.window, brief.timezone]
      .filter(Boolean)
      .forEach(function (bit, i) {
        // Separator and label share one span so a wrap never strands the dot.
        var span = el("span", null, i ? "· " + bit : bit);
        dateline.appendChild(span);
      });

    var main = document.getElementById("main");
    main.textContent = "";

    if (brief.topOfDay && brief.topOfDay.length) {
      var box = el("div", "topbox");
      box.appendChild(el("h2", null, "Lo más importante del día"));
      var ol = el("ol");
      brief.topOfDay.forEach(function (line) { ol.appendChild(el("li", null, line)); });
      box.appendChild(ol);
      main.appendChild(box);
    }

    (brief.sections || []).forEach(function (section) {
      var sec = el("section", "section");
      sec.id = section.id;
      sec.setAttribute("data-accent", section.accent || "azul");

      var head = el("div", "section-head");
      head.appendChild(el("h2", null, section.title));
      head.appendChild(el("span", "kicker", section.label + " · " + section.items.length + " historias"));
      sec.appendChild(head);

      section.items.forEach(function (item, i) {
        var row = el("div", "item");
        row.appendChild(el("div", "rank", String(i + 1)));

        var body = el("div");
        body.appendChild(el("h3", null, item.headline));
        body.appendChild(el("p", null, item.summary));

        var src = el("div", "src");
        var a = el("a", null, item.source);
        a.href = item.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        src.appendChild(a);
        body.appendChild(src);

        row.appendChild(body);
        sec.appendChild(row);
      });

      main.appendChild(sec);
    });

    if (brief.caveats && brief.caveats.length) {
      var box2 = el("div", "caveats");
      brief.caveats.forEach(function (c) { box2.appendChild(el("p", null, c)); });
      main.appendChild(box2);
    }

    main.appendChild(el("div", "colophon",
      "Compilado " + (brief.generatedAt || "").replace("T", " a las ").slice(0, 22)));
  }

  function loadBrief(date) {
    current = date;
    if (briefs[date]) { render(briefs[date]); return; }
    var s = document.createElement("script");
    s.src = "data/briefs/" + date + ".js";
    s.onerror = function () {
      document.getElementById("main").innerHTML =
        '<p class="empty">No se pudo cargar la edición del ' + date + ".</p>";
    };
    document.head.appendChild(s);
  }

  function boot() {
    var picker = document.getElementById("edition");
    manifest.forEach(function (entry) {
      var opt = el("option", null, longDate(entry.date));
      opt.value = entry.date;
      picker.appendChild(opt);
    });

    if (manifest.length < 2) picker.style.display = "none";

    picker.addEventListener("change", function () {
      location.hash = picker.value;
      loadBrief(picker.value);
    });

    document.getElementById("theme").addEventListener("click", function () {
      var root = document.documentElement;
      var dark = root.getAttribute("data-theme") === "dark" ||
        (!root.getAttribute("data-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.setAttribute("data-theme", dark ? "light" : "dark");
    });

    window.addEventListener("hashchange", function () {
      var d = pickDate();
      if (d && d !== current) { picker.value = d; loadBrief(d); }
    });

    if (!current) {
      document.getElementById("main").innerHTML =
        '<p class="empty">Todavía no hay ediciones publicadas.</p>';
      return;
    }
    picker.value = current;
    loadBrief(current);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
