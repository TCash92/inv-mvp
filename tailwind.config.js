/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Industrial safety colors
        safety: {
          green: 'hsl(var(--safety-green))',
          yellow: 'hsl(var(--safety-yellow))',
          red: 'hsl(var(--safety-red))',
          blue: 'hsl(var(--safety-blue))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        // Larger font sizes for industrial use
        'mobile-xs': ['14px', '20px'],
        'mobile-sm': ['16px', '24px'],
        'mobile-base': ['18px', '28px'],
        'mobile-lg': ['20px', '32px'],
        'mobile-xl': ['24px', '36px'],
      },
      spacing: {
        // Touch-friendly spacing
        'touch-sm': '12px',
        'touch-md': '16px',
        'touch-lg': '24px',
        'touch-xl': '32px',
      },
      minHeight: {
        'touch': '3.5rem', // 56dp minimum touch target
        'touch-lg': '4rem',  // 64dp for primary actions
      },
      minWidth: {
        'touch': '3.5rem',
        'touch-lg': '4rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};