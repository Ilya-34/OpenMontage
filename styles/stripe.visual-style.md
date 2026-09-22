---
name: "Stripe Web Style"
version: "1.0"
tags:
  - fintech
  - sleek minimal
author: "Extracted"
source_url: "https://stripe.com"
created: "2026-09-20"

style_prompt_short: >
  Clean fintech minimalism on white, with a light-weight display headline,
  a muted slate secondary text color, a single confident purple accent, and
  a soft multicolor mesh-gradient ribbon as the only decorative element.

style_prompt_full: >
  Modern fintech design in the style of Stripe's marketing site. Pure white
  (#FFFFFF) backgrounds with generous whitespace — no textures, no noise, no
  stock photography. Headlines use a LIGHT font weight (300, not bold) in
  dark navy (#061B31), set with tight letter-spacing (~-2%) and a compact
  line-height (~1.15) — this thin-weight-at-large-size look is the single
  most distinctive trait of the style. Secondary/de-emphasized text drops to
  a muted slate blue-gray (#64748D) at the same size, immediately reading as
  "supporting" rather than "primary." Typeface stack: "Söhne" (sohne-var)
  falling back to SF Pro Display, then system sans-serif. One confident
  accent color: Stripe Purple (#533AFD), used sparingly — CTA button fills,
  key highlights — with white text on it. Structural elements (bento-grid
  cards, section dividers) are sharp-edged (0px radius); only small
  interactive elements like buttons get a subtle 4px radius. Motion is
  smooth and unhurried: card reveals use an ease-out cubic-bezier(0.165,
  0.84, 0.44, 1) over ~0.8s, nothing bouncy or playful. The one ornamental
  flourish is a soft-focus multicolor mesh/aurora gradient — radial blends
  of periwinkle (#7F7DFC), magenta-pink (#F44BCC / #F363F3), and pale ice
  blue (#E5EDF5) — used as a diagonal ribbon or background glow, never as a
  flat color fill. Avoid: heavy drop shadows, saturated multi-color palettes
  outside the gradient device, bold/black display type, rounded "friendly"
  corners on structural blocks, busy layouts.

colors:
  primary:
    - name: "Pure White"
      hex: "#FFFFFF"
      role: "primary background, negative space"
    - name: "Ink Navy"
      hex: "#061B31"
      role: "primary text, headings (measured live from stripe.com h2, 2026-09-20)"
  accent:
    - name: "Stripe Purple"
      hex: "#533AFD"
      role: "CTA fills, brand accent (measured from the live 'Get started' button background)"
  neutral:
    - name: "Slate Blue-Gray"
      hex: "#64748D"
      role: "secondary/body text, de-emphasized copy (measured from live <p> color)"
    - name: "Pale Ice Blue"
      hex: "#E5EDF5"
      role: "gradient terminus, subtle section tints"

typography:
  display:
    family: "sohne-var, \"SF Pro Display\", system-ui, sans-serif"
    weight: "300"
    style: "sentence case, tight tracking (~-2%), line-height ~1.15 — light weight at large size is the signature trait"
  body:
    family: "sohne-var, \"SF Pro Display\", system-ui, sans-serif"
    weight: "400"
    style: "comfortable line height, generous size for intro copy"
  caption:
    family: "sohne-var, monospace fallback"
    weight: "400"
    style: "small, used sparingly for labels/technical detail"
  rules:
    - "Never use bold/black weight for display headlines — light (300) is the point"
    - "Two-tone headlines: primary line in Ink Navy, supporting line in Slate Blue-Gray, same size"
    - "Tight letter-spacing at large sizes, normal at body size"

layout:
  grid: "Bento-style asymmetric card grid for feature sections; 12-col-ish max-width container for text sections"
  alignment: "Left-aligned hero text; mixed alignment in bento sections"
  aspect_ratio: "16:9 for hero/video moments"
  notes:
    - "Structural cards/dividers are sharp (0px border-radius); only buttons get ~4px"
    - "Generous vertical whitespace between sections"
    - "No box-shadow on structural cards in the current design (flatter than older Stripe eras)"

motion:
  transitions:
    - "fade-in on scroll"
    - "smooth card-reveal transform, 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)"
    - "fast (0.1s, stepped) z-index swap on hover for layered card stacks"
  animation_style: >
    Smooth, unhurried, confident. Ease-out on entrances, nothing bouncy,
    nothing playful, nothing abrupt.
  pacing: "Measured — let the light typography and whitespace breathe"
  audio_cues:
    - "no audio branding observed; treat as silent/neutral"

mood:
  keywords:
    - "confident"
    - "quiet"
    - "premium"
    - "technical"
    - "unhurried"
  era: "2020s fintech, post-skeuomorphic minimalism"
  cultural_reference: "Modern developer-focused SaaS design"
  avoid:
    - "bold/black display type"
    - "rounded 'friendly' corners on structural blocks"
    - "busy layouts or competing accent colors"
    - "stock photography"
    - "heavy drop shadows"

assets:
  reference_images: []
  color_palette_image:
    url: ""
---

## Design Principles

Confidence through restraint. A light type weight at large size reads as
quiet authority, not timidity — it works because everything else (spacing,
one accent color, one gradient device) is disciplined enough to support it.
Color is rationed: one navy, one muted slate, one purple, one soft gradient.

## Extraction Notes

Extracted live from https://stripe.com on 2026-09-20 via browser DevTools
(computed styles), not from memory or a template:
- Font stack confirmed as `sohne-var, "SF Pro Display", sans-serif` on `body`.
- H1/H2 weight measured as 300 (light) — notably not bold.
- Text colors measured: headings `rgb(6,27,49)` = #061B31; secondary text
  `rgb(100,116,141)` = #64748D.
- Primary "Get started" CTA button background measured as `rgb(83,58,253)`
  = #533AFD, white text, 4px border-radius.
- Hero mesh-gradient blobs measured as radial-gradients cycling through
  `rgb(127,125,252)`, `rgb(244,75,204)`, `rgb(229,237,245)`, and
  `rgb(243,99,243)`; rendered via 2 `<canvas>` elements (WebGL) plus DOM
  gradient divs as a fallback/layer.
- Bento-grid feature cards found with class `modular-solutions-bento-card`,
  `border-radius: 0px`, transform transitions at `0.8s cubic-bezier(0.165,
  0.84, 0.44, 1)`.
