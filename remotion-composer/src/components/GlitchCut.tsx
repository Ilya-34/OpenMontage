import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// RGB-split / glitch cut: two hue-shifted, screen-blended copies of the same
// content jitter apart from the base layer for a handful of frames, plus a
// couple of horizontally-displaced scan-slice bands, then settle to normal.
// Not a scientifically exact channel split — it's the cheap, standard
// web/CSS approximation of chromatic aberration, tuned for readability.
const GLITCH_DURATION = 8;

export const GlitchCut: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const intensity = interpolate(frame, [0, GLITCH_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (intensity <= 0) {
    return <>{children}</>;
  }

  const jitter = (seed: number) => Math.sin(frame * 13.7 + seed) * 10 * intensity;

  return (
    <AbsoluteFill>
      <AbsoluteFill>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          transform: `translateX(${jitter(1) - 6 * intensity}px)`,
          filter: "sepia(1) saturate(6) hue-rotate(-50deg) brightness(1.1)",
          opacity: 0.7 * intensity,
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          transform: `translateX(${jitter(5) + 6 * intensity}px)`,
          filter: "sepia(1) saturate(6) hue-rotate(150deg) brightness(1.1)",
          opacity: 0.7 * intensity,
        }}
      >
        {children}
      </AbsoluteFill>
      {intensity > 0.3 && (
        <AbsoluteFill
          style={{
            clipPath: `inset(${30 + jitter(2)}% 0 ${40 - jitter(3)}% 0)`,
            transform: `translateX(${jitter(7) * 2}px)`,
            mixBlendMode: "difference",
            opacity: 0.45 * intensity,
          }}
        >
          {children}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
