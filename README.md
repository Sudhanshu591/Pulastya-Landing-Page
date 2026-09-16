# Pulastya AI — Product homepage

Static, SEO-friendly homepage for **https://pulastya.sdlccorp.com/**, built with plain HTML, CSS and JavaScript (no framework, no build step).

The homepage links into the existing Pulastya application routes on the same domain (`/login`, `/register`, `/contact`, `/api-docs`, `/about`, `/privacy`, `/terms` and the workflow guide pages). Those routes are served by the Pulastya app, not by this folder.

## Structure

```
index.html                    Homepage (branded product experience)
404.html                      Not-found page (noindex)
assets/css/style.css          All styles
assets/js/main.js             Interactions + GSAP/ScrollTrigger motion
assets/js/vendor/             GSAP 3.15 + ScrollTrigger (vendored)
assets/img/brand/             Pulastya mark (from the approved logo)
assets/img/product/           Product walkthrough + screens (from approved Pulastya assets)
assets/img/og-image.png       Social share image
sitemap.xml, robots.txt, site.webmanifest, favicon.ico
```

## Homepage sections (in order)

1. Hero: H1, subtitle, Book a demo (primary), View pricing, Read documentation, Log in
2. Product walkthrough (recorded Pulastya workspace) with play/pause control
3. How Pulastya works: call → speech → intent/context → knowledge → response or handoff → call record
4. Capabilities (tabs): voice and routing, knowledge base, prompt templates, live calls and history, call detail, test calls, human handoff
5. Inbound and outbound workflows + links to workflow guides
6. Integrations, labelled **Native** or **API · access on request**
7. Security and governance
8. Pricing (on request)
9. Documentation
10. Final call to action

## Content rules

Every product statement is taken from the live Pulastya application (UI strings, routes and approved product screens). Do not add customer logos, testimonials, metrics, certifications or integrations unless they are verified and approved for publication. Label any demo values as demo or illustrative.

## Run locally

```bash
python -m http.server 5173
# or
npx serve .
```

## Motion system

GSAP + ScrollTrigger. Scroll animations are scrubbed, so scrolling up reverses them. The hero and product walkthrough share one pinned scene on tablet and desktop, with a shorter pin on mobile. With `prefers-reduced-motion`, there is no pinning, scrubbing or parallax, and the walkthrough does not autoplay.

- Reveal: `data-reveal="y:40;scale:.96;start:top 90%;end:center 50%"`
- Staggered group: `data-reveal-group="stagger:.14"` + `data-reveal-item="y:20"`
- Parallax: `data-parallax="24"`
- Load entrance: `data-intro`
