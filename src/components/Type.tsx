import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/** Word-by-word reveal. Staggered, springy, 3 properties, hard exit. */
export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  exitAt?: number;
  size: number;
  color?: string;
  font?: string;
  weight?: number;
  tracking?: number;
  lineHeight?: number;
  shadow?: boolean;
  align?: "center" | "left";
}> = ({
  text,
  delay = 0,
  exitAt,
  size,
  color = theme.color.cream,
  font = theme.font.display,
  weight = 400,
  tracking = 0,
  lineHeight = 1.02,
  shadow = true,
  align = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = text.split(" ");
  const out = exitAt ?? durationInFrames - theme.t.exit;

  const exit = interpolate(frame, [out, out + theme.t.exit], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.in,
  });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: `${size * 0.24}px`,
        justifyContent: align === "center" ? "center" : "flex-start",
        opacity: 1 - exit,
        transform: `translateY(${exit * -26}px)`,
      }}
    >
      {words.map((w, i) => {
        const s = spring({
          frame: frame - delay - i * theme.t.stagger,
          fps,
          config: theme.spring.pop,
          durationInFrames: theme.t.enter + 6,
        });
        return (
          <span
            key={i}
            style={{
              fontFamily: font,
              fontSize: size,
              fontWeight: weight,
              letterSpacing: tracking,
              lineHeight,
              color,
              display: "inline-block",
              opacity: s,
              transform: `translateY(${(1 - s) * size * 0.5}px) scale(${0.86 + s * 0.14})`,
              textShadow: shadow ? "0 6px 26px rgba(0,0,0,0.62)" : "none",
              whiteSpace: "pre",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Small uppercase label with a gold rule that wipes open under it. */
export const Kicker: React.FC<{ text: string; delay?: number; exitAt?: number; color?: string }> = ({
  text,
  delay = 0,
  exitAt,
  color = theme.color.gold,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = exitAt ?? durationInFrames - theme.t.exit;
  const s = spring({ frame: frame - delay, fps, config: theme.spring.settle, durationInFrames: theme.t.enter });
  const rule = interpolate(frame, [delay + 6, delay + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.out,
  });
  const exit = interpolate(frame, [out, out + theme.t.exit], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.in,
  });
  return (
    <div style={{ opacity: (1 - exit) * s, transform: `translateY(${(1 - s) * 18}px)`, textAlign: "center" }}>
      <div
        style={{
          fontFamily: theme.font.ui,
          fontSize: 40,
          fontWeight: 600,
          letterSpacing: 12,
          textTransform: "uppercase",
          color,
          textShadow: "0 3px 14px rgba(0,0,0,0.95), 0 0 34px rgba(0,0,0,0.8)",
        }}
      >
        {text}
      </div>
      <div
        style={{
          height: 3,
          width: 170,
          margin: "16px auto 0",
          background: color,
          transform: `scaleX(${rule})`,
          transformOrigin: "50% 50%",
          borderRadius: 2,
        }}
      />
    </div>
  );
};
