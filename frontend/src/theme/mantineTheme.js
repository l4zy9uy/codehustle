// Centralized Mantine theme for typography and component defaults
const theme = {
  defaultRadius: 'sm',
  fontFamily: 'Inter, sans-serif',
  fontFamilyMonospace:
    "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
  },
  lineHeights: {
    xs: 1.6,
    sm: 1.6,
    md: 1.6,
    lg: 1.6,
    xl: 1.6,
  },
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 700, // default; overridden per size below
    sizes: {
      h1: { fontSize: 32, lineHeight: 1.2, fontWeight: 700 },
      h2: { fontSize: 28, lineHeight: 1.2, fontWeight: 700 },
      h3: { fontSize: 24, lineHeight: 1.2, fontWeight: 600 },
      h4: { fontSize: 20, lineHeight: 1.2, fontWeight: 600 },
      h5: { fontSize: 18, lineHeight: 1.2, fontWeight: 600 },
      h6: { fontSize: 16, lineHeight: 1.2, fontWeight: 600 },
    },
  },
  components: {
    // Defaults to reduce per-component overrides
    Text: { defaultProps: { size: 'md' } },
    Button: {
      defaultProps: { radius: 'xl', size: 'sm' },
      styles: { label: { fontWeight: 600 } },
    },
    TextInput: { defaultProps: { radius: 'xl', size: 'sm' } },
    Select: { defaultProps: { radius: 'xl', size: 'sm' } },
    MultiSelect: { defaultProps: { radius: 'xl', size: 'sm' } },
    Badge: {
      defaultProps: { radius: 'xl' },
      styles: { root: { fontWeight: 500 } },
    },
    Paper: { defaultProps: { radius: 'sm' } },
  },
};

export default theme;
