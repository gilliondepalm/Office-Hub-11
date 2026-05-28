export function FamilyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left adult */}
      <circle cx="4.5" cy="4.5" r="2.2" />
      <path d="M0.8 13a3.7 3.7 0 0 1 7.4 0" />
      {/* Middle child (smaller) */}
      <circle cx="12" cy="6.5" r="1.6" />
      <path d="M9.5 13a2.5 2.5 0 0 1 5 0" />
      {/* Right adult */}
      <circle cx="19.5" cy="4.5" r="2.2" />
      <path d="M15.8 13a3.7 3.7 0 0 1 7.4 0" />
      {/* Plus sign bottom-right */}
      <line x1="20.5" y1="17.5" x2="20.5" y2="23.5" />
      <line x1="17.5" y1="20.5" x2="23.5" y2="20.5" />
    </svg>
  );
}
