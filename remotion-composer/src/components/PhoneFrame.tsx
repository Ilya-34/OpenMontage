import { AbsoluteFill } from "remotion";

// "Screen recording inside a screen recording" device-frame treatment: a
// bold all-caps label above a rounded-rect frame that contains the cutaway
// content. Two looks, picked with `glow`:
//  - glow=false (default): plain black backdrop, soft neutral drop shadow,
//    no colored border — the quiet, premium "rounded card on black" look
//    from the Pavel reference video.
//  - glow=true: the original neon tutorial-reveal treatment (colored border
//    + bloom), reserved for a specific high-impact "reveal" beat.
interface PhoneFrameProps {
  label?: string;
  accentColor?: string;
  glow?: boolean;
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  label,
  accentColor = "#FFB020",
  glow = false,
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: "#000000",
      }}
    >
      {label && (
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            color: "#FFFFFF",
            fontFamily: "Space Grotesk, Inter, system-ui, sans-serif",
            textShadow: glow
              ? `0 0 28px ${accentColor}cc, 0 4px 14px rgba(0,0,0,0.7)`
              : "0 4px 14px rgba(0,0,0,0.7)",
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          position: "relative",
          width: "84%",
          aspectRatio: "9 / 16",
          borderRadius: 40,
          overflow: "hidden",
          border: glow ? `3px solid ${accentColor}` : "none",
          boxShadow: glow
            ? `0 0 40px ${accentColor}99, 0 0 100px ${accentColor}44, inset 0 0 30px rgba(0,0,0,0.45)`
            : "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
