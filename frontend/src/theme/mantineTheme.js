// Centralized Mantine theme for typography and component defaults
import {createTheme} from "@mantine/core";

const theme = createTheme({
    defaultRadius: 'sm',
    fontFamily: 'Inter, sans-serif',
    fontFamilyMonospace: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSizes: {
        xs: 12, sm: 14, md: 16, lg: 18, xl: 20,
    },
    lineHeights: {
        xs: 1.6, sm: 1.6, md: 1.6, lg: 1.6, xl: 1.6,
    },
    headings: {
        fontFamily: 'Inter, sans-serif', fontWeight: 700, // default; overridden per size below
        sizes: {
            // Refactoring UI — Establish a clear type scale (p. 102)
            // UI-friendly, gentle ratio for hierarchy
            h1: {fontSize: 36, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.01em'},
            h2: {fontSize: 30, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.005em'},
            h3: {fontSize: 24, lineHeight: 1.2, fontWeight: 600},
            h4: {fontSize: 20, lineHeight: 1.2, fontWeight: 600},
            h5: {fontSize: 18, lineHeight: 1.2, fontWeight: 600},
            h6: {fontSize: 16, lineHeight: 1.2, fontWeight: 600},
        },
    }, // Refactoring UI — Establish a spacing system (p. 70)
    // Tokens: 4, 8, 12, 16, 24, 32, 48, 64
    spacing: {
        xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64,
    },
    primaryColor: 'blue',
    primaryShade: { light: 6, dark: 7 },
    components: {
        // Defaults to reduce per-component overrides
        Text: {defaultProps: {size: 'md'}},
        Button: {
            defaultProps: {radius: 'xl', size: 'sm'}, styles: {label: {fontWeight: 600}},
        },
        AppShell: {
            defaultProps: {
                // Use theme-controlled padding by default; pages may override
                padding: 'xl',
            },
        },
        TextInput: {defaultProps: {radius: 'xl', size: 'sm'}},
        Select: {defaultProps: {radius: 'xl', size: 'sm'}},
        MultiSelect: {defaultProps: {radius: 'xl', size: 'sm'}},
        Badge: {
            defaultProps: {radius: 'xl'}, styles: {root: {fontWeight: 500}},
        },
        Paper: {defaultProps: {radius: 'sm'}},
    },
});

export default theme;
