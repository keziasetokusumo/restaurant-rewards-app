// Dark navy-purple base with turquoise primary and warm gold rewards.
export const colors = {
  primary: '#2DD4BF',      // turquoise — primary actions, brand
  primaryDark: '#0FB8A3',
  primarySoft: '#0A2825',  // dark teal tint for backgrounds and pressed states

  reward: '#FBBF24',       // warm gold — earned rewards, success
  rewardSoft: '#231A00',   // dark amber tint for reward backgrounds

  accent: '#F97316',       // orange — highlights, celebration moments

  ink: '#EEF2FF',          // primary text (cool near-white)
  inkMuted: '#8B95AB',     // secondary text
  inkFaint: '#4B5568',     // captions, placeholders
  line: '#1C1C3A',         // borders, dividers
  surface: '#13132A',      // cards (elevated above background)
  background: '#09091C',   // app background (deep navy-purple)

  danger: '#F87171',
  warning: '#FBBF24',
  success: '#2DD4BF',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorToken = keyof typeof colors;
