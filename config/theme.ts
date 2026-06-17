export type ThemePalette = {
  name: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};

export const themePalettes: Record<string, ThemePalette> = {
  ocean: {
    name: 'Ocean',
    light: {
      background: '#f6f8fb',
      surface: '#ffffff',
      surfaceSoft: '#eef4f7',
      border: '#d8e3ea',
      text: '#17212b',
      textMuted: '#5d6b78',
      primary: '#0f766e',
      primarySoft: '#d8f3ef'
    },
    dark: {
      background: '#0b1220',
      surface: '#121a2b',
      surfaceSoft: '#182235',
      border: '#25324a',
      text: '#ebf2ff',
      textMuted: '#93a4bf',
      primary: '#5eead4',
      primarySoft: '#153e3a'
    }
  },
  violet: {
    name: 'Violet',
    light: {
      background: '#faf7ff',
      surface: '#ffffff',
      surfaceSoft: '#f4edff',
      border: '#e5d7ff',
      text: '#24163d',
      textMuted: '#6d6290',
      primary: '#7c3aed',
      primarySoft: '#ede9fe'
    },
    dark: {
      background: '#120f1f',
      surface: '#1a162b',
      surfaceSoft: '#241d3a',
      border: '#3a2e61',
      text: '#f5f3ff',
      textMuted: '#b3a7d4',
      primary: '#a78bfa',
      primarySoft: '#312454'
    }
  }
};

export const defaultPalette = 'ocean';
