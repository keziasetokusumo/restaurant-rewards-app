import { TextStyle } from 'react-native';

export const typography = {
  h1:      { fontSize: 28, fontWeight: '700', lineHeight: 34 } as TextStyle,
  h2:      { fontSize: 18, fontWeight: '600', lineHeight: 24 } as TextStyle,
  bodyLg:  { fontSize: 16, fontWeight: '400', lineHeight: 24 } as TextStyle,
  body:    { fontSize: 14, fontWeight: '400', lineHeight: 20 } as TextStyle,
  label:   { fontSize: 13, fontWeight: '600', lineHeight: 18, letterSpacing: 0.2 } as TextStyle,
  caption: { fontSize: 11, fontWeight: '600', lineHeight: 16, letterSpacing: 0.4 } as TextStyle,
} as const;
