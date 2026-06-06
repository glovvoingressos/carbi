import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'supabase/**', 'scratch/**', 'docs/**', 'backups/**'],
  },
]

export default config
