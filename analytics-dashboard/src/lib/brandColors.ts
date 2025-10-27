// Duel Tech Brand Colors
export const BRAND_COLORS = {
  primary: '#56CDED',        // Cyan/Turquoise - primary brand color
  dark: '#101010',           // Dark Charcoal - text and dark elements
  light: '#F3F3EF',          // Light Off-White - backgrounds and borders

  // Derived color palette for charts (based on primary cyan)
  cyan: '#56CDED',
  cyanLight: '#7DD9F1',
  cyanDark: '#2DB8E5',
  teal: '#4ECDC4',
  blue: '#45B7D1',
  darkBlue: '#2E86AB',

  // Gradient definitions
  gradients: {
    primary: {
      start: '#56CDED',
      end: '#2E86AB',
    },
    success: {
      start: '#56CDED',
      end: '#4ECDC4',
    },
  },
}

// Badge/Label colors for ranking and metrics
export const BADGE_COLORS = {
  first: '#56CDED',      // Primary cyan for 1st place
  second: '#4ECDC4',     // Teal for 2nd place
  third: '#45B7D1',      // Blue for 3rd place
  accent: '#4ECDC4',     // Teal for accent badges
  info: '#45B7D1',       // Blue for info badges
}

// Chart color palette - variations of brand colors for multi-series charts
export const CHART_COLORS = [
  '#56CDED',  // Primary cyan
  '#7DD9F1',  // Light cyan
  '#2DB8E5',  // Dark cyan
  '#4ECDC4',  // Teal
  '#45B7D1',  // Blue
  '#2E86AB',  // Dark blue
]

// Create linear gradient helper for ECharts
export const createLinearGradient = (startColor: string, endColor: string) => ({
  type: 'linear' as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: startColor },
    { offset: 1, color: endColor },
  ],
})

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Create area style with opacity for line charts
export const createAreaStyle = (color: string, startOpacity = 0.5, endOpacity = 0.1) => ({
  color: {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: hexToRgba(color, startOpacity) },
      { offset: 1, color: hexToRgba(color, endOpacity) },
    ],
  },
})
