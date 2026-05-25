const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx}',
        './src/components/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter var', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: '#004FBE',
                secondary: '#FBDC3B',
                success: '#22C55E',
                warning: '#EAB308',
                danger: '#EF4444',
                sideMenu: '#141f40',
                primaryBlue: '#0079fe',
                background: '#F2F2F2',
                secondBackground: '#E7E7E7',
                darkForeground: '#101936',
                lightForeground: '#172349',
                darkBackground: '#080E24',
                bookmarked: "#0079FE",
                invited: "#F2994A",
                applied: "#F2C94C",
                interviewing: "#27AE60",
                shortlisted: "#9B51E0",
                hired: "#56CCF2",
                subscribed: "#DA3E3E",
                lightGrey: "#818594",
                rating: "#F0A044",
                midBlue: '#3F5296',
                DarkTextGrey: "#BDBDBD",
                textGrey: "#818594",
                fieldOutline: "#2A306D",
                greenText: {
                    DEFAULT: "#27AE60",
                    500: 'rgba(0, 255, 0)'
                },
                greenBackground: {
                    DEFAULT: "#6FCF97",
                    200: 'rgba(74, 222, 128, 0.2)'
                },
                redText: {
                    DEFAULT: "#DA3E3E",
                    500: 'rgba(255, 0, 0)'
                },
                redBackground: {
                    DEFAULT: "#DA3E3E",
                    200: 'rgba(252, 165, 165, 0.2)'
                }
            },
            boxShadow: {
                'bookmarked': '0 0 15px rgba(242, 201, 76, 0.15)',
                'invited': '0 0 15px rgba(242, 153, 74, 0.15)',
                'applied': '0 0 15px rgba(242, 201, 76, 0.15)',
                'interviewing': '0 0 15px rgba(39, 174, 96, 0.15)',
                'shortlisted': '0 0 15px rgba(155, 81, 224, 0.15)',
                'hired': '0 0 15px rgba(86, 204, 242, 0.15)',
            },
        },
    },
    plugins: [require('@tailwindcss/forms'), require('tailwind-scrollbar')],
};
