export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        bg:  '#0a0a0a',
        s1:  '#111111',
        s2:  '#1a1a1a',
        s3:  '#222222',
        b1:  '#2a2a2a',
        b2:  '#333333',
        t1:  '#ffffff',
        t2:  '#a1a1a1',
        t3:  '#666666',
      },
    },
  },
  plugins: [],
}