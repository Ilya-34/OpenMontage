import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Punchy zoom-in entrance: a quick overshoot scale settle plus a fast white
// flash on the cut, the classic energetic short-form-video hit.
export const PunchIn: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.6 },
    from: 1.22,
    to: 1,
  });
  const flash = interpolate(frame, [0, 2, 9], [0.85, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: "#FFFFFF", opacity: flash, pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
};
