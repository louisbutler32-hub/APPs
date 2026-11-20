"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP);

/**
 * The one piece of choreography on the site: a result arriving. The panel rises, the figure counts
 * up, the marker glides to its place on the bar as the bar fills, and a few grains of salt drop in.
 * It runs once per result. People who have asked for less motion get the finished result at once.
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.1 } });
        timeline.from(element, { autoAlpha: 0, y: 18, duration: 0.55, clearProps: "transform,opacity,visibility" }, 0);

        const count = element.querySelector<HTMLElement>("[data-count]");
        const final = count?.textContent ?? "";
        const target = /^(\d+)%$/.exec(final);
        if (count && target) {
          const state = { value: 0 };
          timeline.to(
            state,
            {
              value: Number(target[1]),
              ease: "power3.out",
              onUpdate: () => {
                count.textContent = `${Math.round(state.value)}%`;
              },
              onComplete: () => {
                count.textContent = final;
              },
            },
            0.1,
          );
        }

        const you = element.querySelector<HTMLElement>("[data-scale-you]");
        // The marker's resting place is a percentage of the bar; x is zeroed so that is the only offset.
        if (you) timeline.fromTo(you, { xPercent: 50, x: 0 }, { xPercent: Number(you.dataset.at), x: 0 }, 0.15);
        const fill = element.querySelector<HTMLElement>("[data-scale-fill]");
        if (fill) timeline.fromTo(fill, { scaleX: 0 }, { scaleX: Number(fill.dataset.at) / 100 }, 0.15);

        const grains = element.querySelectorAll<HTMLElement>("[data-grain]");
        if (grains.length > 0) {
          timeline.from(grains, { y: -150, rotation: -60, autoAlpha: 0, duration: 0.8, ease: "power2.out", stagger: 0.05 }, 0.05);
        }
      });
    },
    { scope: root },
  );
}
