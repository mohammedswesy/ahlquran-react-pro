/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                /* Primary Scale (Teal) */
                brand: {
                    50: "#EAF5F3",
                    100: "#D6ECE8",
                    200: "#ADD9D1",
                    300: "#7FC3B6",
                    400: "#4FA99A",
                    500: "#003d35", // Primary
                    600: "#00352E",
                    700: "#002C26",
                    800: "#00231E",
                    900: "#001A16",
                },

                /* Secondary Scale (Sand/Gold) */
                accent: {
                    50: "#FBF7EE",
                    100: "#F6EEDA",
                    200: "#EEDDAB",
                    300: "#E7D07F",
                    400: "#E1C255",
                    500: "#dccba0", // Secondary
                    600: "#CBB989",
                    700: "#B7A472",
                    800: "#9B885A",
                    900: "#7C6A44",
                },

                /* Keep your slatebg as-is */
                slatebg: {
                    50: "#F8FAFC",
                    100: "#F1F5F9",
                    200: "#E2E8F0",
                    300: "#CBD5E1",
                    400: "#94A3B8",
                    500: "#64748B",
                    600: "#475569",
                    700: "#334155",
                    800: "#1F2937",
                    900: "#0F172A",
                },

                /* White token (optional usage) */
                whiteqc: "#fefefe",
            },

            borderRadius: {
                xl: "14px",
                "2xl": "18px",
                "3xl": "24px",
            },

            boxShadow: {
                soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
                card: "0 8px 24px rgba(15, 23, 42, 0.10)",
            },
        },
    },
    plugins: [],
}
