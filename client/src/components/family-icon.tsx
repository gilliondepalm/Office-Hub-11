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
      <circle cx="4.5" cy="5" r="2" />
      <path d="M1 14a3.5 3.5 0 0 1 7 0" />
      <circle cx="19.5" cy="5" r="2" />
      <path d="M16 14a3.5 3.5 0 0 1 7 0" />
      <circle cx="12" cy="7.5" r="1.5" />
      <path d="M9.5 14a2.5 2.5 0 0 1 5 0" />
    </svg>
  );
}
