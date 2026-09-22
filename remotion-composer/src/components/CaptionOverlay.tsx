import { Fragment } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Word-level caption for TikTok-style highlight display
export interface WordCaption {
  word: string;
  startMs: number;
  endMs: number;
  // Force a page break after this word (e.g. sentence or scene boundaries).
  // Useful for CJK captions where pages should align with clause boundaries.
  pageBreakAfter?: boolean;
  // Only words marked true ever take the accent (highlightColor) treatment
  // while active. Everything else just turns solid (base `color`) as it's
  // spoken instead of cycling through the accent — the accent is reserved
  // for curated emphasis, not a per-word karaoke sweep.
  keyword?: boolean;
}

type CaptionOverlayProps = {
  words: WordCaption[];
  // How many words to show at once in a "page". Ignored when `maxLines` is set.
  wordsPerPage?: number;
  // When set, pages are built by measuring real text width so each page wraps
  // to at most this many lines (e.g. 2 for two-row captions), instead of the
  // blunt `wordsPerPage` word count.
  maxLines?: number;
  // Fraction of the composition width the caption block may use. Must match
  // the rendered box's maxWidth for line measurement to be accurate.
  maxWidthPercent?: number;
  // Break pages at clause/sentence punctuation instead of a fixed word
  // count (still capped by maxLines/wordsPerPage as a fallback). Takes
  // priority over maxLines when both are set.
  semanticPaging?: boolean;
  semanticMinWords?: number;
  semanticMaxWords?: number;
  fontSize?: number;
  color?: string;
  highlightColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  // Separator rendered between words. Space-delimited languages want the
  // default " "; CJK languages (no inter-word spacing) should pass "".
  wordSeparator?: string;
};

interface CaptionPage {
  words: WordCaption[];
  startMs: number;
  endMs: number;
}

function buildPages(words: WordCaption[], wordsPerPage: number): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let pageWords: WordCaption[] = [];
  const flush = () => {
    if (pageWords.length === 0) return;
    pages.push({
      words: pageWords,
      startMs: pageWords[0].startMs,
      endMs: pageWords[pageWords.length - 1].endMs,
    });
    pageWords = [];
  };
  for (const w of words) {
    pageWords.push(w);
    if (pageWords.length >= wordsPerPage || w.pageBreakAfter) flush();
  }
  flush();
  return pages;
}

// Break preferentially at clause/sentence punctuation instead of a blind
// word count, so a page never ends mid-clause (e.g. splitting a short
// connector like "а" or "не" away from the words it modifies). A word
// ending in ".", "!", or "?" always ends the page (sentence boundary); a
// trailing "," ends it once the page already has at least minWords, so we
// don't flush on every tiny comma-separated aside; maxWords is a hard cap
// so an unpunctuated run still wraps to a new page in time.
function buildPagesBySemantics(
  words: WordCaption[],
  opts: { minWords: number; maxWords: number }
): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let pageWords: WordCaption[] = [];
  const flush = () => {
    if (pageWords.length === 0) return;
    pages.push({
      words: pageWords,
      startMs: pageWords[0].startMs,
      endMs: pageWords[pageWords.length - 1].endMs,
    });
    pageWords = [];
  };
  for (const w of words) {
    pageWords.push(w);
    const text = w.word.trim();
    const endsSentence = /[.!?]$/.test(text);
    const endsClause = /,$/.test(text) && pageWords.length >= opts.minWords;
    const atCap = pageWords.length >= opts.maxWords;
    if (w.pageBreakAfter || endsSentence || endsClause || atCap) flush();
  }
  flush();
  return pages;
}

// Cache one canvas across calls; text measurement is the only thing it's used for.
let measureCanvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * font.length * 0; // SSR/build guard
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return text.length * 10;
  ctx.font = font;
  return ctx.measureText(text).width;
}

// Width-aware pagination: greedily wraps words into lines using real text
// measurement, and starts a new page once a page would exceed `maxLines`.
// This is what guarantees "two-row" (or N-row) captions regardless of how
// long individual words are, which a fixed word count cannot.
function buildPagesByLines(
  words: WordCaption[],
  opts: {
    fontSize: number;
    fontFamily: string;
    fontWeight?: number;
    maxLines: number;
    maxWidthPx: number;
    wordSeparator: string;
  }
): CaptionPage[] {
  const font = `${opts.fontWeight ?? 700} ${opts.fontSize}px ${opts.fontFamily}`;
  const sepWidth = measureTextWidth(opts.wordSeparator || " ", font) || opts.fontSize * 0.3;
  const pages: CaptionPage[] = [];
  let pageWords: WordCaption[] = [];
  let lineCount = 1;
  let lineWidth = 0;

  const flush = () => {
    if (pageWords.length === 0) return;
    pages.push({
      words: pageWords,
      startMs: pageWords[0].startMs,
      endMs: pageWords[pageWords.length - 1].endMs,
    });
    pageWords = [];
    lineCount = 1;
    lineWidth = 0;
  };

  for (const w of words) {
    const wordWidth = measureTextWidth(w.word, font);
    const addWidth = lineWidth === 0 ? wordWidth : sepWidth + wordWidth;

    if (lineWidth > 0 && lineWidth + addWidth > opts.maxWidthPx) {
      lineCount += 1;
      lineWidth = 0;
      if (lineCount > opts.maxLines) {
        flush();
      }
    }

    lineWidth += lineWidth === 0 ? wordWidth : sepWidth + wordWidth;
    pageWords.push(w);
    if (w.pageBreakAfter) flush();
  }
  flush();
  return pages;
}

const PageRenderer: React.FC<{
  page: CaptionPage;
  fontSize: number;
  color: string;
  highlightColor: string;
  backgroundColor: string;
  fontFamily: string;
  wordSeparator: string;
}> = ({ page, fontSize, color, highlightColor, backgroundColor, fontFamily, wordSeparator }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentMs = page.startMs + (frame / fps) * 1000;

  // Spring entrance
  const entrance = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  return (
    <AbsoluteFill
      style={{
        // Bottom half of the frame, captions centered within that band
        // (not pinned to the bottom edge).
        top: "50%",
        height: "50%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: entrance,
          transform: `translateY(${interpolate(entrance, [0, 1], [20, 0])}px)`,
          backgroundColor,
          borderRadius: 12,
          padding: "14px 28px",
          maxWidth: "80%",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 700,
            fontFamily,
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
          }}
        >
          {page.words.map((w, i) => {
            const isActive = w.startMs <= currentMs && w.endMs > currentMs;
            const isPast = w.endMs <= currentMs;
            // Accent color is reserved for curated keyword emphasis, not a
            // per-word karaoke sweep: a non-keyword word just turns solid
            // (base color) once it starts being spoken.
            const isKeyActive = isActive && w.keyword;
            return (
              <Fragment key={`${w.startMs}-${i}`}>
                <span
                  style={{
                    // Keep each word unbroken so lines wrap only at word
                    // boundaries. For space-delimited text this matches the
                    // previous behavior; for CJK it prevents mid-word breaks.
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    color: isKeyActive ? highlightColor : isPast || isActive ? color : `${color}99`,
                    transition: "none", // CSS transitions forbidden in Remotion
                    // A soft, wide "cloud" of shadow (large blur, near-zero
                    // offset) for real separation from any background, plus
                    // a tighter contact shadow underneath for definition —
                    // deliberately blurred, not a crisp drop shadow.
                    textShadow: isKeyActive
                      ? `0 0 26px ${highlightColor}88, 0 4px 10px rgba(0,0,0,0.85), 0 0 34px rgba(0,0,0,0.6)`
                      : "0 4px 10px rgba(0,0,0,0.85), 0 0 34px rgba(0,0,0,0.6)",
                  }}
                >
                  {w.word}
                </span>
                {i < page.words.length - 1 && (
                  // A separate, non-collapsing span: a separator placed as
                  // the trailing character *inside* the word's inline-block
                  // span above gets collapsed away by the browser (trailing
                  // whitespace at the end of an inline-block is trimmed),
                  // which is what silently ran every word together.
                  <span style={{ whiteSpace: "pre" }}>{wordSeparator}</span>
                )}
              </Fragment>
            );
          })}
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  words,
  wordsPerPage = 6,
  maxLines,
  maxWidthPercent = 0.8,
  semanticPaging = false,
  semanticMinWords = 2,
  semanticMaxWords = 5,
  fontSize = 42,
  color = "#F8FAFC",
  highlightColor = "#22D3EE",
  backgroundColor = "rgba(15, 23, 42, 0.75)",
  fontFamily = "Space Grotesk, Inter, system-ui, sans-serif",
  wordSeparator = " ",
}) => {
  const { fps, width } = useVideoConfig();
  // Horizontal padding from the box below ("14px 28px") eats into the
  // measurable width on each side. The extra 0.8 factor is a safety margin:
  // canvas measureText() and the actual DOM/Chromium text layout can resolve
  // font fallbacks (this component's default stack falls through to
  // "system-ui" without ever loading a webfont) to slightly different
  // metrics, so packing to the literal computed width intermittently let a
  // page overflow to one more real line than planned.
  const maxWidthPx = (width * maxWidthPercent - 28 * 2) * 0.8;
  const pages = semanticPaging
    ? buildPagesBySemantics(words, {
        minWords: semanticMinWords,
        maxWords: semanticMaxWords,
      })
    : maxLines
    ? buildPagesByLines(words, {
        fontSize,
        fontFamily,
        maxLines,
        maxWidthPx,
        wordSeparator,
      })
    : buildPages(words, wordsPerPage);

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const fromFrame = Math.round((page.startMs / 1000) * fps);
        const nextStart = pages[i + 1]?.startMs ?? page.endMs + 500;
        const duration = Math.max(
          1,
          Math.round(((nextStart - page.startMs) / 1000) * fps)
        );

        return (
          <Sequence key={i} from={fromFrame} durationInFrames={duration}>
            <PageRenderer
              page={page}
              fontSize={fontSize}
              color={color}
              highlightColor={highlightColor}
              backgroundColor={backgroundColor}
              fontFamily={fontFamily}
              wordSeparator={wordSeparator}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
