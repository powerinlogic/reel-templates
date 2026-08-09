# reel-templates

Remotion template pack for Cedar Rose / ContentEngine vertical reels (1080x1920, 30fps).

This repo exists so automated jobs can fetch a known-good copy of the renderer
without depending on a Drive folder that may be stale. It is intentionally
public and intentionally small: everything needed to render, nothing else.

## Use

```bash
mkdir reel && cd reel
for f in package.json tsconfig.json remotion.config.ts example-casual.json; do
  curl -fsSLO "https://raw.githubusercontent.com/powerinlogic/reel-templates/main/$f"
done
mkdir -p src/components src/scenes public
for f in src/index.ts src/Root.tsx src/Reel.tsx src/spec.ts src/theme.ts src/types.d.ts \
         src/components/Fonts.tsx src/components/Layers.tsx src/components/Media.tsx \
         src/components/Mosaic.tsx src/components/Type.tsx src/scenes/index.tsx; do
  curl -fsSL "https://raw.githubusercontent.com/powerinlogic/reel-templates/main/$f" -o "$f"
done
curl -fsSL "https://raw.githubusercontent.com/powerinlogic/reel-templates/main/public/grain.png" -o public/grain.png

npm install
npx remotion render Reel out/reel.mp4 --props=spec.json \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

`--props` takes a REEL SPEC v2 JSON object. See `example-casual.json`.

## Spec

`src/spec.ts` is the contract. The short version:

- `style`: `"promo"` (event poster: display type, logo plate, gold, a CTA) or
  `"casual"` (everyday: photo-forward, quiet type, no logo, no ask).
- `scenes[]`: a typed union — `title_card`, `photo_beat`, `shot_beat`,
  `mosaic_beat`, `list_card`, `stat_card`, `end_card`.
- `assets`: `{ id: { type: "image"|"video", url, in?, out? } }`. Scenes reference
  assets by id. URLs must be publicly reachable — local paths will not render.

Durations are derived from the scene type and its content, and transitions are
assigned by index. Neither is settable from the spec. Unknown scene types are
dropped and over-long text is truncated rather than overflowing, so a malformed
spec renders a shorter video instead of a broken one.

Fonts (Ultra, Oswald) are bundled via `@fontsource` and loaded from disk, so
rendering needs no network access for type.
