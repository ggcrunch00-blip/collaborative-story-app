/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic — prefer these
        app:       'var(--bg-app)',
        surface:   'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        overlay:   'var(--bg-overlay)',
        inverse:   'var(--bg-inverse)',

        'fg-1':          'var(--fg-1)',
        'fg-2':          'var(--fg-2)',
        'fg-3':          'var(--fg-3)',
        'fg-disabled':   'var(--fg-disabled)',
        'fg-on-brand':   'var(--fg-on-brand)',

        brand: {
          DEFAULT:      'var(--brand)',
          hover:        'var(--brand-hover)',
          pressed:      'var(--brand-pressed)',
          soft:         'var(--brand-soft)',
          'soft-border':'var(--brand-soft-border)',
        },
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
        danger:  { DEFAULT: 'var(--danger)',  soft: 'var(--danger-soft)'  },

        'phase-waiting': 'var(--phase-waiting)',
        'phase-reading': 'var(--phase-reading)',
        'phase-writing': 'var(--phase-writing)',
        'phase-done':    'var(--phase-done)',

        // Ramps — raw palette
        crayon: { 50:'#EAF2FE',100:'#CFE0FC',200:'#A6C4F8',300:'#6FA1F2',400:'#3B82F6',500:'#2568D6',600:'#1A52B0',700:'#123E87' },
        sprout: { 50:'#E6F5EE',100:'#C2E6D2',300:'#5FC394',500:'#10B981',700:'#0A7A56' },
        sun:    { 50:'#FEF3DD',100:'#FCE4B0',300:'#F8C25E',500:'#F59E0B',700:'#B67307' },
        berry:  { 50:'#FDE7E7',100:'#FBC5C5',300:'#F58686',500:'#EF4444',700:'#B42828' },
        plum:   { 50:'#F6EDF6',300:'#C590C5',500:'#8E4C8E',700:'#5E2D5E' },
        ink:    { 900:'#1C1A17',700:'#3D3630',500:'#6B615A',300:'#A79E95',200:'#D6CFC5',100:'#EAE4DA' },
        paper:  { 0:'#FFFFFF',50:'#FBF7EF',100:'#F5EEDF',200:'#EDE3CE' },
      },
      borderColor: {
        subtle:   'var(--border-subtle)',
        DEFAULT:  'var(--border-default)',
        default:  'var(--border-default)',
        strong:   'var(--border-strong)',
      },
      fontFamily: {
        sans:    ['var(--font-sans)',    'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      fontSize: {
        xs:     ['13px', { lineHeight: '1.3' }],
        sm:     ['15px', { lineHeight: '1.3' }],
        md:     ['17px', { lineHeight: '1.55' }],
        lg:     ['20px', { lineHeight: '1.55' }],
        xl:     ['24px', { lineHeight: '1.3' }],
        '2xl':  ['32px', { lineHeight: '1.3' }],
        '3xl':  ['44px', { lineHeight: '1.15' }],
        '4xl':  ['64px', { lineHeight: '1.15' }],
        '5xl':  ['96px', { lineHeight: '1.15' }],
        story:  ['20px', { lineHeight: '1.75' }],
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        sm:    '0 1px 2px rgba(61,54,48,.06), 0 1px 1px rgba(61,54,48,.04)',
        md:    '0 2px 4px rgba(61,54,48,.06), 0 6px 16px rgba(61,54,48,.08)',
        lg:    '0 4px 8px rgba(61,54,48,.08), 0 16px 40px rgba(61,54,48,.10)',
        focus: '0 0 0 4px rgba(37,104,214,.25)',
        inset: 'inset 0 1px 2px rgba(61,54,48,.08)',
        'btn-brand':        '0 2px 0 0 #1A52B0',
        'btn-brand-hover':  '0 1px 0 0 #123E87',
        'btn-danger':       '0 2px 0 0 #B42828',
        'btn-danger-hover': '0 1px 0 0 #7E1C1C',
      },
      transitionTimingFunction: {
        out:    'cubic-bezier(.22,.61,.36,1)',
        bounce: 'cubic-bezier(.34,1.56,.64,1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '360ms',
      },
      maxWidth: {
        content: '720px',
        kit:     '1280px',
      },
      keyframes: {
        'pulse-strong': { '0%,100%': { opacity: '1' }, '50%': { opacity: '.6' } },
        'wait-dot':     { '0%,100%': { opacity: '.3', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.4)' } },
      },
      animation: {
        'pulse-strong': 'pulse-strong 1s ease-in-out infinite',
        'wait-dot':     'wait-dot 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
