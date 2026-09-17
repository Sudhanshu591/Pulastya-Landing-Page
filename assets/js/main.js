/* ==========================================================================
   Pulastya AI — Interactions & scroll-driven motion
   GSAP + ScrollTrigger (vendored in /assets/js/vendor). All content is in the
   HTML; this file only enhances it. Every scroll animation is scrubbed, so
   scrolling up reverses it.

   Motion hierarchy
   L1 cinematic   : home hero → AI report (pinned), final CTA
   L2 transitions : feature panel, editorial text, expert card, stats panel
   L3 micro       : labels, FAQ rows, footer, buttons
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ======================================================================
     UI behaviour (independent of GSAP)
     ====================================================================== */

  /* ---- Header: transparent over the hero, frosted once you leave it ---- */
  var header = $(".site-header");
  var cinema = $("[data-cinema]");
  var heroEnd = 0; // set by the pinned hero timeline so the bar stays transparent through the whole scene
  function updateHeader() {
    if (!header) return;
    var threshold = cinema ? Math.max(heroEnd - window.innerHeight * 0.25, window.innerHeight * 0.6) : 20;
    header.classList.toggle("is-scrolled", window.scrollY > threshold);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", updateHeader);
  updateHeader();

  /* ---- Mobile nav ---- */
  var toggle = $(".nav__toggle");
  if (toggle) {
    var setNav = function (open) {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
    $$(".nav__links a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) setNav(false);
    });
  }

  /* ---- Rolling button labels ---- */
  $$(".btn").forEach(function (btn) {
    if (btn.querySelector(".btn__label")) return;
    var text = btn.textContent.trim();
    if (!text) return;
    btn.innerHTML = '<span class="btn__label"><span>' + text + '</span><span aria-hidden="true">' + text + "</span></span>";
  });

  /* ---- Industry tiles: fall back to the SVG icon when a photo is missing ---- */
  $$(".ind-tile__photo img").forEach(function (img) {
    function drop() { if (img.parentNode) img.parentNode.remove(); }
    if (img.complete && img.naturalWidth === 0) drop();
    img.addEventListener("error", drop);
  });

  /* ---- Tabs (click / keyboard; no autoplay so nothing moves while idle) ---- */
  $$("[data-tabs]").forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap);
    var panels = $$('[role="tabpanel"]', wrap);
    var current = 0;
    function activate(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, n) {
        var on = n === current;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, n) {
        var on = n === current;
        p.classList.toggle("is-active", on);
        p.setAttribute("aria-hidden", String(!on));
      });
      // Industries rail: the active tile column expands; indicators follow the selection.
      tabs.forEach(function (t, n) {
        var item = t.closest(".ind-item");
        if (item) item.classList.toggle("is-active", n === current);
      });
      var section = wrap.closest("section");
      if (section) $$(".ind-dots i", section).forEach(function (d, n) { d.classList.toggle("is-on", n === current); });
      // Horizontally scrolling rails (mobile): bring the selected tile into view without moving the page.
      var list = tabs[current].closest(".ind-list");
      if (list && list.scrollWidth > list.clientWidth + 2) {
        var itemEl = tabs[current].closest(".ind-item");
        setTimeout(function () { list.scrollTo({ left: Math.max(0, itemEl.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft || 0)), behavior: prefersReduced ? "auto" : "smooth" }); }, 60);
      }
      if (focus) tabs[current].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); activate(current + 1, true); }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); activate(current - 1, true); }
      });
    });
    var initial = tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; });
    activate(initial < 0 ? 0 : initial);
  });

  /* ---- Accordion (height animates via CSS grid rows; no display toggling) ---- */
  var refreshTimer;
  $$(".acc").forEach(function (item) {
    var btn = $(".acc__q", item);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = !item.classList.contains("is-open");
      var group = item.closest(".accordion");
      if (group && open) {
        $$(".acc.is-open", group).forEach(function (o) {
          o.classList.remove("is-open");
          $(".acc__q", o).setAttribute("aria-expanded", "false");
        });
      }
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      // Page height changed: recalculate trigger positions once the transition settles.
      if (window.ScrollTrigger) {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () { window.ScrollTrigger.refresh(); }, 450);
      }
    });
  });

  /* ---- Pricing billing toggle ---- */
  var billing = $("[data-billing]");
  if (billing) {
    var labels = $$("[data-billing-label]");
    var setBilling = function (annual) {
      billing.setAttribute("aria-checked", String(annual));
      labels.forEach(function (l) { l.classList.toggle("is-on", (l.getAttribute("data-billing-label") === "annual") === annual); });
      $$("[data-price-monthly]").forEach(function (el) {
        el.textContent = "$" + el.getAttribute(annual ? "data-price-annual" : "data-price-monthly");
        el.classList.remove("is-flipping"); void el.offsetWidth; el.classList.add("is-flipping");
      });
      $$("[data-billed]").forEach(function (el) { el.textContent = annual ? "Billed annually." : "Billed monthly."; });
    };
    billing.addEventListener("click", function () { setBilling(billing.getAttribute("aria-checked") !== "true"); });
    labels.forEach(function (l) {
      l.addEventListener("click", function () { setBilling(l.getAttribute("data-billing-label") === "annual"); });
    });
  }

  /* ---- Card spotlight (pre-existing hover detail; no tilt) ---- */
  if (window.matchMedia("(hover: hover)").matches && !prefersReduced) {
    $$(".card, .profile").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    });
  }

  /* ---- Static starfield (drawn once; moves only with the scene) ---- */
  $$("canvas.stars").forEach(function (canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var seed = 7;
    var rand = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    function draw() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      seed = 7;
      var count = Math.round((w * h) / 9000);
      for (var i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.arc(rand() * w, rand() * h, rand() * 1.1 + 0.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(47,127,232," + (rand() * 0.3 + 0.08).toFixed(3) + ")";
        ctx.fill();
      }
    }
    draw();
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(draw, 200); });
  });

  /* ---- Marquee: duplicate content so the scroll-driven track never runs out ---- */
  $$(".marquee__track").forEach(function (track) {
    Array.prototype.slice.call(track.children).forEach(function (child) {
      var clone = child.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  });

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Product walkthrough: animated preview with an accessible play/pause control ---- */
  var walkthrough = $("[data-walkthrough]");
  var walkToggle = $("[data-walkthrough-toggle]");
  var walkUserChoice = null; // respects an explicit pause/play by the visitor
  function setWalkthrough(play) {
    if (!walkthrough) return;
    var src = walkthrough.getAttribute(play ? "data-animated-src" : "data-poster-src");
    if (walkthrough.getAttribute("src") !== src) walkthrough.setAttribute("src", src);
    if (walkToggle) {
      walkToggle.setAttribute("aria-pressed", String(play));
      walkToggle.setAttribute("aria-label", play ? "Pause product walkthrough" : "Play product walkthrough");
    }
  }
  function autoPlayWalkthrough() {
    if (prefersReduced || walkUserChoice !== null) return;
    setWalkthrough(true);
  }
  if (walkthrough) {
    setWalkthrough(false);
    if (walkToggle) {
      walkToggle.addEventListener("click", function () {
        walkUserChoice = walkToggle.getAttribute("aria-pressed") !== "true";
        setWalkthrough(walkUserChoice);
      });
    }
    // Start the animation only once the walkthrough is actually on screen.
    if ("IntersectionObserver" in window && !root.classList.contains("cine")) {
      var wio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { autoPlayWalkthrough(); wio.disconnect(); }
      }, { threshold: 0.35 });
      wio.observe(walkthrough);
    }
  }

  /* ======================================================================
     Motion system
     ====================================================================== */
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  if (!gsap || !ScrollTrigger) {
    // Scripts failed: show everything in its natural layout.
    root.classList.remove("cine");
    root.classList.add("anim-ready");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---- Load entrance: very subtle, content-only ---- */
  var introEls = $$("[data-intro]");
  if (!prefersReduced && introEls.length) {
    gsap.set(introEls, { opacity: 0, y: 16 });
    root.classList.add("anim-ready");
    gsap.to(introEls, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.08, delay: 0.05, clearProps: "transform" });
  } else {
    root.classList.add("anim-ready");
  }

  /* ---- Helpers ---- */
  function parseOpts(str) {
    var o = {};
    (str || "").split(";").forEach(function (pair) {
      var i = pair.indexOf(":");
      if (i < 0) return;
      var k = pair.slice(0, i).trim(), v = pair.slice(i + 1).trim();
      o[k] = v !== "" && !isNaN(v) ? parseFloat(v) : v;
    });
    return o;
  }
  function pick(v, d) { return v === undefined ? d : v; }

  // Reveals created on load whose trigger is already inside the first viewport
  // are played once instead of sitting half-revealed.
  var revealTimelines = [];

  /**
   * Scroll reveal utility (scrubbed, reversible).
   * opts: y, x, opacity (start value), scale, blur, duration, stagger, trigger, start, end, scrub, k (distance scale)
   */
  function reveal(targets, opts) {
    opts = opts || {};
    var els = gsap.utils.toArray(targets);
    if (!els.length) return null;
    var k = pick(opts.k, 1);
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: opts.trigger || els[0],
        start: opts.start || "top 88%",
        end: opts.end || "top 58%",
        scrub: pick(opts.scrub, 0.6)
      }
    });
    els.forEach(function (el, i) {
      var eo = opts.perItem ? Object.assign({}, opts, parseOpts(el.getAttribute(opts.perItem))) : opts;
      var from = { opacity: pick(eo.opacity, 0), y: pick(eo.y, 30) * k, x: pick(eo.x, 0) * k, scale: pick(eo.scale, 1) };
      var to = { opacity: 1, y: 0, x: 0, scale: 1, duration: pick(eo.duration, 0.6), ease: "power1.out" };
      if (eo.blur) { from.filter = "blur(" + eo.blur + "px)"; to.filter = "blur(0px)"; }
      tl.fromTo(el, from, to, i * pick(opts.stagger, 0.12));
    });
    revealTimelines.push(tl);
    return tl;
  }

  function parallax(el, amount, trigger) {
    if (!amount) return;
    gsap.fromTo(el, { y: -amount / 2 }, {
      y: amount / 2, ease: "none",
      scrollTrigger: { trigger: trigger || el, start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  function settleAboveFold() {
    if (window.scrollY > 5) return;
    revealTimelines.forEach(function (tl) {
      var st = tl.scrollTrigger;
      if (st && st.start <= 1) {
        st.kill(false);
        tl.progress(0).timeScale(1.15).play();
      }
    });
  }

  /* ---- L1: home hero → AI report (pinned, one coordinated timeline) ---- */
  function heroCinematic(cinema, desktop) {
    var q = function (s) { return cinema.querySelector('[data-cine="' + s + '"]'); };
    var hx = desktop ? 0.24 : 0.15;
    var orbits = cinema.querySelectorAll('[data-cine="orbit"]');

    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: cinema,
        start: "top top",
        end: desktop ? "+=200%" : "+=160%",
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: function (self) { heroEnd = self.end; updateHeader(); },
        onUpdate: function (self) { if (self.progress > 0.5) autoPlayWalkthrough(); }
      }
    });

    tl
      // 0 → .3 : hero copy leaves first
      .to(q("title"), { opacity: 0, y: -20, duration: 0.28 }, 0)
      .to(q("sub"), { opacity: 0, y: 15, duration: 0.24 }, 0.03)
      .to(q("cta"), { opacity: 0, y: 22, duration: 0.24 }, 0.05)
      .to(q("eyebrow"), { opacity: 0, y: -12, duration: 0.2 }, 0)
      // 0 → .5 : foreground handsets spread outward (fastest layer)
      .to(q("handset-left"), { x: function () { return -window.innerWidth * hx; }, y: 40, scale: 1.1, duration: 0.5 }, 0)
      .to(q("handset-right"), { x: function () { return window.innerWidth * hx; }, y: 40, scale: 1.1, duration: 0.5 }, 0)
      .to([q("handset-left"), q("handset-right")], { opacity: 0, duration: 0.2 }, 0.36)
      // environment (slowest layers)
      .to(orbits, { "--os": 1.4, opacity: 0, duration: 0.45 }, 0.04)
      .to(q("reflection"), { opacity: 0, duration: 0.3 }, 0.05)
      .to(q("rays"), { scale: 1.08, transformOrigin: "50% 0%", duration: 0.55 }, 0.05)
      .to(q("grid"), { scale: 1.28, y: -24, opacity: 0.85, duration: 0.6 }, 0.05)
      .to(q("env"), { opacity: 1, duration: 0.35 }, 0.3)
      // .1 → .78 : camera moves toward, then through, the central display
      .to(q("floor"), { scale: 1.25, duration: 0.5 }, 0.08)
      .to(q("device"), { scale: 1.12, y: -30, opacity: 0.6, duration: 0.42 }, 0.1)
      .to(q("device"), { scale: 1.2, opacity: 0, duration: 0.16 }, 0.52)
      // .42 → .74 : AI report emerges inside the blue environment
      .fromTo(q("report-head"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2 }, 0.42)
      .fromTo(q("console"), { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.22 }, 0.45)
      .fromTo(q("card-a"), { opacity: 0, x: 30, y: 0 }, { opacity: 1, x: 0, y: 0, duration: 0.16 }, 0.5)
      .fromTo(q("card-b"), { opacity: 0, x: 30, y: 0 }, { opacity: 1, x: 0, y: 0, duration: 0.16 }, 0.54)
      .fromTo(q("card-c"), { opacity: 0, x: 30, y: 0 }, { opacity: 1, x: 0, y: 0, duration: 0.16 }, 0.58)
      // .74 → .84 : hold — the complete composition is fully visible
      // .84 → 1 : layers drift up at different depths while blue dissolves to black
      .to(q("report-head"), { y: -80, opacity: 0, duration: 0.16 }, 0.84)
      .to(q("console"), { y: -100, opacity: 0, duration: 0.14 }, 0.86)
      .to(q("card-a"), { y: -130, opacity: 0, duration: 0.14 }, 0.86)
      .to(q("card-b"), { y: -120, opacity: 0, duration: 0.12 }, 0.88)
      .to(q("card-c"), { y: -110, opacity: 0, duration: 0.12 }, 0.88)
      .to([q("env"), q("rays")], { opacity: 0, duration: 0.16 }, 0.84)
      .to(q("grid"), { opacity: 0, scale: 1.36, duration: 0.16 }, 0.84)
      .to(q("stars"), { opacity: 0.35, duration: 0.16 }, 0.84);

    return tl;
  }

  /* ---- Mobile hero: shorter pin, small handset drift ---- */
  function heroMobile(cinema) {
    var hero = $(".hero", cinema);
    var q = function (s) { return cinema.querySelector('[data-cine="' + s + '"]'); };
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: hero, start: "top top", end: "+=70%", scrub: 0.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
    })
      .to(q("title"), { opacity: 0, y: -16, duration: 0.45 }, 0)
      .to(q("sub"), { opacity: 0, y: 12, duration: 0.4 }, 0.05)
      .to(q("cta"), { opacity: 0, y: 16, duration: 0.4 }, 0.08)
      .to(q("floor"), { scale: 1.22, duration: 1 }, 0)
      .to(q("device"), { scale: 1.06, y: -24, opacity: 0.55, duration: 0.9 }, 0.1)
      .to(q("handset-left"), { x: function () { return -window.innerWidth * 0.08; }, opacity: 0.4, duration: 0.8 }, 0)
      .to(q("handset-right"), { x: function () { return window.innerWidth * 0.08; }, opacity: 0.4, duration: 0.8 }, 0)
      .to(cinema.querySelectorAll('[data-cine="orbit"]'), { "--os": 1.25, opacity: 0, duration: 0.7 }, 0);

    // The report stacks below on mobile: simple dashboard appearance.
    reveal($$(".report__head > *", cinema), { y: 35, stagger: 0.14 });
    reveal(q("console"), { y: 40, scale: 0.96 });
    $$(".tour-card", cinema).forEach(function (card) { reveal(card, { y: 28, start: "top 92%", end: "top 70%" }); });
  }

  /* ---- L2: feature panel ---- */
  function featurePanel(panel, k) {
    var tl = gsap.timeline({ scrollTrigger: { trigger: panel, start: "top 94%", end: "top 45%", scrub: 0.6 } });
    tl.fromTo(panel, { opacity: 0, y: 70 * k, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power1.out" }, 0)
      .fromTo($$(".tab", panel), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.1, ease: "power1.out" }, 0.4)
      .fromTo($$(".tabs-card__note > *", panel), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.1, ease: "power1.out" }, 0.62);
    revealTimelines.push(tl);
  }

  /* ---- L2/L3: benefit columns, left → right ---- */
  function benefits(row, mobile, k) {
    var cards = $$(".card", row);
    var build = function (tl, card, at) {
      tl.fromTo(card, { opacity: 0, y: 24 * k }, { opacity: 1, y: 0, duration: 0.45, ease: "power1.out" }, at)
        .fromTo($(".card__icon", card), { opacity: 0, scale: 0.8, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power1.out" }, at + 0.08)
        .fromTo($("h3", card), { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.35, ease: "power1.out" }, at + 0.16)
        .fromTo($("p", card), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: "power1.out" }, at + 0.22);
    };
    if (mobile) {
      cards.forEach(function (card) {
        var tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 92%", end: "top 62%", scrub: 0.6 } });
        build(tl, card, 0);
        revealTimelines.push(tl);
      });
    } else {
      var tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%", end: "top 45%", scrub: 0.6 } });
      cards.forEach(function (card, i) { build(tl, card, i * 0.18); });
      revealTimelines.push(tl);
    }
  }

  /* ---- L2: statistics ---- */
  function stats(panel, k) {
    reveal(panel, { y: 40, scale: 0.98, k: k, start: "top 92%", end: "top 55%" });
    reveal($$(".stats-panel__left > *", panel), { y: 30, k: k, stagger: 0.12, trigger: panel, start: "top 80%", end: "top 45%" });
    $$(".stat", panel).forEach(function (stat) {
      var num = $(".stat__num", stat);
      var tl = gsap.timeline({ scrollTrigger: { trigger: stat, start: "top 90%", end: "top 58%", scrub: 0.6 } });
      if (num) tl.fromTo(num, { opacity: 0, y: 40 * k }, { opacity: 1, y: 0, duration: 0.6, ease: "power1.out" }, 0);
      tl.fromTo($(".stat__title", stat), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: "power1.out" }, num ? 0.15 : 0)
        .fromTo($(".stat__desc", stat), { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.45, ease: "power1.out" }, num ? 0.25 : 0.1);
      if (num && num.hasAttribute("data-count")) {
        var target = parseFloat(num.getAttribute("data-count"));
        var suffix = num.getAttribute("data-suffix") || "";
        var counter = { v: 0 };
        tl.fromTo(counter, { v: 0 }, {
          v: target, duration: 0.7, ease: "power1.out",
          onUpdate: function () { num.textContent = Math.round(counter.v) + suffix; }
        }, 0);
      }
      revealTimelines.push(tl);
    });
  }

  /* ---- L1: final CTA emerges from black ---- */
  function cta(box, k, kp) {
    var rays = $(".rays", box);
    var halo = $(".cta__halo", box);
    var tl = gsap.timeline({ scrollTrigger: { trigger: box, start: "top 96%", end: "center 60%", scrub: 0.6 } });
    tl.fromTo(box, { opacity: 0, y: 60 * k, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power1.out" }, 0)
      .fromTo(rays, { scale: 1.06, transformOrigin: "50% 0%" }, { scale: 1, duration: 1 }, 0)
      .fromTo($("h2", box), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power1.out" }, 0.45)
      .fromTo($(".lead", box), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power1.out" }, 0.55)
      .fromTo($(".btn", box), { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: "power1.out" }, 0.65);
    revealTimelines.push(tl);
    // depth: background drifts least, midground glow a little more, text not at all
    parallax(rays, 10 * kp, box);
    parallax(halo, 24 * kp, box);
  }

  /* ---- L3: footer ---- */
  function footer(el) {
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 98%", end: "top 62%", scrub: 0.6 } });
    tl.fromTo($(".container", el), { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 1, ease: "power1.out" }, 0)
      .fromTo($$(".footer__brand, .footer__col, .footer__bottom", el), { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power1.out" }, 0.2);
    revealTimelines.push(tl);
  }

  /* ---- Responsive motion setup ---- */
  var mm = gsap.matchMedia();
  mm.add({
    desktop: "(min-width: 1200px)",
    tablet: "(min-width: 810px) and (max-width: 1199.98px)",
    mobile: "(max-width: 809.98px)",
    reduce: "(prefers-reduced-motion: reduce)"
  }, function (context) {
    var c = context.conditions;
    revealTimelines = [];

    if (c.reduce) {
      // Content stays static and readable; no pinning, scrubbing or parallax.
      root.classList.remove("cine");
      return;
    }

    var cineMode = !c.mobile;
    root.classList.toggle("cine", cineMode);
    var k = c.desktop ? 1 : c.tablet ? 0.8 : 0.6;     // entrance distances
    var kp = c.desktop ? 1 : c.tablet ? 0.6 : 0.3;    // parallax distances

    // Create in page order so pin spacing is known to every trigger below it.
    if (cinema) {
      if (cineMode) heroCinematic(cinema, c.desktop);
      else heroMobile(cinema);
    }

    // Inner page heroes ease away as you leave them.
    $$("[data-hero-out]").forEach(function (el) {
      if (el.querySelector(".plans")) return;
      gsap.to(el, {
        y: -40 * k, opacity: 0.35, ease: "none",
        scrollTrigger: { trigger: el.closest(".page-hero") || el, start: "top top", end: "bottom top", scrub: 0.6 }
      });
    });

    // Scroll-driven marquees (move only while scrolling).
    $$("[data-marquee]").forEach(function (m) {
      var dir = parseFloat(m.getAttribute("data-marquee")) || 1;
      gsap.fromTo($(".marquee__track", m), { xPercent: dir > 0 ? 0 : -25 }, {
        xPercent: dir > 0 ? -25 : 0, ease: "none",
        scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: 0.5 }
      });
    });

    // Generic reveals + groups.
    $$("[data-reveal]").forEach(function (el) {
      var o = parseOpts(el.getAttribute("data-reveal"));
      o.k = k;
      reveal(el, o);
    });
    $$("[data-reveal-group]").forEach(function (group) {
      var o = parseOpts(group.getAttribute("data-reveal-group"));
      o.k = k;
      o.trigger = group;
      o.perItem = "data-reveal-item";
      reveal($$("[data-reveal-item]", group), o);
    });

    // Custom sections.
    $$("[data-feature-panel]").forEach(function (p) { featurePanel(p, k); });
    $$("[data-benefits]").forEach(function (row) { benefits(row, c.mobile, k); });
    $$("[data-stats]").forEach(function (p) { stats(p, k); });
    $$("[data-cta]").forEach(function (b) { cta(b, k, kp); });
    $$("[data-footer]").forEach(footer);

    // Parallax helper: data-parallax="<total travel in px>".
    $$("[data-parallax]").forEach(function (el) {
      parallax(el, (parseFloat(el.getAttribute("data-parallax")) || 20) * kp);
    });

    ScrollTrigger.refresh();
    settleAboveFold();
    updateHeader();

    return function () { root.classList.remove("cine"); };
  });

  // Fonts and images change layout: recalculate once they are ready.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
