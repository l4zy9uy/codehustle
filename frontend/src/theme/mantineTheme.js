// Centralized Mantine theme for typography and component defaults
import {createTheme} from "@mantine/core";

const theme = createTheme({
    defaultRadius: 'sm',
    fontFamily: 'Inter, sans-serif',
    fontFamilyMonospace: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSizes: {
        xs: '10px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '28px',
        // custom size
        huge: '40px',
    },
    lineHeights: {
        xs: 1.6, sm: 1.6, md: 1.6, lg: 1.6, xl: 1.6,
    },
    headings: {
        fontFamily: 'Inter, sans-serif', fontWeight: 700, // default; overridden per size below
        sizes: {
            // Refactoring UI — Establish a clear type scale (p. 102)
            // UI-friendly, gentle ratio for hierarchy
            h1: {fontSize: '36px', lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.01em'},
            h2: {fontSize: '30px', lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.005em'},
            h3: {fontSize: '24px', lineHeight: 1.2, fontWeight: 600},
            h4: {fontSize: '20px', lineHeight: 1.2, fontWeight: 600},
            h5: {fontSize: '18px', lineHeight: 1.2, fontWeight: 600},
            h6: {fontSize: '16px', lineHeight: 1.2, fontWeight: 600},
        },
    }, // Refactoring UI — Establish a spacing system (p. 70)
    // Tokens: 4, 8, 12, 16, 24, 32, 48, 64
    spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
        "4xl": "64px",
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
