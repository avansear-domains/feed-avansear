import plugin from 'tailwindcss/plugin'

const appUtilities = plugin(({ addUtilities }) => {
  const utilities: Record<string, Record<string, string>> = {
    '.color-dark': { color: 'var(--feed-bg)' },
    '.color-light': { color: 'var(--feed-text)' },
    '.bg-color-dark': { backgroundColor: 'var(--feed-bg)' },
    '.bg-color-light': { backgroundColor: 'var(--feed-text)' },
  }

  for (let i = 0; i <= 100; i += 1) {
    utilities[`.color-dark-${i}`] = {
      color: `color-mix(in srgb, var(--feed-bg) ${i}%, transparent)`,
    }
    utilities[`.color-light-${i}`] = {
      color: `color-mix(in srgb, var(--feed-text) ${i}%, transparent)`,
    }
    utilities[`.bg-color-dark-${i}`] = {
      backgroundColor: `color-mix(in srgb, var(--feed-bg) ${i}%, transparent)`,
    }
    utilities[`.bg-color-light-${i}`] = {
      backgroundColor: `color-mix(in srgb, var(--feed-text) ${i}%, transparent)`,
    }
  }

  for (let i = 1; i <= 128; i += 1) {
    utilities[`.font-size-${i}`] = {
      fontSize: `${i}px`,
    }
  }

  addUtilities(utilities)
})

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './styles/**/*.{css}'],
  plugins: [appUtilities],
}
