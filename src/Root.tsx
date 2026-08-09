import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { normalizeSpec, FPS } from "./spec";

/**
 * A tiny inline default so the project renders with no props at all. It used to
 * import ../example-spec.json, which meant anyone copying just `src/` got a
 * build error — a trap the first scheduled run walked straight into.
 */
const FALLBACK = {
  spec: {
    version: 2,
    style: "casual",
    scenes: [
      { type: "title_card", title: "No spec supplied", subtitle: "Pass one with --props" },
      { type: "end_card", line: "Millville, New Jersey" },
    ],
    assets: {},
  },
};

/**
 * One composition. Duration is computed from the spec at render time, so the
 * Python side never has to know or send a frame count.
 */
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel as React.FC<Record<string, unknown>>}
    defaultProps={FALLBACK as unknown as Record<string, unknown>}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={600}
    calculateMetadata={({ props }) => ({
      durationInFrames: normalizeSpec((props as { spec?: unknown }).spec).total,
    })}
  />
);
