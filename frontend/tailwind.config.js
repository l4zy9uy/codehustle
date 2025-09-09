/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            // Refactoring UI — Spacing system parity with Mantine (p. 70)
            spacing: {
                xs: '4px',
                sm: '8px',
                md: '12px',
                lg: '16px',
                xl: '24px',
                '2xl': '32px',
                '3xl': '48px',
                '4xl': '64px',
            },
        },
    },
    plugins: [],
}
