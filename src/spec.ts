/**
 * REEL SPEC v2 — the contract between reel_generator.py and this renderer.
 *
 * Design rules, mirroring the guarantees composer.sanitize_spec already gives:
 *
 *   • Claude picks a scene TYPE and fills its SLOTS. Nothing else.
 *   • Durations are DERIVED here from template + content. The model never sets them.
 *   • Transitions are ASSIGNED by index. The model never picks them.
 *   • Assets are ids into a map. Paths/URLs are injected by the expander in Python.
 *   • Unknown types are dropped, over-long text is truncated. Never throws.
 *
 * The point of the type union is that there is no spec the model can emit that
 * renders as garbage — it either matches a template or it is discarded.
 */

export type AssetRef = string; // id into Spec["assets"]

export type Asset =
  | { type: "image"; url: string }
  | { type: "video"; url: string; in?: number; out?: number }; // seconds, injected server-side

export type Scene =
  | { type: "title_card"; title: string; subtitle?: string }
  | { type: "photo_beat"; asset: AssetRef; caption?: string }
  | { type: "shot_beat"; shot: AssetRef; kicker?: string; headline: string; sub?: string }
  | { type: "mosaic_beat"; kicker?: string; name: string; line?: string; assets: AssetRef[] }
  | { type: "list_card"; kicker?: string; entries: { name: string; what?: string }[] }
  | { type: "stat_card"; label?: string; value: string; note?: string }
  | { type: "end_card"; line?: string; cta?: string; code?: string; url?: string };

export type Spec = {
  version: 2;
  /**
   * "promo" is the event poster look: display type, logo plate, gold rules, a
   * price and a CTA. "casual" is the everyday look — photo-forward, quiet type,
   * no logo, no ask. Choosing the wrong one is the single most visible mistake
   * this renderer can make, so it is a top-level field rather than a nuance.
   */
  style?: "promo" | "casual";
  brand?: string;
  title?: string;
  music_mood?: string;
  logo?: string; // url; falls back to the bundled brand logo
  scenes: Scene[];
  assets: Record<string, Asset>;
};

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

export const FPS = 30;
export const TRANSITION = 14;

// Measured against the rendered output, not guessed: cta wraps past 18 and code
// past 22 at the sizes these render at.
const CAP = { title: 34, subtitle: 46, kicker: 26, name: 30, line: 74, what: 54, headline: 26, cta: 18, code: 22, caption: 80 };

const clampText = (s: unknown, n: number) => {
  const t = String(s ?? "").trim().replace(/\s+/g, " ");
  return t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "…";
};

/** Derived, never model-chosen. Content length moves it; the model cannot. */
export const sceneDuration = (s: Scene): number => {
  switch (s.type) {
    case "title_card":
      return 108;
    case "photo_beat":
      return 96;
    case "shot_beat":
      return 96;
    case "mosaic_beat":
      return s.assets.length >= 3 ? 108 : 96;
    case "list_card":
      return Math.min(190, 66 + 22 * Math.max(1, s.entries.length));
    case "stat_card":
      return 90;
    case "end_card":
      return 132;
    default:
      return 96;
  }
};

/* ------------------------------------------------------------------ */
/* Normalisation — the port of sanitize_spec()                         */
/* ------------------------------------------------------------------ */

export type NormalScene = { scene: Scene; len: number };
export type NormalSpec = {
  scenes: NormalScene[];
  assets: Record<string, Asset>;
  style: "promo" | "casual";
  logo?: string;
  total: number;
  warnings: string[];
};

const MAX_SCENES = 14;

export const normalizeSpec = (raw: unknown): NormalSpec => {
  const warnings: string[] = [];
  const spec = (raw ?? {}) as Partial<Spec>;
  const assets: Record<string, Asset> = spec.assets ?? {};
  const out: NormalScene[] = [];

  const has = (id: unknown) => typeof id === "string" && !!assets[id];

  for (const s of (spec.scenes ?? []) as Scene[]) {
    if (out.length >= MAX_SCENES) {
      warnings.push(`dropped scenes past ${MAX_SCENES}`);
      break;
    }
    if (!s || typeof s !== "object") continue;

    switch (s.type) {
      case "title_card": {
        if (!s.title) { warnings.push("title_card without title"); break; }
        out.push({ scene: { ...s, title: clampText(s.title, CAP.title), subtitle: clampText(s.subtitle, CAP.subtitle) }, len: 0 });
        break;
      }
      case "shot_beat": {
        if (!has(s.shot)) { warnings.push(`shot_beat: unknown asset ${s.shot}`); break; }
        if (!s.headline) { warnings.push("shot_beat without headline"); break; }
        out.push({
          scene: { ...s, kicker: clampText(s.kicker, CAP.kicker), headline: clampText(s.headline, CAP.headline), sub: clampText(s.sub, CAP.line) },
          len: 0,
        });
        break;
      }
      case "mosaic_beat": {
        const imgs = (s.assets ?? []).filter(has).slice(0, 4);
        if (!imgs.length) { warnings.push(`mosaic_beat "${s.name}": no resolvable assets`); break; }
        if (!s.name) { warnings.push("mosaic_beat without name"); break; }
        out.push({
          scene: { ...s, assets: imgs, kicker: clampText(s.kicker, CAP.kicker), name: clampText(s.name, CAP.name), line: clampText(s.line, CAP.line) },
          len: 0,
        });
        break;
      }
      case "list_card": {
        const entries = (s.entries ?? [])
          .filter((e) => e && e.name)
          .slice(0, 4)
          .map((e) => ({ name: clampText(e.name, CAP.name), what: clampText(e.what, CAP.what) }));
        if (!entries.length) { warnings.push("list_card with no entries"); break; }
        out.push({ scene: { ...s, entries, kicker: clampText(s.kicker, CAP.kicker) }, len: 0 });
        break;
      }
      case "stat_card": {
        if (!s.value) { warnings.push("stat_card without value"); break; }
        out.push({ scene: { ...s, label: clampText(s.label, CAP.kicker), value: clampText(s.value, 12), note: clampText(s.note, CAP.line) }, len: 0 });
        break;
      }
      case "photo_beat": {
        if (!has(s.asset)) { warnings.push(`photo_beat: unknown asset ${s.asset}`); break; }
        out.push({ scene: { ...s, caption: clampText(s.caption, CAP.caption) }, len: 0 });
        break;
      }
      case "end_card": {
        out.push({ scene: { ...s, line: clampText(s.line, CAP.line), cta: clampText(s.cta, CAP.cta), code: clampText(s.code, CAP.code), url: clampText(s.url, 40) }, len: 0 });
        break;
      }
      default:
        warnings.push(`unknown scene type: ${(s as { type?: string }).type}`);
    }
  }

  const style: "promo" | "casual" = spec.style === "casual" ? "casual" : "promo";

  // A promo reel that doesn't ask for anything is a wasted render, so it always
  // lands on a CTA. A casual reel that asks for something stops being casual —
  // it gets a quiet sign-off with no cta and no code.
  if (!out.length || out[out.length - 1].scene.type !== "end_card") {
    out.push({
      scene: style === "casual" ? { type: "end_card" } : { type: "end_card", cta: "GET TICKETS" },
      len: 0,
    });
  }

  for (const n of out) n.len = sceneDuration(n.scene);

  const total = out.reduce((a, n) => a + n.len, 0) - TRANSITION * Math.max(0, out.length - 1);

  return { scenes: out, assets, style, logo: spec.logo, total: Math.max(FPS, total), warnings };
};
