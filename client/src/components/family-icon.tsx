export function FamilyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left adult (tall) — head + standing body silhouette */}
      <circle cx="4.5" cy="4" r="2" />
      <path d="M1 17v-3a3.5 3.5 0 0 1 7 0v3" />

      {/* Right adult (tall) — mirrored */}
      <circle cx="19.5" cy="4" r="2" />
      <path d="M16 17v-3a3.5 3.5 0 0 1 7 0v3" />

      {/* Middle child (shorter, smaller head) */}
      <circle cx="12" cy="7" r="1.5" />
      <path d="M9.5 17v-2a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
