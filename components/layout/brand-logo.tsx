/** Minimal open-ledger mark — two page strokes meeting at a spine, no background shape, just line art in the brand's forest + gold colors. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 34" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M22 8.5C17.5 5.3 10.5 4.2 4 5.6V26.4C10.5 25 17.5 26.1 22 29.3"
        stroke="#1F3A28"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M22 8.5C26.5 5.3 33.5 4.2 40 5.6V26.4C33.5 25 26.5 26.1 22 29.3"
        stroke="#B8863B"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="22" y1="8.5" x2="22" y2="29.3" stroke="#B8863B" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
