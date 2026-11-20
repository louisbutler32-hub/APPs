---
name: design-check
description: Check a change to how Salty looks, moves or reads against the house design rules, so the site does not drift back to looking machine-made. Use before shipping any visual, layout, animation or copy change to salty/web, salty/video or the share image, and when asked whether something looks "vibe coded", generic or AI-made.
---

# Check a design change

Salty's look is written down in `salty/docs/brand.md`. This skill is how to hold a change to it. Do the three parts in order: the list, the tools, then your own eyes.

## 1. The list

Thirty things that make a site look machine-made. Salty has none of them. Go through the change and confirm it adds none.

**Colour and surface**

1. No gradients, on backgrounds, bars or text. Colour is flat.
2. No pure white backgrounds. Use `salt` for the page and `paper` for sheets and fields.
3. No rainbow: one loud colour per screen. A verdict colour appears only on its own verdict.
4. No purple-and-black look. Brine is the brand colour; do not let it drift towards violet.
5. No neon glow and no washed-out pastels. Zest is flat and is for good news and the next step only.
6. No glass or blur, no glowing blobs of colour, no dot-grid backgrounds.
7. No shadows, except `shadow-float` under menus and pop-ups, which really float.

**Shape and layout**

8. No big soft corners or pills. `rounded-ctl` (6px) on things you press or type in, `rounded-box` (12px) on panels.
9. No row of three matching cards, and no grid of mismatched boxes. Lists are ruled rows.
10. No stripe of colour down one side of a box.
11. No small label sitting above a headline. The headline carries it.
12. No three-tier pricing table and no fake terminal window.

**Icons and pictures**

13. No emoji, anywhere. No text characters standing in for icons (ticks, crosses, arrows, padlocks).
14. No stock icon set and no sparkle icons. Icons are drawn as one set in `salty/web/src/components/icons.tsx`.
15. No tick-mark bullet lists. Use ruled rows, or the grain as a bullet.
16. Show the real product. The pay check is on the first screen, and the example result is built from real data. Never a placeholder picture.

**Type**

17. One typeface, Bricolage Grotesque. Never Inter, Geist, Space Grotesk or a typewriter font.

**Words**

18. No em dashes. Use a comma, a colon or a new sentence.
19. No "it's not this, it's that", and none of its cousins ("rather than", "instead of") used as a device.
20. No made-up reviews, customers, counts or quotes. Every number on the site comes from the data.
21. No arrows after link or button text.
22. Follow the voice rules in `brand.md`: plain words, lead with the number, say what the data cannot do.

**Movement**

23. Nothing moves just because the pointer is over it. Buttons answer a press; colours change on hover.
24. Nothing fades or slides in as you scroll, and nothing loops or scrolls by itself.
25. The two pieces of real movement are the result arriving and the headline's entrance. Do not add a third without a reason a user would feel.
26. Everything still works, and is fully visible, with "reduce motion" switched on.

**Housekeeping**

27. Anything that takes more than a moment shows the outline of what is coming (`skeleton`), not a spinner.
28. The privacy page and the terms page exist and are linked from the footer.
29. Every sign-up form links to both.
30. Rules 1, 2 and 8 of `CLAUDE.md` still hold: published numbers only, pay stays on the device, estimates are labelled.

## 2. The tools

Start the site (`npm run dev` in `salty/web`), then run what is available. These are other people's free tools, fetched when needed and not stored in this repo.

**Impeccable's detector** finds most of the list above on the rendered page. Clone `https://github.com/pbakaus/impeccable`, then from `salty/web`:

```
<clone>/.claude/skills/impeccable/scripts/impeccable detect http://localhost:3000
<clone>/.claude/skills/impeccable/scripts/impeccable detect --viewport 390x844 http://localhost:3000
<clone>/.claude/skills/impeccable/scripts/impeccable detect src
```

Run it on a job page and a legal page too. One finding is expected and is not to be "fixed": `cream-palette`, because Salt is the brand's background colour. Anything else needs a fix or a reason.

**taste-skill's copy checker** counts the habits of machine-written copy. Clone `https://github.com/leonxlnx/taste-skill`, build the site, then:

```
node <clone>/skills/taste-skill/scripts/copy-lint.mjs out/index.html out/terms.html out/privacy.html --kind software
```

It should report no FAIL. Its one standing WARN, `copy-stat-strip`, is the row of pay points under the example result: those are the product's own figures, not decoration.

For anything that moves, the rules of thumb in `https://github.com/emilkowalski/skills` apply: ease out, under 300ms for anything pressed, only `transform` and `opacity`, never start from nothing, and ask first whether it should move at all.

## 3. Your eyes

Take screenshots with Playwright at 1440 by 900 and 390 by 844 and look at them. Check at least: the first screen, a result, the raise plan, an "Other" country estimate, a pop-up, a job page and the footer. Things no tool catches:

- Squint. Can you still tell what is most important on the screen?
- Does every block start and end on the same left and right lines?
- Is anything clipped, overlapping or cut off at the fold on the phone?
- Do the site, a video end card and the share image still look like one brand?

If the change touches the video templates or the share image, render one and look at it as well (`npm run make -- --only train` in `salty/video`).
