"use client";

import SplitText from "./reactbits/SplitText";

/**
 * The headline on the pages that open with the pay check. Its letters arrive once when the page
 * loads (React Bits' SplitText, on GSAP). Screen readers get it as one plain line, and it shows
 * at once for anyone who has asked for less motion.
 */
export function HeroTitle({ text }: { text: string }) {
  return (
    <h1 className="display text-[clamp(3.25rem,13vw,6rem)]">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="block">
        <SplitText
          tag="span"
          text={text}
          trigger="load"
          splitType="words, chars"
          textAlign="left"
          delay={22}
          duration={0.9}
          ease="expo.out"
          from={{ opacity: 0, yPercent: 55, filter: "blur(10px)" }}
          to={{ opacity: 1, yPercent: 0, filter: "blur(0px)" }}
          // Room for the letters that hang below the line, which the entrance would otherwise clip.
          className="-my-[0.14em] py-[0.14em]"
        />
      </span>
    </h1>
  );
}
