import React from "react";
import { AbsoluteFill, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Grade, Grain, Vignette } from "./Layers";
import type { Asset } from "../spec";

/**
 * Assets arrive as remote URLs (S3), not staticFile paths — that is the whole
 * difference between a fixed project and a renderer a Django app drives.
 * Remotion loads http(s) sources natively, so nothing needs bundling.
 */
export const srcOf = (a: Asset | undefined, fallback?: string) => a?.url ?? fallback ?? "";

/**
 * In production every asset url is an absolute S3 url. For local development
 * and the bundled example, a bare path is resolved against public/ instead, so
 * the same spec shape works in both places.
 */
export const resolveUrl = (u: string) =>
  /^(https?:|data:|blob:)/.test(u) ? u : staticFile(u);

/**
 * There is no logo checked into this repo — the spec carries one as a URL, the
 * same way every other asset arrives. When it is absent the plate falls back to
 * the brand name set in type, which is a better failure than a broken image.
 */
export const logoSrc = (override?: string) => (override ? resolveUrl(override) : null);

type Dir = "in" | "out" | "left" | "right";

/** Full-bleed footage with a slow push. No shot is ever static. */
export const Shot: React.FC<{ asset: Asset; dir?: Dir; zoom?: number; warmth?: number }> = ({
  asset,
  dir = "in",
  zoom = 0.1,
  warmth = 1,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const p = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.drift,
  });

  const scale = dir === "out" ? 1 + zoom - zoom * p : 1 + zoom * p;
  const x = dir === "left" ? -zoom * 240 * p : dir === "right" ? zoom * 240 * p : 0;
  const y = dir === "in" || dir === "out" ? -zoom * 60 * p : 0;

  const startFrom =
    asset.type === "video" && typeof asset.in === "number" ? Math.round(asset.in * fps) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.color.plumDeep, overflow: "hidden" }}>
      <AbsoluteFill
        style={{ transform: `scale(${scale}) translate(${x}px, ${y}px)`, transformOrigin: "50% 45%" }}
      >
        {asset.type === "video" ? (
          <OffthreadVideo
            src={resolveUrl(asset.url)}
            startFrom={startFrom}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(1.3) contrast(1.09) brightness(1.06)",
            }}
          />
        ) : (
          <Img
            src={resolveUrl(asset.url)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(1.2) contrast(1.06)",
            }}
          />
        )}
      </AbsoluteFill>
      <Grade warmth={warmth} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

/** Hero image blurred way out, used as an ambient colour wash behind cards. */
export const AmbientWash: React.FC<{ asset?: Asset }> = ({ asset }) => {
  const frame = useCurrentFrame();
  if (!asset) return null;
  const k = 1.24 + Math.sin(frame / 150) * 0.04;
  return (
    <AbsoluteFill style={{ opacity: 0.32, pointerEvents: "none" }}>
      <Img
        src={resolveUrl(asset.url)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(70px) saturate(1.5)",
          transform: `scale(${k})`,
        }}
      />
    </AbsoluteFill>
  );
};
