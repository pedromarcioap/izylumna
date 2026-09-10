/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#01743F', // Turf Green (Primária principal)
          emerald: '#4CB963', // Emerald (Suporte e acentos)
          accent: '#FEF600',  // Bright Lemon (Destaque e atenção)
          ochre: '#D57720',   // Ochre (Secundária quente)
          dark: '#4F3926',    // Deep Walnut (Neutro escuro e tipografia base)
        },
      },
    },
  },
  plugins: [],
};
