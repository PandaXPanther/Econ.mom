export function EconLeverLogo({ className = "" }: { className?: string }) {
  // Geometric mark: a lever pivoting on a fulcrum.
  // A horizontal beam tilted slightly off-center, balancing on a triangular
  // fulcrum — visualizing the policy "levers" the simulator exposes.
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="EconLever logo"
    >
      {/* Outer ring for visual containment */}
      <circle cx="16" cy="16" r="13" strokeWidth="1.75" />
      {/* Lever beam, tilted */}
      <line x1="5.5" y1="11.5" x2="26.5" y2="16.5" strokeWidth="2.25" />
      {/* Counterweight nodes at each end of the lever */}
      <circle cx="5.5" cy="11.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="26.5" cy="16.5" r="1.6" fill="currentColor" stroke="none" />
      {/* Triangular fulcrum */}
      <path d="M11 24 L16 16 L21 24 Z" strokeWidth="1.75" />
      {/* Baseline ground line */}
      <line x1="8" y1="24" x2="24" y2="24" strokeWidth="1" opacity="0.45" />
    </svg>
  );
}
