interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/**
 * econ.mom seal, italic serif M monogram on a purple→magenta gradient,
 * with a small "equilibrium dot" at the M's apex and a pink accent dot
 * representing the period in "econ.mom". Matches favicon.svg pixel-for-pixel.
 */
export function Logo({ size = 32, withWordmark = false, className = "" }: LogoProps) {
  // Stable id-suffix per instance to avoid gradient collisions when the logo
  // is mounted multiple times on a single page.
  const uid = `logo-${size}`;
  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="brand-logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="The Mother Of Econ"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={`${uid}-seal`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2A0E47" />
            <stop offset="55%" stopColor="#7A2EAF" />
            <stop offset="100%" stopColor="#E13DA8" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="0.3" cy="0.25" r="0.85">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Foil outer ring */}
        <rect
          x="1.25"
          y="1.25"
          width="61.5"
          height="61.5"
          rx="14"
          fill="none"
          stroke="#E13DA8"
          strokeWidth="0.9"
          opacity="0.55"
        />

        {/* Seal */}
        <rect x="4" y="4" width="56" height="56" rx="12" fill={`url(#${uid}-seal)`} />
        <rect x="4" y="4" width="56" height="56" rx="12" fill={`url(#${uid}-glow)`} />

        {/* Inner hairline */}
        <rect
          x="6.5"
          y="6.5"
          width="51"
          height="51"
          rx="9.5"
          fill="none"
          stroke="#FAF6FF"
          strokeWidth="0.55"
          opacity="0.22"
        />

        {/* Italic serif M */}
        <text
          x="32"
          y="46.5"
          fontFamily='Fraunces, "Playfair Display", Georgia, "Times New Roman", serif'
          fontSize="44"
          fontWeight="700"
          fontStyle="italic"
          textAnchor="middle"
          fill="#FAF6FF"
          style={{ letterSpacing: "-1.2px" }}
        >
          M
        </text>

        {/* Equilibrium dot at the apex */}
        <circle cx="32" cy="22.5" r="2.4" fill="#FFC2E5" />
        <circle cx="32" cy="22.5" r="1.1" fill="#E13DA8" />

        {/* Accent dot, the period of econ.mom */}
        <circle cx="50" cy="50" r="2.6" fill="#FFC2E5" />
      </svg>

      {withWordmark && (
        <div className="leading-none">
          <div
            className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground"
            style={{ fontStyle: "italic" }}
          >
            The Mother{" "}
            <span className="text-muted-foreground not-italic">of</span> Econ
          </div>
          <div className="label-cap mt-1 text-[0.625rem]">
            econ.mom · twelve tools, one thesis
          </div>
        </div>
      )}
    </div>
  );
}
