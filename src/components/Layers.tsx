import React from "react";
import { AbsoluteFill, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";

/**
 * Layer 5a — film grain.
 *
 * This started as feTurbulence re-seeded every couple of frames. Measured, that
 * nearly doubled render time — 23s vs 12s for the same 30 frames — because every
 * seed change forces Chromium to rasterise a fresh 1080x1920 noise field. Fixing
 * the seed and translating the layer only got it to 18s; the filter itself was
 * the cost, not the reseeding.
 *
 * So the noise is now a pre-baked 256px tile and the motion is background-position,
 * which the compositor handles for free. Same look, no per-frame filter work.
 */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.16 }) => {
  const frame = useCurrentFrame();
  // Coprime steps so the drift never settles into a visible loop.
  const x = (frame * 7) % 256;
  const y = (frame * 13) % 256;
  return (
    <AbsoluteFill
      style={{
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        backgroundImage: `url(${staticFile("grain.png")})`,
        backgroundRepeat: "repeat",
        backgroundPosition: `${x}px ${y}px`,
      }}
    />
  );
};

/** Layer 5b — vignette, pulls the eye to centre and hides phone-footage edges. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.5 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 40%, rgba(12,8,16,${strength}) 100%)`,
    }}
  />
);

/** Layer 4 — colour grade. Warm plum crush so mixed phone footage reads as one piece. */
export const Grade: React.FC<{ warmth?: number }> = ({ warmth = 1 }) => (
  <>
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "soft-light",
        opacity: 0.22 * warmth,
        background: `linear-gradient(160deg, ${theme.color.gold} 0%, ${theme.color.orange} 45%, ${theme.color.plum} 100%)`,
      }}
    />
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "multiply",
        opacity: 0.14 * warmth,
        background: `linear-gradient(180deg, ${theme.color.plumDeep} 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 62%, ${theme.color.plumDeep} 100%)`,
      }}
    />
  </>
);

/** Layer 1 — living background mesh for card scenes (never a flat fill). */
export const BgMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const a = Math.sin(frame / 64) * 5;
  const b = Math.cos(frame / 47) * 6;
  return (
    <AbsoluteFill style={{ background: theme.color.plumDeep }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 42% at ${50 + a}% ${26 + b}%, rgba(199,91,18,0.55) 0%, rgba(199,91,18,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(52% 38% at ${28 - b}% ${76 - a}%, rgba(232,180,74,0.32) 0%, rgba(232,180,74,0) 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 50% at ${76 + b}% ${88 + a}%, rgba(43,31,51,0.9) 0%, rgba(43,31,51,0) 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** A scrim behind type so it stays readable over busy footage. */
export const Scrim: React.FC<{ from?: string; height?: string; bottom?: boolean }> = ({
  from = "rgba(12,8,16,0.78)",
  height = "50%",
  bottom = true,
}) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [bottom ? "bottom" : "top"]: 0,
        height,
        background: `linear-gradient(${bottom ? "0deg" : "180deg"}, ${from} 0%, rgba(12,8,16,0.35) 46%, rgba(12,8,16,0) 100%)`,
      }}
    />
  </AbsoluteFill>
);

/** Sin-wave breathing for anything idle on screen longer than ~2s. */
export const useBreath = (period = 90, amount = 1) => {
  const frame = useCurrentFrame();
  return Math.sin((frame / period) * Math.PI * 2) * amount;
};

/** Entrance helper: opacity + translateY + scale, never opacity alone. */
export const useEnter = (start: number, fps: number, dur = theme.t.enter) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.out,
  });
  return p;
};

export const rand = random;
