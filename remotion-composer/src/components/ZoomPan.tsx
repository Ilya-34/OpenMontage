import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Slow continuous zoom for the whole cutaway (Ken Burns style), instead of
// a one-off entrance hit — a calmer, classic alternative to punch/glitch.
export const ZoomPan: React.FC<{ children: React.ReactNode; from?: number; to?: number }> = ({
  children,
  from = 1.0,
  to = 1.1,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
