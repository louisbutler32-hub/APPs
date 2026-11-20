/**
 * The site's few icons, drawn on one 24-unit grid with one stroke, so they read as a set.
 * No emoji and no text characters standing in for icons anywhere on the site.
 */
function Icon({ children, className = "size-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      {children}
    </svg>
  );
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </Icon>
  );
}
