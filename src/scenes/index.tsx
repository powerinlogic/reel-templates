import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BgMesh, Grain, Vignette, useBreath } from "../components/Layers";
import { WordReveal, Kicker } from "../components/Type";
import { Mosaic } from "../components/Mosaic";
import { AmbientWash, Shot, logoSrc, resolveUrl } from "../components/Media";
import { theme } from "../theme";
import type { Asset, Scene } from "../spec";

/* Instagram Reels chrome covers roughly the bottom 480px, the top 200px and the
   right ~150px of a 1080x1920 frame. Everything that matters lives in the band
   between. This is not a style preference — below y=1440 gets covered on a real
   phone by the caption and the action rail. */
export const SAFE_TOP = 240;
export const SAFE_BOTTOM = 480;

/** Shrinks type to fit the 980px column rather than letting it wrap badly. */
const fitSize = (text: string, base: number, min = 46) => {
  const longest = text.split(" ").reduce((a, w) => Math.max(a, w.length), 0);
  const byWord = 980 / (longest * 0.62);
  const byTotal = (980 * 2.1) / (text.length * 0.6);
  return Math.max(min, Math.min(base, byWord, byTotal));
};

/**
 * The wordmark sits on a cream plate because most brand logos carry dark ink
 * that vanishes on a plum background. Falls back to type when no logo url is
 * supplied.
 */
const Plate: React.FC<{
  logo?: string;
  brandName?: string;
  width: number;
  style?: React.CSSProperties;
}> = ({ logo, brandName = "CEDAR ROSE", width, style }) => {
  const src = logoSrc(logo);
  return (
    <div
      style={{
        background: theme.color.cream,
        borderRadius: 28,
        padding: src ? "26px 32px" : "22px 40px",
        border: "2px solid rgba(232,180,74,0.45)",
        boxShadow: "0 26px 68px rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {src ? (
        <Img src={src} style={{ width, display: "block" }} />
      ) : (
        <div
          style={{
            fontFamily: theme.font.display,
            fontSize: Math.round(width * 0.17),
            letterSpacing: 2,
            lineHeight: 1.05,
            color: theme.color.orange,
            textAlign: "center",
            width,
          }}
        >
          {brandName}
        </div>
      )}
    </div>
  );
};

const useExit = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const out = durationInFrames - theme.t.exit;
  return {
    out,
    exit: interpolate(frame, [out, out + theme.t.exit], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: theme.ease.in,
    }),
  };
};

/* ------------------------------------------------------------------ */

export const TitleCard: React.FC<{
  title: string;
  subtitle?: string;
  logo?: string;
  casual?: boolean;
}> = ({ title, subtitle, logo, casual = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { out, exit } = useExit();
  const breath = useBreath(120, 4);

  const drop = spring({ frame, fps, config: { damping: 11, mass: 0.9, stiffness: 110 }, durationInFrames: 44 });
  const y = interpolate(drop, [0, 1], [-980, 0]);
  const spin = interpolate(drop, [0, 1], [-7, 0]);

  const impact = spring({ frame: frame - 24, fps, config: { damping: 9, mass: 0.5, stiffness: 200 }, durationInFrames: 24 });
  const punch = Math.sin(impact * Math.PI) * (frame >= 24 ? 1 : 0);

  const sub = spring({ frame: frame - 58, fps, config: theme.spring.soft, durationInFrames: theme.t.enter });

  return (
    <AbsoluteFill>
      {casual ? <AbsoluteFill style={{ backgroundColor: "#100d13" }} /> : <BgMesh />}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: `${SAFE_TOP}px 60px ${SAFE_BOTTOM}px`,
          transform: `translateY(${breath}px)`,
          opacity: 1 - exit,
        }}
      >
        {/* The logo plate is a poster device. A casual post opens like a thought,
            not like a flyer, so it gets type only. */}
        {casual ? null : (
          <Plate
            logo={logo}
            width={420}
            style={{
              transform: `translateY(${y}px) rotate(${spin}deg) scale(${1 + punch * 0.08}, ${1 - punch * 0.09})`,
              transformOrigin: "50% 100%",
            }}
          />
        )}

        <div style={{ marginTop: casual ? 0 : 56, textAlign: "center" }}>
          {casual ? (
            <div
              style={{
                fontFamily: theme.font.ui,
                fontWeight: 300,
                fontSize: Math.min(64, fitSize(title, 64)),
                lineHeight: 1.25,
                letterSpacing: 0.3,
                color: "rgba(252,250,244,0.95)",
                maxWidth: 860,
              }}
            >
              {title}
            </div>
          ) : (
            <WordReveal text={title} delay={34} exitAt={out} size={fitSize(title, 120)} color={theme.color.cream} />
          )}
        </div>

        {subtitle ? (
          <div
            style={{
              marginTop: 34,
              opacity: sub,
              transform: `translateY(${(1 - sub) * 20}px)`,
              fontFamily: theme.font.ui,
              fontWeight: casual ? 300 : 500,
              fontSize: casual ? 34 : 42,
              letterSpacing: casual ? 1 : 6,
              textTransform: casual ? "none" : "uppercase",
              color: casual ? "rgba(246,244,210,0.6)" : theme.color.gold,
              textAlign: "center",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </AbsoluteFill>
      <Vignette strength={casual ? 0.3 : 0.55} />
      <Grain opacity={casual ? 0.07 : 0.11} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

export const MosaicBeat: React.FC<{
  kicker?: string;
  name: string;
  line?: string;
  assets: Asset[];
  casual?: boolean;
}> = ({ kicker, name, line, assets, casual = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { out, exit } = useExit();

  const nameS = spring({ frame: frame - 26, fps, config: theme.spring.pop, durationInFrames: theme.t.enter + 6 });
  const lineS = spring({ frame: frame - 40, fps, config: theme.spring.soft, durationInFrames: theme.t.enter });

  return (
    <AbsoluteFill>
      {casual ? <AbsoluteFill style={{ backgroundColor: "#100d13" }} /> : <BgMesh />}
      <AmbientWash asset={assets[0]} />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: `${SAFE_TOP}px 50px ${SAFE_BOTTOM}px`,
        }}
      >
        {kicker ? (
          casual ? (
            // A small lowercase label instead of the gold-ruled kicker — the rule
            // is a poster device and reads as an advert in an everyday post.
            <div
              style={{
                fontFamily: theme.font.ui,
                fontWeight: 300,
                fontSize: 34,
                letterSpacing: 1,
                color: "rgba(246,244,210,0.62)",
                textAlign: "center",
              }}
            >
              {kicker}
            </div>
          ) : (
            <Kicker text={kicker} delay={4} exitAt={out} />
          )
        ) : null}

        <div style={{ marginTop: kicker ? (casual ? 28 : 40) : 0 }}>
          <Mosaic assets={assets} delay={10} exitAt={out} quiet={casual} />
        </div>

        <div
          style={{
            marginTop: 40,
            width: 980,
            textAlign: "center",
            opacity: (1 - exit) * nameS,
            transform: `translateY(${(1 - nameS) * 30 + exit * -24}px)`,
            fontFamily: casual ? theme.font.ui : theme.font.display,
            fontWeight: casual ? 400 : 400,
            fontSize: casual ? Math.min(58, fitSize(name, 58)) : fitSize(name, 88),
            letterSpacing: casual ? 0.5 : 0,
            lineHeight: casual ? 1.2 : 1.05,
            color: theme.color.cream,
            textShadow: casual ? "0 2px 14px rgba(0,0,0,0.5)" : "0 6px 26px rgba(0,0,0,0.7)",
          }}
        >
          {name}
        </div>

        {line ? (
          <div
            style={{
              marginTop: 18,
              width: 940,
              textAlign: "center",
              opacity: (1 - exit) * lineS * 0.94,
              transform: `translateY(${(1 - lineS) * 18}px)`,
              fontFamily: theme.font.ui,
              fontWeight: 300,
              fontSize: casual ? 38 : 36,
              letterSpacing: casual ? 0.2 : 1.4,
              lineHeight: 1.35,
              color: casual ? "rgba(246,244,210,0.86)" : theme.color.cream,
              textShadow: "0 3px 16px rgba(0,0,0,0.8)",
            }}
          >
            {line}
          </div>
        ) : null}
      </AbsoluteFill>

      <Vignette strength={casual ? 0.34 : 0.52} />
      <Grain opacity={casual ? 0.07 : 0.1} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

export const ShotBeat: React.FC<{
  asset: Asset;
  kicker?: string;
  headline: string;
  sub?: string;
  dir?: "in" | "out" | "left" | "right";
}> = ({ asset, kicker, headline, sub, dir = "in" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { out, exit } = useExit();

  const subS = spring({ frame: frame - 44, fps, config: theme.spring.soft, durationInFrames: theme.t.enter });

  return (
    <AbsoluteFill>
      <Shot asset={asset} dir={dir} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          padding: `${SAFE_TOP}px 120px ${SAFE_BOTTOM}px`,
        }}
      >
        <div style={{ maxWidth: 840, textAlign: "center" }}>
          {kicker ? <Kicker text={kicker} delay={4} exitAt={out} /> : null}
          <div style={{ marginTop: kicker ? 26 : 0 }}>
            <WordReveal text={headline} delay={16} exitAt={out} size={fitSize(headline, 116)} />
          </div>
          {sub ? (
            <div
              style={{
                marginTop: 22,
                opacity: (1 - exit) * subS,
                transform: `translateY(${(1 - subS) * 18}px)`,
                fontFamily: theme.font.ui,
                fontWeight: 300,
                fontSize: 38,
                letterSpacing: 2,
                color: theme.color.cream,
                textShadow: "0 3px 18px rgba(0,0,0,0.85)",
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


/* ------------------------------------------------------------------ */

/**
 * The casual workhorse. One photo, full bleed, a slow push, and at most one
 * quiet line of text sitting bottom-left inside the safe area.
 *
 * Deliberately missing: the logo plate, the gold rule, the display face, the
 * card chrome. Those are what make the promo templates read as an advert, and
 * an advert is the wrong register for "here is what the vines look like today".
 */
export const PhotoBeat: React.FC<{ asset: Asset; caption?: string }> = ({ asset, caption }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { exit } = useExit();

  // Slow, single-direction push on stills. Footage already moves on its own,
  // so it gets none — a synthetic zoom on top of real camera motion is the
  // thing that makes phone clips look like they went through a slideshow app.
  const isVideo = asset.type === "video";
  const p = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.drift,
  });
  const scale = isVideo ? 1 : 1.04 + 0.05 * p;

  const cap = spring({ frame: frame - 14, fps, config: theme.spring.soft, durationInFrames: 24 });
  const startFrom = isVideo && typeof asset.in === "number" ? Math.round(asset.in * fps) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0b0f", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "50% 50%" }}>
        {isVideo ? (
          <OffthreadVideo
            src={resolveUrl(asset.url)}
            startFrom={startFrom}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.04)" }}
          />
        ) : (
          <Img
            src={resolveUrl(asset.url)}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.04)" }}
          />
        )}
      </AbsoluteFill>

      {caption ? (
        <>
          {/* The caption sits well above the Reels caption rail, so the scrim has
              to reach that high too — a bottom-anchored gradient left the words
              floating on bare photo. */}
          <AbsoluteFill style={{ pointerEvents: "none" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "66%",
                background:
                  "linear-gradient(0deg, rgba(8,6,10,0.80) 0%, rgba(8,6,10,0.62) 34%, rgba(8,6,10,0.28) 62%, rgba(8,6,10,0) 100%)",
              }}
            />
          </AbsoluteFill>
          <div
            style={{
              position: "absolute",
              left: 72,
              right: 150,
              bottom: SAFE_BOTTOM + 250,
              opacity: (1 - exit) * cap,
              transform: `translateY(${(1 - cap) * 14}px)`,
              fontFamily: theme.font.ui,
              fontWeight: 400,
              fontSize: 58,
              lineHeight: 1.28,
              letterSpacing: 0.2,
              color: "rgba(255,254,250,0.98)",
              textShadow: "0 2px 10px rgba(0,0,0,0.65), 0 0 40px rgba(0,0,0,0.45)",
            }}
          >
            {caption}
          </div>
        </>
      ) : null}

      <Vignette strength={0.32} />
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

export const ListCard: React.FC<{ kicker?: string; entries: { name: string; what?: string }[] }> = ({
  kicker,
  entries,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { out, exit } = useExit();
  const breath = useBreath(140, 4);

  return (
    <AbsoluteFill>
      <BgMesh />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: `${SAFE_TOP}px 60px ${SAFE_BOTTOM}px`,
          transform: `translateY(${breath}px)`,
          opacity: 1 - exit,
        }}
      >
        {kicker ? <Kicker text={kicker} delay={2} exitAt={out} /> : null}

        <div style={{ marginTop: 70, width: 960 }}>
          {entries.map((e, i) => {
            const s = spring({ frame: frame - 18 - i * 10, fps, config: theme.spring.pop, durationInFrames: theme.t.enter + 6 });
            const rule = interpolate(frame, [24 + i * 10, 48 + i * 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: theme.ease.out,
            });
            return (
              <div
                key={e.name}
                style={{ marginBottom: 56, opacity: s, transform: `translateY(${(1 - s) * 34}px)`, textAlign: "center" }}
              >
                <div
                  style={{
                    fontFamily: theme.font.display,
                    fontSize: fitSize(e.name, 72, 42),
                    lineHeight: 1.06,
                    color: theme.color.cream,
                    textShadow: "0 5px 22px rgba(0,0,0,0.7)",
                  }}
                >
                  {e.name}
                </div>
                <div
                  style={{
                    height: 3,
                    width: 240,
                    margin: "18px auto 16px",
                    background: theme.color.gold,
                    opacity: 0.8,
                    borderRadius: 2,
                    transform: `scaleX(${rule})`,
                  }}
                />
                {e.what ? (
                  <div
                    style={{
                      fontFamily: theme.font.ui,
                      fontWeight: 300,
                      fontSize: 34,
                      letterSpacing: 1.6,
                      color: "rgba(246,244,210,0.9)",
                      lineHeight: 1.3,
                    }}
                  >
                    {e.what}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      <Vignette strength={0.55} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

export const StatCard: React.FC<{ label?: string; value: string; note?: string }> = ({
  label,
  value,
  note,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { out, exit } = useExit();
  const breath = useBreath(126, 5);

  const v = spring({ frame: frame - 12, fps, config: theme.spring.pop, durationInFrames: theme.t.enter + 8 });
  const n = spring({ frame: frame - 34, fps, config: theme.spring.soft, durationInFrames: theme.t.enter });

  return (
    <AbsoluteFill>
      <BgMesh />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: `${SAFE_TOP}px 70px ${SAFE_BOTTOM}px`,
          transform: `translateY(${breath}px)`,
          opacity: 1 - exit,
        }}
      >
        {label ? <Kicker text={label} delay={2} exitAt={out} /> : null}
        <div
          style={{
            marginTop: 40,
            opacity: v,
            transform: `translateY(${(1 - v) * 40}px) scale(${0.82 + v * 0.18})`,
            fontFamily: theme.font.display,
            fontSize: 260,
            lineHeight: 1,
            color: theme.color.cream,
            textShadow: "0 10px 40px rgba(0,0,0,0.65)",
          }}
        >
          {value}
        </div>
        {note ? (
          <div
            style={{
              marginTop: 30,
              width: 900,
              textAlign: "center",
              opacity: n,
              transform: `translateY(${(1 - n) * 20}px)`,
              fontFamily: theme.font.ui,
              fontWeight: 400,
              fontSize: 40,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: theme.color.gold,
              lineHeight: 1.3,
            }}
          >
            {note}
          </div>
        ) : null}
      </AbsoluteFill>
      <Vignette strength={0.55} />
      <Grain opacity={0.11} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

export const EndCard: React.FC<{
  line?: string;
  cta?: string;
  code?: string;
  url?: string;
  logo?: string;
  casual?: boolean;
}> = ({ line, cta, code, url, logo, casual = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breath = useBreath(130, 4);

  const logoS = spring({ frame, fps, config: theme.spring.settle, durationInFrames: 26 });
  const date = interpolate(frame, [14, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: theme.ease.out,
  });
  const codeS = spring({ frame: frame - 48, fps, config: theme.spring.settle, durationInFrames: 20 });
  const pulse = 1 + Math.sin(frame / 15) * 0.018;

  /**
   * Casual reels don't ask. A sign-off is the name of the place and where it is,
   * set small — the same way you'd end a note to someone who already follows you.
   * No logo plate, no price, no pulsing button, no promo code.
   */
  if (casual) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#100d13" }}>
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: `${SAFE_TOP}px 70px ${SAFE_BOTTOM}px`,
            transform: `translateY(${breath}px)`,
          }}
        >
          <div
            style={{
              opacity: date,
              fontFamily: theme.font.ui,
              fontWeight: 400,
              fontSize: 52,
              letterSpacing: 3,
              color: "rgba(252,250,244,0.92)",
              textAlign: "center",
            }}
          >
            Cedar Rose Vineyards
          </div>
          <div
            style={{
              marginTop: 16,
              opacity: codeS * 0.8,
              transform: `translateY(${(1 - codeS) * 12}px)`,
              fontFamily: theme.font.ui,
              fontWeight: 300,
              fontSize: 32,
              letterSpacing: 2,
              color: "rgba(246,244,210,0.55)",
              textAlign: "center",
            }}
          >
            {line || "Millville, New Jersey"}
          </div>
        </AbsoluteFill>
        <Vignette strength={0.34} />
        <Grain opacity={0.07} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <BgMesh />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: `${SAFE_TOP}px 70px ${SAFE_BOTTOM}px`,
          transform: `translateY(${breath}px)`,
        }}
      >
        <Plate
          logo={logo}
          width={400}
          style={{ opacity: logoS, transform: `translateY(${(1 - logoS) * 40}px) scale(${0.9 + logoS * 0.1})` }}
        />

        {line ? (
          <div
            style={{
              marginTop: 26,
              opacity: date,
              width: 900,
              fontFamily: theme.font.ui,
              fontWeight: 500,
              fontSize: 42,
              letterSpacing: 3,
              color: theme.color.gold,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {line}
          </div>
        ) : null}

        <div style={{ marginTop: 48, transform: `scale(${pulse})` }}>
          <WordReveal text={cta || "GET TICKETS"} delay={40} exitAt={9999} size={fitSize(cta || "GET TICKETS", 78)} color={theme.color.cream} />
        </div>

        {code ? (
          <div
            style={{
              marginTop: 22,
              opacity: codeS,
              transform: `translateY(${(1 - codeS) * 18}px)`,
              fontFamily: theme.font.ui,
              fontWeight: 500,
              fontSize: 34,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: theme.color.pumpkin,
              textAlign: "center",
            }}
          >
            {code}
          </div>
        ) : null}

        {url ? (
          <div
            style={{
              position: "absolute",
              bottom: SAFE_BOTTOM + 24,
              opacity: codeS,
              fontFamily: theme.font.ui,
              fontWeight: 300,
              fontSize: 28,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(246,244,210,0.6)",
            }}
          >
            {url}
          </div>
        ) : null}
      </AbsoluteFill>
      <Vignette strength={0.6} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

/** Dispatch: a scene type either has a template here or it was dropped upstream. */
export const renderScene = (
  scene: Scene,
  assets: Record<string, Asset>,
  logo: string | undefined,
  index: number,
  style: "promo" | "casual" = "promo"
): React.ReactNode => {
  const dirs = ["in", "left", "out", "right"] as const;
  const casual = style === "casual";
  switch (scene.type) {
    case "title_card":
      return <TitleCard title={scene.title} subtitle={scene.subtitle} logo={logo} casual={casual} />;
    case "photo_beat":
      return <PhotoBeat asset={assets[scene.asset]} caption={scene.caption} />;
    case "mosaic_beat":
      return (
        <MosaicBeat
          kicker={scene.kicker}
          name={scene.name}
          line={scene.line}
          casual={casual}
          assets={scene.assets.map((id) => assets[id]).filter(Boolean)}
        />
      );
    case "shot_beat":
      return (
        <ShotBeat
          asset={assets[scene.shot]}
          kicker={scene.kicker}
          headline={scene.headline}
          sub={scene.sub}
          dir={dirs[index % dirs.length]}
        />
      );
    case "list_card":
      return <ListCard kicker={scene.kicker} entries={scene.entries} />;
    case "stat_card":
      return <StatCard label={scene.label} value={scene.value} note={scene.note} />;
    case "end_card":
      return (
        <EndCard line={scene.line} cta={scene.cta} code={scene.code} url={scene.url} logo={logo} casual={casual} />
      );
    default:
      return null;
  }
};
