import { Easing } from "remotion";

export const theme = {
  color: {
    cream: "#F6F4D2",
    creamDim: "rgba(246,244,210,0.72)",
    ink: "#1A1A1A",
    orange: "#C75B12",
    pumpkin: "#E87F1E",
    gold: "#E8B44A",
    plum: "#2B1F33",
    plumDeep: "#1B1322",
  },
  font: {
    display: "'Ultra', Georgia, serif",
    ui: "'Oswald', 'Helvetica Neue', Arial, sans-serif",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),      // decelerate, for entrances
    inOut: Easing.bezier(0.65, 0, 0.35, 1),   // for moves
    in: Easing.bezier(0.5, 0, 0.75, 0),       // accelerate, for exits
    drift: Easing.bezier(0.4, 0, 0.6, 1),     // long slow pans
  },
  spring: {
    pop: { damping: 13, mass: 0.7, stiffness: 140 },
    settle: { damping: 18, mass: 1, stiffness: 90 },
    soft: { damping: 22, mass: 1.2, stiffness: 70 },
  },
  // every entrance ~20f, every exit ~10f
  t: { enter: 20, exit: 10, stagger: 4 },
} as const;
