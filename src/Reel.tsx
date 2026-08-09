import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Fonts } from "./components/Fonts";
import { theme } from "./theme";
import { normalizeSpec, TRANSITION } from "./spec";
import { renderScene } from "./scenes";

const soft = springTiming({ config: { damping: 200, mass: 0.6 }, durationInFrames: TRANSITION });
const eased = linearTiming({ durationInFrames: TRANSITION, easing: theme.ease.inOut });
const gentle = linearTiming({ durationInFrames: 20, easing: theme.ease.inOut });

/* Assigned by index, never by the model. The rhythm varies without anyone
   having to decide each one, and it can't come back wrong. */
type Presentation = React.ComponentProps<typeof TransitionSeries.Transition>["presentation"];

const presentations: Presentation[] = [
  wipe({ direction: "from-bottom" }) as Presentation,
  slide({ direction: "from-right" }) as Presentation,
  fade() as Presentation,
  wipe({ direction: "from-left" }) as Presentation,
  slide({ direction: "from-bottom" }) as Presentation,
  fade() as Presentation,
  slide({ direction: "from-right" }) as Presentation,
];

export const Reel: React.FC<{ spec?: unknown }> = ({ spec }) => {
  const n = normalizeSpec(spec);

  if (n.warnings.length) {
    // Surfaced in the render log so reel_generator can store them on the draft.
    // eslint-disable-next-line no-console
    console.log("[spec] " + n.warnings.join(" | "));
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.color.plumDeep }}>
      <Fonts />
      <TransitionSeries>
        {n.scenes.map((s, i) => (
          <React.Fragment key={`${s.scene.type}-${i}`}>
            {i > 0 ? (
              <TransitionSeries.Transition
                presentation={
                  // Casual reels only ever crossfade. Wipes and slides are
                  // broadcast-package moves and they read as an advert.
                  n.style === "casual"
                    ? (fade() as Presentation)
                    : presentations[(i - 1) % presentations.length]
                }
                timing={n.style === "casual" ? gentle : i % 3 === 2 ? eased : soft}
              />
            ) : null}
            <TransitionSeries.Sequence durationInFrames={s.len}>
              {renderScene(s.scene, n.assets, n.logo, i, n.style)}
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
