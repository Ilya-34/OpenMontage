import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const WARP_DURATION = 14;

// Liquid-warp entrance: an SVG feTurbulence/feDisplacementMap filter bends
// the frame as if the screen itself were flexing, settling to flat over
// ~0.45s. The "curved/warped screen" look — smoother and more organic than
// GlitchCut's hard RGB-split jitter.
export const ScreenWarp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, WARP_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const filterId = "screenWarpFilter";
  const scale = progress * 45;

  return (
    <AbsoluteFill>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.015"
              numOctaves={2}
              seed={4}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{ filter: scale > 0.5 ? `url(#${filterId})` : undefined }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
