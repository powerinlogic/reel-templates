import React from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { resolveUrl } from "./Media";
import type { Asset } from "../spec";

export const MOSAIC_W = 980;
export const MOSAIC_H = 770;
const G = 18;

type Rect = { x: number; y: number; w: number; h: number };

/** Adapts to 1–4 assets so a thin vendor still gets a composed frame. */
const layout = (n: number): Rect[] => {
  const halfW = (MOSAIC_W - G) / 2;
  const halfH = (MOSAIC_H - G) / 2;
  if (n >= 4)
    return [
      { x: 0, y: 0, w: halfW, h: halfH },
      { x: halfW + G, y: 0, w: halfW, h: halfH },
      { x: 0, y: halfH + G, w: halfW, h: halfH },
      { x: halfW + G, y: halfH + G, w: halfW, h: halfH },
    ];
  if (n === 3) {
    const topH = MOSAIC_H * 0.56;
    return [
      { x: 0, y: 0, w: MOSAIC_W, h: topH },
      { x: 0, y: topH + G, w: halfW, h: MOSAIC_H - topH - G },
      { x: halfW + G, y: topH + G, w: halfW, h: MOSAIC_H - topH - G },
    ];
  }
  if (n === 2)
    return [
      { x: 0, y: 0, w: halfW, h: MOSAIC_H },
      { x: halfW + G, y: 0, w: halfW, h: MOSAIC_H },
    ];
  return [{ x: 0, y: 0, w: MOSAIC_W, h: MOSAIC_H }];
};

/**
 * Tiles enter staggered (5f apart) and each drifts on its own sine clock, so the
 * grid never sits still and never pulses in unison.
 */
export const Mosaic: React.FC<{
  assets: Asset[];
  delay?: number;
  exitAt?: number;
  /** Casual mode: drop the gold frame and the heavy drop shadow. */
  quiet?: boolean;
}> = ({ assets, delay = 0, exitAt, quiet = false }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const list = assets.slice(0, 4);
  const rects = layout(list.length);
  const out = exitAt ?? durationInFrames - theme.t.exit;

  const exit = interpolate(frame, [out, out + theme.t.exit], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.in,
  });

  return (
    <div
      style={{
        position: "relative",
        width: MOSAIC_W,
        height: MOSAIC_H,
        opacity: 1 - exit,
        transform: `translateY(${exit * -30}px)`,
      }}
    >
      {list.map((a, i) => {
        const r = rects[i];
        const s = spring({
          frame: frame - delay - i * 5,
          fps,
          config: theme.spring.pop,
          durationInFrames: theme.t.enter + 8,
        });
        const drift = 1.04 + Math.sin((frame + i * 37) / 110) * 0.02;
        const nudge = Math.sin((frame + i * 53) / 95) * 4;
        return (
          <div
            key={`${a.url}-${i}`}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              borderRadius: quiet ? 14 : 22,
              overflow: "hidden",
              background: theme.color.plumDeep,
              boxShadow: quiet ? "0 10px 26px rgba(0,0,0,0.35)" : "0 22px 54px rgba(0,0,0,0.55)",
              border: quiet ? "none" : "3px solid rgba(232,180,74,0.34)",
              opacity: s,
              transform: `translateY(${(1 - s) * 46 + nudge}px) scale(${0.9 + s * 0.1})`,
            }}
          >
            <Img
              src={resolveUrl(a.url)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transform: `scale(${drift})`,
                filter: quiet ? "saturate(1.04)" : "saturate(1.12) contrast(1.05)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
