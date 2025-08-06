module.exports = {
    darkMode: 'class', // Use class-based dark mode
    content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {
        colors: {
          // Define light/dark colors
          light: {
            primary: '#3b82f6',
            background: '#ffffff',
            text: '#1e293b',
          },
          dark: {
            primary: '#60a5fa',
            background: '#0f172a',
            text: '#f8fafc',
          }
        }
      }
    }
  }