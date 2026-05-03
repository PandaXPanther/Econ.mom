interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 32, withWordmark = false, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="brand-logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="The Mother Of Econ"
        className="shrink-0"
      >
        {/* Seal / sigil: italic M with accent dot — a library signet */}
        <rect x="1" y="1" width="62" height="62" rx="10" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
        <rect x="5" y="5" width="54" height="54" rx="7" fill="currentColor" />
        <text
          x="32"
          y="44"
          fontFamily="Fraunces, Georgia, serif"
          fontSize="38"
          fontWeight="700"
          fontStyle="italic"
          textAnchor="middle"
          fill="hsl(var(--primary-foreground))"
          style={{ letterSpacing: "-0.02em" }}
        >
          M
        </text>
        <circle cx="50" cy="17" r="3.5" fill="hsl(var(--accent))" />
      </svg>
      {withWordmark && (
        <div className="leading-none">
          <div className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground" style={{ fontStyle: "italic" }}>
            The Mother <span className="text-muted-foreground not-italic">of</span> Econ
          </div>
          <div className="label-cap mt-1 text-[0.625rem]">
            econ.mom · eight tools, one thesis
          </div>
        </div>
      )}
    </div>
  );
}
