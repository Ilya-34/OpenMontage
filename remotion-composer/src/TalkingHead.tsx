import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CaptionOverlay, WordCaption } from "./components/CaptionOverlay";
import { resolveAsset } from "./lib/resolveAsset";
import { TextCard } from "./components/TextCard";
import { StatCard } from "./components/StatCard";
import { CalloutBox } from "./components/CalloutBox";
import { ComparisonCard } from "./components/ComparisonCard";
import { BarChart } from "./components/charts/BarChart";
import { LineChart } from "./components/charts/LineChart";
import { PieChart } from "./components/charts/PieChart";
import { KPIGrid } from "./components/charts/KPIGrid";
import { HeroTitle } from "./components/HeroTitle";
import { SectionTitle } from "./components/SectionTitle";
import { StatReveal } from "./components/StatReveal";
import { PhoneFrame } from "./components/PhoneFrame";
import { PunchIn } from "./components/PunchIn";
import { GlitchCut } from "./components/GlitchCut";
import { ZoomPan } from "./components/ZoomPan";
import { ScreenWarp } from "./components/ScreenWarp";

// ---------------------------------------------------------------------------
// Overlay types for talking-head video
// ---------------------------------------------------------------------------

export interface TalkingHeadOverlay {
  id?: string;
  type: string;
  in_seconds: number;
  out_seconds: number;
  position?:
    | "lower_third"
    | "upper_third"
    | "left_panel"
    | "right_panel"
    | "full_overlay";
  // Component-specific props (same as Explainer Cut)
  text?: string;
  stat?: string;
  subtitle?: string;
  callout_type?: "info" | "warning" | "tip" | "quote";
  title?: string;
  leftLabel?: string;
  rightLabel?: string;
  leftValue?: string;
  rightValue?: string;
  chartData?: any[];
  chartSeries?: any[];
  chartColors?: string[];
  chartAnimation?: string;
  donut?: boolean;
  centerLabel?: string;
  centerValue?: string;
  showGrid?: boolean;
  showValues?: boolean;
  showLegend?: boolean;
  showMarkers?: boolean;
  columns?: 2 | 3 | 4;
  // B-roll cutaway: a full-screen video that covers the talking-head layer
  // for this overlay's duration while the original audio keeps playing
  // underneath (classic L-cut). Use position: "full_overlay".
  videoSrc?: string;
  // Entrance/hold treatment on the cut. Replaces the default fade when set.
  // "punch"/"glitch" are one-off entrance hits; "zoom" runs a slow
  // continuous scale for the whole cutaway; "warp" is a liquid screen-flex
  // settle-in (the "curved screen" look).
  transition?: "punch" | "glitch" | "zoom" | "warp";
  // Wraps the overlay content in the device-frame treatment: a bold
  // all-caps label over a rounded-rect card. Plain black-backdrop card by
  // default; set frameGlow for the neon high-impact variant.
  phoneFrame?: boolean;
  frameLabel?: string;
  frameGlow?: boolean;
  // Styling
  backgroundColor?: string;
  color?: string;
  accentColor?: string;
  fontSize?: number;
}

// ---------------------------------------------------------------------------
// Position presets for 9:16 (1080x1920) frame
// ---------------------------------------------------------------------------

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  lower_third: {
    position: "absolute",
    // Captions now live centered in the bottom half of the frame (y=960-
    // 1920), so this needs to clear that zone entirely rather than sit just
    // above the old bottom-edge-pinned caption strip.
    bottom: 1050,
    left: 40,
    right: 40,
    height: 420,
  },
  upper_third: {
    position: "absolute",
    top: 80,
    left: 40,
    right: 40,
    height: 480,
  },
  left_panel: {
    position: "absolute",
    top: 200,
    left: 40,
    width: 480,
    bottom: 400,
  },
  right_panel: {
    position: "absolute",
    top: 200,
    right: 40,
    width: 480,
    bottom: 400,
  },
  full_overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
};

// ---------------------------------------------------------------------------
// Overlay component dispatcher — maps overlay type to Remotion component
// ---------------------------------------------------------------------------

const OverlayContent: React.FC<{ overlay: TalkingHeadOverlay }> = ({
  overlay,
}) => {
  const bgColor = overlay.backgroundColor || "#0F172A";

  if (overlay.type === "text_card" && overlay.text) {
    return (
      <TextCard
        text={overlay.text}
        fontSize={overlay.fontSize}
        color={overlay.color}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "stat_card" && overlay.stat) {
    return (
      <StatCard
        stat={overlay.stat}
        subtitle={overlay.subtitle}
        accentColor={overlay.accentColor}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "callout" && overlay.text) {
    return (
      <CalloutBox
        text={overlay.text}
        type={overlay.callout_type}
        title={overlay.title}
        borderColor={overlay.accentColor}
        backgroundColor={overlay.backgroundColor}
        textColor={overlay.color}
        // "transparent", not bgColor: CalloutBox's containerBackgroundColor
        // paints its full bounding box, and overlay.backgroundColor already
        // colors CalloutBox's own inner card — passing the same color to
        // both stacked two identical rectangles into one flat, borderless
        // block instead of a single floating card.
        containerBackgroundColor="transparent"
      />
    );
  }
  if (
    overlay.type === "comparison" &&
    overlay.leftLabel &&
    overlay.rightLabel
  ) {
    return (
      <ComparisonCard
        leftLabel={overlay.leftLabel}
        rightLabel={overlay.rightLabel}
        leftValue={overlay.leftValue || ""}
        rightValue={overlay.rightValue || ""}
        title={overlay.title}
        backgroundColor={bgColor}
        textColor={overlay.color}
      />
    );
  }
  if (overlay.type === "bar_chart" && overlay.chartData) {
    return (
      <BarChart
        data={overlay.chartData}
        title={overlay.title}
        colors={overlay.chartColors}
        animationStyle={(overlay.chartAnimation as any) || "grow-up"}
        showValues={overlay.showValues}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "line_chart" && overlay.chartSeries) {
    return (
      <LineChart
        series={overlay.chartSeries}
        title={overlay.title}
        colors={overlay.chartColors}
        animationStyle={(overlay.chartAnimation as any) || "draw"}
        showGrid={overlay.showGrid}
        showMarkers={overlay.showMarkers}
        showLegend={overlay.showLegend}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "pie_chart" && overlay.chartData) {
    return (
      <PieChart
        data={overlay.chartData}
        title={overlay.title}
        colors={overlay.chartColors}
        animationStyle={(overlay.chartAnimation as any) || "expand"}
        donut={overlay.donut}
        centerLabel={overlay.centerLabel}
        centerValue={overlay.centerValue}
        showLegend={overlay.showLegend}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "kpi_grid" && overlay.chartData) {
    return (
      <KPIGrid
        metrics={overlay.chartData}
        title={overlay.title}
        columns={overlay.columns}
        colors={overlay.chartColors}
        animationStyle={(overlay.chartAnimation as any) || "count-up"}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "hero_title" && overlay.text) {
    return (
      <HeroTitle
        title={overlay.text}
        subtitle={overlay.subtitle}
        accentColor={overlay.accentColor}
      />
    );
  }
  if (overlay.type === "section_title" && overlay.text) {
    return (
      <SectionTitle
        title={overlay.text}
        subtitle={overlay.subtitle}
        accentColor={overlay.accentColor}
        position="top-left"
      />
    );
  }
  if (overlay.type === "video_cutaway" && overlay.videoSrc) {
    return (
      <OffthreadVideo
        muted
        src={resolveAsset(overlay.videoSrc)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  if (overlay.type === "stat_reveal" && overlay.text) {
    return (
      <StatReveal
        stat={overlay.text}
        label={overlay.subtitle}
        accentColor={overlay.accentColor}
        position="bottom-right"
      />
    );
  }
  return null;
};

// ---------------------------------------------------------------------------
// Positioned overlay wrapper — handles position + fade in/out
// ---------------------------------------------------------------------------

const PositionedOverlay: React.FC<{ overlay: TalkingHeadOverlay }> = ({
  overlay,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in over 8 frames (~0.27s), fade out over 8 frames
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = fadeIn * fadeOut;

  const position = overlay.position || "lower_third";
  const posStyle = POSITION_STYLES[position] || POSITION_STYLES.lower_third;
  const isFullOverlay = position === "full_overlay";

  let content = <OverlayContent overlay={overlay} />;
  if (overlay.phoneFrame) {
    content = (
      <PhoneFrame
        label={overlay.frameLabel}
        accentColor={overlay.accentColor}
        glow={overlay.frameGlow}
      >
        {content}
      </PhoneFrame>
    );
  }
  if (overlay.transition === "punch") {
    content = <PunchIn>{content}</PunchIn>;
  } else if (overlay.transition === "glitch") {
    content = <GlitchCut>{content}</GlitchCut>;
  } else if (overlay.transition === "zoom") {
    content = <ZoomPan>{content}</ZoomPan>;
  } else if (overlay.transition === "warp") {
    content = <ScreenWarp>{content}</ScreenWarp>;
  }

  return (
    <div
      style={{
        ...posStyle,
        // A transition already handles its own entrance treatment (punch
        // flash / glitch jitter); layering the plain opacity fade on top of
        // it just dulls the hit. Only fall back to the fade when there's no
        // explicit transition.
        opacity: overlay.transition ? 1 : opacity,
        overflow: "hidden",
        borderRadius: isFullOverlay ? 0 : 16,
        boxShadow: isFullOverlay
          ? "none"
          : "0 8px 32px rgba(0, 0, 0, 0.4)",
      }}
    >
      {isFullOverlay && (
        <AbsoluteFill style={{ background: "rgba(0, 0, 0, 0.7)" }} />
      )}
      {/* Explicitly stacked above the scrim: a plain (position:static)
          child here would otherwise still paint UNDER an absolutely
          positioned sibling per normal CSS stacking rules regardless of
          DOM order — which is exactly what made every "glitch" cutaway go
          dark for most of its duration once GlitchCut's post-effect bypass
          (`return <>{children}</>`) stopped wrapping it in an AbsoluteFill. */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {content}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main TalkingHead composition
// ---------------------------------------------------------------------------

export interface TalkingHeadProps {
  [key: string]: unknown;
  videoSrc: string;
  captions: WordCaption[];
  overlays?: TalkingHeadOverlay[];
  wordsPerPage?: number;
  // When set, captions wrap to at most this many lines (measured, not a word
  // count guess) instead of using wordsPerPage. See CaptionOverlay.
  maxLines?: number;
  // Break caption pages at clause/sentence punctuation instead of a fixed
  // word count — takes priority over maxLines/wordsPerPage when set.
  semanticPaging?: boolean;
  semanticMinWords?: number;
  semanticMaxWords?: number;
  fontSize?: number;
  highlightColor?: string;
  captionColor?: string;
  captionBackgroundColor?: string;
  captionFontFamily?: string;
  // Pass "" for CJK captions (no inter-word spacing); defaults to " ".
  captionWordSeparator?: string;
}

export const TalkingHead: React.FC<TalkingHeadProps> = ({
  videoSrc,
  captions,
  overlays,
  wordsPerPage = 4,
  maxLines,
  semanticPaging,
  semanticMinWords,
  semanticMaxWords,
  fontSize = 52,
  highlightColor = "#22D3EE",
  captionColor = "#FFFFFF",
  captionBackgroundColor = "rgba(0, 0, 0, 0.65)",
  captionFontFamily,
  captionWordSeparator,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  // Soft fade-in ("наплыв") on the host at the very start of the video,
  // instead of opening on a b-roll cutaway.
  const introOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 1: Video background */}
      <OffthreadVideo
        src={resolveAsset(videoSrc)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: introOpacity,
        }}
      />

      {/* Layer 2: Overlays (charts, stats, callouts, etc.) */}
      {overlays?.map((overlay, i) => {
        const from = Math.round(overlay.in_seconds * fps);
        const duration = Math.round(
          (overlay.out_seconds - overlay.in_seconds) * fps
        );
        return (
          <Sequence
            key={overlay.id || `overlay-${i}`}
            from={from}
            durationInFrames={duration}
          >
            <PositionedOverlay overlay={overlay} />
          </Sequence>
        );
      })}

      {/* Layer 3: Captions (topmost — always visible above overlays).
          Explicit z-index, not just DOM order: a full_overlay cutaway's own
          Sequence turned out to paint above this layer during the cutaway
          (captions vanished on every b-roll segment, worked fine on plain
          talking-head footage) — relying on "renders later in JSX" to mean
          "stacks on top" isn't reliable once nested overlay content brings
          in its own positioned wrappers (PunchIn/GlitchCut/PhoneFrame). An
          explicit, high z-index makes this layer unambiguously topmost. */}
      <div style={{ position: "absolute", inset: 0, zIndex: 100 }}>
        <CaptionOverlay
          words={captions}
          wordsPerPage={wordsPerPage}
          {...(maxLines ? { maxLines } : {})}
          {...(semanticPaging ? { semanticPaging } : {})}
          {...(semanticMinWords !== undefined ? { semanticMinWords } : {})}
          {...(semanticMaxWords !== undefined ? { semanticMaxWords } : {})}
          fontSize={fontSize}
          highlightColor={highlightColor}
          backgroundColor={captionBackgroundColor}
          color={captionColor}
          {...(captionFontFamily ? { fontFamily: captionFontFamily } : {})}
          {...(captionWordSeparator !== undefined ? { wordSeparator: captionWordSeparator } : {})}
        />
      </div>
    </AbsoluteFill>
  );
};
