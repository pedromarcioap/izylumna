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
          primary: '#8300E9',       // Ultra Violet (Primária principal - Luxo e Criatividade)
          primaryHover: '#6E00C4',
          cyan: '#46BDC6',          // Strong Cyan (Suporte e Acentos - Confiança e Clareza)
          cyanHover: '#3AA3AC',
          accent: '#FDBD00',        // Amber Gold (Destaque e Atenção - Energia e Avaliação)
          accentHover: '#E5AA00',
          flame: '#F94713',         // Blazing Flame (Ação Quente e Alertas - Dinamismo)
          flameHover: '#DF3908',
          mist: '#E4F0F1',          // Azure Mist (Superfície Claro e Mist)
          dark: '#160F29',          // Midnight Obsidian (Neutro Escuro e Tipografia Base)
          emerald: '#46BDC6',       // Suporte a legado: mapeado para Strong Cyan
          ochre: '#F94713',         // Suporte a legado: mapeado para Blazing Flame
        },
      },
    },
  },
  plugins: [],
};
