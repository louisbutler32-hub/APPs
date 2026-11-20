/** A salt shaker. Verdicts show one to three of them: more shakers, more reason to be salty. */
export function Shaker({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} aria-hidden fill="none">
      <path d="M7 9h10l2.2 17.2a3 3 0 0 1-3 3.3H7.8a3 3 0 0 1-3-3.3L7 9Z" fill="white" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6.5 9a5.5 5.5 0 0 1 11 0v0h-11v0Z" fill="currentColor" />
      <circle cx="10" cy="5.6" r="0.9" fill="white" />
      <circle cx="14" cy="5.6" r="0.9" fill="white" />
      <circle cx="12" cy="3.6" r="0.9" fill="white" />
      <path d="M9 17.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
