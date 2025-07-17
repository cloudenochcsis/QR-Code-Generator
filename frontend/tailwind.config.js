/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Red Palette (Brand Color)
        primary: {
          50: '#fef5f5',   // Light red tint for subtle highlights
          100: '#fee2e2',  // Very light red
          200: '#fecaca',  // Light red
          300: '#fca5a5',  // Medium light red
          400: '#f87171',  // Medium red
          500: '#e53e3e',  // Primary red (main brand color)
          600: '#dc2626',  // Darker red
          700: '#c53030',  // Dark red (hover states)
          800: '#991b1b',  // Very dark red
          900: '#7f1d1d',  // Darkest red
          950: '#450a0a',  // Almost black red
        },
        // Black/Gray Palette
        secondary: {
          50: '#f7fafc',   // Almost white
          100: '#edf2f7',  // Very light gray
          200: '#e2e8f0',  // Light gray
          300: '#cbd5e0',  // Medium light gray
          400: '#a0aec0',  // Medium gray
          500: '#718096',  // Gray
          600: '#4a5568',  // Dark gray
          700: '#2d3748',  // Very dark gray
          800: '#1a202c',  // Primary black (main text color)
          900: '#171923',  // Darker black
          950: '#0d1117',  // Darkest black
        },
        // Success Green (System Color)
        success: {
          50: '#f0fff4',
          100: '#c6f6d5',
          200: '#9ae6b4',
          300: '#68d391',
          400: '#48bb78',
          500: '#38a169',  // Primary success color
          600: '#2f855a',
          700: '#276749',
          800: '#22543d',
          900: '#1c4532',
          950: '#0f2419',
        },
        // Warning Orange (System Color)
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d69e2e',  // Primary warning color
          600: '#b7791f',
          700: '#975a16',
          800: '#744210',
          900: '#5f370e',
          950: '#451a03',
        },
        // Error uses Primary Red
        error: {
          50: '#fef5f5',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#e53e3e',  // Same as primary red
          600: '#dc2626',
          700: '#c53030',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
