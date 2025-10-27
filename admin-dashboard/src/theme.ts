import { defaultTheme } from 'react-admin';
import { createTheme } from '@mui/material/styles';

// Duel Tech Brand Colors
export const BRAND_COLORS = {
  primary: '#56CDED',        // Cyan/Turquoise - primary brand color
  dark: '#101010',           // Dark Charcoal - text and dark elements
  light: '#F3F3EF',          // Light Off-White - backgrounds and borders

  // Derived color palette
  cyan: '#56CDED',
  cyanLight: '#7DD9F1',
  cyanDark: '#2DB8E5',
  teal: '#4ECDC4',
  blue: '#45B7D1',
  darkBlue: '#2E86AB',
};

// Create custom theme for React Admin
export const duelTheme = createTheme({
  ...defaultTheme,
  palette: {
    primary: {
      main: BRAND_COLORS.primary,
      light: BRAND_COLORS.cyanLight,
      dark: BRAND_COLORS.cyanDark,
      contrastText: '#fff',
    },
    secondary: {
      main: BRAND_COLORS.teal,
      light: BRAND_COLORS.blue,
      dark: BRAND_COLORS.darkBlue,
      contrastText: '#fff',
    },
    background: {
      default: '#fafafa',
      paper: '#fff',
    },
    text: {
      primary: BRAND_COLORS.dark,
      secondary: 'rgba(16, 16, 16, 0.7)',
    },
    success: {
      main: BRAND_COLORS.teal,
    },
    info: {
      main: BRAND_COLORS.blue,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    ...defaultTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: BRAND_COLORS.primary,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: BRAND_COLORS.primary,
          color: '#fff',
        },
      },
    },
  },
  sidebar: {
    width: 240,
    closedWidth: 55,
  },
});
