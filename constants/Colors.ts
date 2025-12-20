/**
 * Design tokens for colors used across the app.
 *
 * - Two top-level themes: `light` and `dark`.
 * - Each theme defines semantic tokens (text, background, tint, icon, tabIcon*).
 * - Components should prefer these semantic tokens over hard-coded colors to keep
 *   the UI consistent, themeable, and easy to change.
 *
 * Note: You can adopt a utility or style system (e.g. NativeWind, Tamagui, Unistyles)
 * later. Keeping tokens centralized here makes that migration straightforward.
 */

const themeTeal = "#00ADB5"

export const Colors = {
  light: {
    text: '#11181C',
    background: '#f5f3f3',
    tint: themeTeal,
    slight: "#d0d0d0",
    slightText: '#565656',
    tabIconDefault: '#687076',
    tabIconSelected: themeTeal,
  },
  dark: {
    text: '#f5f3f3',
    background: '#151718',
    tint: themeTeal,
    slight: "#363636",
    slightText: '#B9B9B9',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: themeTeal,
  },
  accents: {
    blue: "#00ADB5", 
    green: "#4ade80",
    purple: "#c084fc",
    gold: "#e0ab00",
    red: '#f73b3b',
  }
};
