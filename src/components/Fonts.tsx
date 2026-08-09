import React, { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

/**
 * Fonts come from npm (@fontsource), not from a CDN and not from checked-in
 * binaries. Two reasons: the repo stays text-only, and the renderer never makes
 * a network call for a typeface — which matters on Lambda, where a slow
 * fonts.gstatic.com would show up as a frame rendered in Times New Roman.
 *
 * The .woff2 files ship inside the packages; webpack fingerprints and bundles
 * them into the site, so they are baked into the deployed serve URL.
 */
import ultra400 from "@fontsource/ultra/files/ultra-latin-400-normal.woff2";
import oswald300 from "@fontsource/oswald/files/oswald-latin-300-normal.woff2";
import oswald400 from "@fontsource/oswald/files/oswald-latin-400-normal.woff2";
import oswald500 from "@fontsource/oswald/files/oswald-latin-500-normal.woff2";
import oswald600 from "@fontsource/oswald/files/oswald-latin-600-normal.woff2";

const face = (family: string, weight: number, url: string) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url('${url}') format('woff2');}`;

const css = [
  face("Ultra", 400, ultra400),
  face("Oswald", 300, oswald300),
  face("Oswald", 400, oswald400),
  face("Oswald", 500, oswald500),
  face("Oswald", 600, oswald600),
].join("\n");

export const Fonts: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = css;
    document.head.appendChild(el);
    // Block the first frame until the faces are actually resolved, otherwise
    // frame 0 renders in a fallback and the reel opens with a flash of Times.
    Promise.all([
      document.fonts.load("400 100px Ultra"),
      document.fonts.load("300 100px Oswald"),
      document.fonts.load("400 100px Oswald"),
      document.fonts.load("500 100px Oswald"),
      document.fonts.load("600 100px Oswald"),
    ])
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [handle]);
  return null;
};
