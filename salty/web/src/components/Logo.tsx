/** The wordmark: lowercase "salty" with a single tilted grain of salt as its full stop. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`display inline-flex items-baseline text-[1.75rem] leading-none ${className}`}>
      salty
      <span aria-hidden className="ml-[0.07em] inline-block size-[0.22em] rotate-[18deg] rounded-[1px] bg-brine" />
    </span>
  );
}
