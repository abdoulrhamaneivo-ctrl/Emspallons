/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emsp: {
          yellow: '#FDB913',
          green: '#2D5016',
          lightGreen: '#7CB342',
        },
      },
    },
  },
  plugins: [],
}

